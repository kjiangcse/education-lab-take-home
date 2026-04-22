'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Chat, Config, Message, TurnStateSnapshot } from './types/chat'
import { DEFAULT_CONFIG, SCRIPTED_DEMO_MESSAGES, SEED_CHATS } from './seed'

/** Demo chats never persist across reloads — they always rehydrate from
 *  SEED_CHATS so the scripted base state is the source of truth. Any live
 *  interaction with them is in-memory only until the next page load. */
function isDemoChatId(id: string): boolean {
  return id.startsWith('demo-')
}
import { DEFAULT_MODEL, MODELS, streamChat, type Model } from './api'
import { parseEditsFromText, attachEditsAsFeedback, hasFeedbackTargets } from './edit-parser'
import { useLesson } from './lesson-context'
import { DEMO_TURNS } from './demo-scenario'
import { applyFeedbacksToLesson } from './lesson-edits'
import { DEMO_CHAT_LESSON_MAP } from './seed'
import type { ToolActivityEvent } from '@/components/chat/ToolActivity'

/** Scripted feedback applications that run at the START of each demo turn.
 *  Keyed by chat id → turn index (0-based) → list of block/item ids whose
 *  pending feedback should auto-apply before the turn's messages render. */
const DEMO_AUTO_APPLY_BY_TURN: Record<string, Record<number, string[]>> = {
  'demo-blooms': {
    1: ['section-1', 'section-2'],
    2: ['section-3'],
  },
}

/** Overlay to set on the right panel at the START of a demo turn. Matches
 *  the talk-track promise that Claude "enables the Bloom's overlay" in
 *  scenario 2 — the overlay switches programmatically when turn 1 fires so
 *  the per-section tags are visible alongside the coverage widget. */
const DEMO_OVERLAY_BY_TURN: Record<string, Record<number, 'preview' | 'feedback' | 'blooms'>> = {
  'demo-blooms': {
    0: 'blooms',
  },
}

type ChatStore = {
  config: Config
  models: Model[]
  model: Model
  setModel: (model: Model) => void
  chats: Chat[]
  thinking: boolean
  streamBuffer: string
  streamingChatId: string | null
  toolEvents: ToolActivityEvent[]
  createChat: (text: string) => string
  sendReply: (chatId: string, text: string) => void
  deleteChat: (chatId: string) => void
  stopStream: () => void
  demoTurnByChatId: Record<string, number>
  demoBusy: boolean
  advanceDemo: (chatId: string) => void
}

const ChatContext = createContext<ChatStore | null>(null)

const STORAGE_KEY = 'education-labs:chats'

function makeTitle(text: string) {
  const first = text.trim().split('\n')[0]
  return first.length > 40 ? first.slice(0, 40) + '…' : first
}

export function ChatProvider({ children }: { children: ReactNode }) {
  // ChatProvider is nested inside LessonProvider in the root layout, so it
  // reads the current lesson/course and the update/open-panel actions
  // directly from context — no more window-globals bridge.
  const { lesson, lessons, lessonId, course, view, overlayByChat, actions } = useLesson()

  const [config] = useState<Config>(DEFAULT_CONFIG)
  const [model, setModel] = useState<Model>(DEFAULT_MODEL)
  const [chats, setChats] = useState<Chat[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [streamingChatId, setStreamingChatId] = useState<string | null>(null)
  const [toolEvents, setToolEvents] = useState<ToolActivityEvent[]>([])
  const [demoTurnByChatId, setDemoTurnByChatId] = useState<Record<string, number>>({})
  const [demoBusy, setDemoBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bufferRef = useRef('')
  const eventsRef = useRef<ToolActivityEvent[]>([])
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refs so commitAssistant/runCompletion always read the LATEST lesson state
  // at call time, not the state captured when the callback closure was built.
  // Without this, an in-flight turn that switches lessons mid-stream (via
  // get_lesson tool → openPanel) commits the message with the old lesson id,
  // and every inline card inside it resolves against the wrong lesson.
  const lessonRef = useRef(lesson)
  const lessonsRef = useRef(lessons)
  const lessonIdRef = useRef(lessonId)
  const courseRef = useRef(course)
  const viewRef = useRef(view)
  const overlayByChatRef = useRef(overlayByChat)
  lessonRef.current = lesson
  lessonsRef.current = lessons
  lessonIdRef.current = lessonId
  courseRef.current = course
  viewRef.current = view
  overlayByChatRef.current = overlayByChat

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) {
      setChats(SEED_CHATS)
      setHydrated(true)
      return
    }
    try {
      const parsed: Chat[] = JSON.parse(stored)
      // Demo chats are ephemeral: the source of truth is always the current
      // SEED_CHATS entry so edits to scripted demo content propagate on reload.
      // Any in-session interaction with a demo chat stays in memory until the
      // next reload, then resets to the seed version.
      const nonDemoStored: Chat[] = parsed
        .filter((c) => !isDemoChatId(c.id))
        .map((c) => ({ id: c.id, title: c.title, messages: c.messages }))
      // Rebuild in seed-array order: seeds first (as authored), then any
      // non-demo user-created chats that aren't already in the seeds.
      const out: Chat[] = []
      SEED_CHATS.forEach((seed) => out.push(seed))
      nonDemoStored.forEach((c) => {
        const existing = out.findIndex((x) => x.id === c.id)
        if (existing >= 0) out[existing] = c
        else out.push(c)
      })
      setChats(out)
    } catch {
      setChats(SEED_CHATS)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Persist non-demo chats only — demo-* chats reset to their seeded base
    // state on every reload so the demo always starts from a known point.
    if (hydrated) {
      const persistable = chats.filter((c) => !isDemoChatId(c.id))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
    }
  }, [chats, hydrated])

  const commitAssistant = useCallback((chatId: string, text: string, events?: ToolActivityEvent[]) => {
    // Snapshot all events as 'done' on commit — any still-'running' ones are
    // either aborted or late-arriving tool_result frames we don't care about.
    const finalizedEvents = events && events.length > 0
      ? events.map((e) => ({ ...e, status: 'done' as const }))
      : undefined

    // Read lesson/course/etc. through refs so an in-flight turn that swapped
    // lessons mid-stream commits with the CURRENT lesson, not whatever was
    // captured when this callback was first built. Without this, tool-driven
    // lesson switches (get_lesson → openPanel) lose their effect on commit.
    const currentLesson = lessonRef.current
    const currentCourse = courseRef.current
    const currentLessons = lessonsRef.current
    const currentLessonId = lessonIdRef.current
    const currentView = viewRef.current
    const currentOverlayByChat = overlayByChatRef.current

    const turnLessonId = currentLesson?.id

    // Parse edit blocks BEFORE snapshotting. The message's frozen lesson must
    // include the pending feedback the reply just proposed — otherwise the
    // {{{card:diff:ID}}} artifacts in the message resolve against the pre-attach
    // state and render "No proposed edits" even though the right panel shows
    // them. Cards render the state Claude WAS describing, which includes its
    // own proposals.
    const edits = parseEditsFromText(text)
    const patchedLesson = (edits.length > 0 && currentLesson)
      ? attachEditsAsFeedback(currentLesson, edits)
      : currentLesson

    const lessonSnapshot = patchedLesson
    const stateSnapshot: TurnStateSnapshot = {
      course: currentCourse,
      lessons: currentLessons,
      lessonId: currentLessonId,
      view: currentView,
      overlay: currentOverlayByChat[chatId],
      timestamp: Date.now(),
    }

    setChats((cs) =>
      cs.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, { role: 'assistant' as const, text, toolEvents: finalizedEvents, lessonId: turnLessonId, lessonSnapshot, stateSnapshot }] }
          : c,
      ),
    )

    // Push the patched lesson into the shared store so the right panel, the
    // Bloom's overlay, and subsequent turns see the attached feedback. Auto-
    // switch the overlay to Feedback so proposals are visible the moment they
    // land — but only when at least one edit targets a block/item (scalars
    // and objectives apply directly and don't use the feedback surface).
    if (edits.length > 0 && currentLesson && patchedLesson) {
      actions.updateLesson(currentLesson.id, patchedLesson)
      if (hasFeedbackTargets(edits)) {
        actions.setOverlay(chatId, 'feedback')
      }
    }
  }, [actions])

  const reset = useCallback(() => {
    setThinking(false)
    setStreamBuffer('')
    setStreamingChatId(null)
    setToolEvents([])
    abortRef.current = null
    bufferRef.current = ''
    eventsRef.current = []
  }, [])

  const stopStream = useCallback(() => {
    const chatId = streamingChatId
    const partial = bufferRef.current
    abortRef.current?.abort()
    if (chatId && partial) commitAssistant(chatId, partial, eventsRef.current)
    reset()
  }, [streamingChatId, commitAssistant, reset])

  const runCompletion = useCallback(
    async (chatId: string, history: Message[]) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      bufferRef.current = ''

      setThinking(true)
      setStreamingChatId(chatId)
      setStreamBuffer('')
      setToolEvents([])
      eventsRef.current = []

      try {
        const text = await streamChat(
          history,
          model,
          {
            onDelta: (delta) => {
              bufferRef.current += delta
              setStreamBuffer(bufferRef.current)
            },
            onToolCall: (ev) => {
              // Inject an inline marker at the stream position where the tool
              // fired so the pill renders in sequence with surrounding prose,
              // not as a detached block at the top of the message.
              const marker = `\n\n{{{tool:${ev.id}}}}\n\n`
              bufferRef.current += marker
              setStreamBuffer(bufferRef.current)

              const newEvent: ToolActivityEvent = {
                id: ev.id,
                name: ev.name,
                input: ev.input,
                status: 'running',
              }
              eventsRef.current = [...eventsRef.current, newEvent]
              setToolEvents(eventsRef.current)

              // Auto-open the right panel when Claude fetches a lesson or the
              // course — the user should see what's being discussed.
              const input = (ev.input ?? {}) as Record<string, unknown>
              if (ev.name === 'get_lesson' && typeof input.lesson_id === 'string') {
                actions.openPanel({ chatId, lessonId: input.lesson_id })
              } else if (ev.name === 'get_course') {
                actions.openPanel({ chatId, course: true })
              }
            },
            onToolResult: (ev) => {
              eventsRef.current = eventsRef.current.map((t) =>
                t.id === ev.id ? { ...t, status: 'done' as const } : t,
              )
              setToolEvents(eventsRef.current)
            },
          },
          controller.signal,
          {
            lesson: lesson as unknown as Record<string, unknown>,
            course: course as unknown as Record<string, unknown>,
          },
        )
        // Persist the final text + tool events together on the committed message
        // so the pills survive re-render / navigation.
        commitAssistant(chatId, bufferRef.current || text, eventsRef.current)
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') console.error(err)
      } finally {
        if (abortRef.current === controller) reset()
      }
    },
    [model, commitAssistant, reset, lesson, course, actions],
  )

  const createChat = useCallback(
    (text: string) => {
      const id = 'c' + Date.now()
      const stateSnapshot: TurnStateSnapshot = {
        course,
        lessons,
        lessonId,
        view,
        overlay: overlayByChat[id],
        timestamp: Date.now(),
      }
      const userMsg: Message = { role: 'user', text, stateSnapshot }
      const chat: Chat = { id, title: makeTitle(text), messages: [userMsg] }
      setChats((cs) => [chat, ...cs])
      runCompletion(id, [userMsg])
      return id
    },
    [runCompletion, course, lessons, lessonId, view, overlayByChat],
  )

  const deleteChat = useCallback(
    (chatId: string) => {
      if (streamingChatId === chatId) abortRef.current?.abort()
      setChats((cs) => {
        const next = cs.filter((c) => c.id !== chatId)
        return next.length > 0 ? next : SEED_CHATS
      })
    },
    [streamingChatId],
  )

  const sendReply = useCallback(
    (chatId: string, text: string) => {
      const stateSnapshot: TurnStateSnapshot = {
        course,
        lessons,
        lessonId,
        view,
        overlay: overlayByChat[chatId],
        timestamp: Date.now(),
      }
      const userMsg: Message = { role: 'user', text, stateSnapshot }
      let nextHistory: Message[] = []

      setChats((cs) =>
        cs.map((c) => {
          if (c.id !== chatId) return c
          nextHistory = [...c.messages, userMsg]
          return { ...c, messages: nextHistory }
        }),
      )

      runCompletion(chatId, nextHistory)
    },
    [runCompletion, course, lessons, lessonId, view, overlayByChat],
  )

  const advanceDemo = useCallback(
    (chatId: string) => {
      // Gate: don't double-fire, and don't collide with a live API stream.
      if (demoBusy || streamingChatId) return
      const idx = demoTurnByChatId[chatId] ?? 0

      // Prefer the chat-specific scripted messages (seed.ts) over the generic
      // DEMO_TURNS fallback so scenario 1 & 2 replay their authored content
      // — including {{{card:...}}} markers and lesson snapshots — verbatim.
      const scripted = SCRIPTED_DEMO_MESSAGES[chatId]
      let userMsg: Message
      let assistantMsg: Message

      if (scripted) {
        const pairStart = idx * 2
        if (pairStart + 1 >= scripted.length) return
        userMsg = { ...scripted[pairStart], animate: true }
        // No animate flag on the assistant — it streams in instead of fading.
        assistantMsg = { ...scripted[pairStart + 1] }
      } else {
        const turn = DEMO_TURNS[idx]
        if (!turn) return
        userMsg = { role: 'user', text: turn.user, animate: true }
        assistantMsg = { role: 'assistant', text: turn.assistant }
      }

      // Scripted overlay switch: turn 1 of the Bloom's scenario flips the
      // right-panel overlay to 'blooms' so the per-section tags the talk
      // track references are visible the moment the coverage widget lands.
      const turnOverlay = DEMO_OVERLAY_BY_TURN[chatId]?.[idx]
      if (turnOverlay) {
        actions.setOverlay(chatId, turnOverlay)
      }

      // Scripted auto-apply: at the start of certain turns, apply the
      // feedback the prior turn proposed. The assistant snapshot is then
      // overridden with the post-apply lesson so inline coverage widgets
      // reflect the new state, not the pre-edit seed.
      const autoApplyIds = DEMO_AUTO_APPLY_BY_TURN[chatId]?.[idx] ?? []
      const autoApplyLessonId = DEMO_CHAT_LESSON_MAP[chatId]
      if (autoApplyIds.length > 0 && autoApplyLessonId) {
        const currentLesson = lessons.find((l) => l.id === autoApplyLessonId)
        if (currentLesson) {
          const nextLesson = applyFeedbacksToLesson(currentLesson, autoApplyIds)
          if (nextLesson !== currentLesson) {
            actions.updateLesson(
              autoApplyLessonId,
              { blocks: nextLesson.blocks },
              `Demo turn ${idx + 1}: auto-apply`,
            )
            assistantMsg = {
              ...assistantMsg,
              lessonId: assistantMsg.lessonId ?? autoApplyLessonId,
              lessonSnapshot: nextLesson,
            }
          }
        }
      }

      setDemoBusy(true)

      // 1. Drop the user message (fades in via .demo-fade-in on mount).
      setChats((cs) =>
        cs.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, userMsg] } : c)),
      )

      const userFadeMs = 450
      const pauseMs = 400
      const thinkingMs = 400
      // Chars emitted per tick; 20ch * 60fps ≈ 1200 ch/s — fast enough to feel
      // like real streaming, slow enough to watch the review unfold.
      const chunkChars = 20
      const tickMs = 16

      // 2. After the user bubble settles, kick into the same in-flight render
      // path the real API uses: thinking spark → streaming text → commit.
      demoTimeoutRef.current = setTimeout(() => {
        bufferRef.current = ''
        setStreamBuffer('')
        setStreamingChatId(chatId)
        setThinking(true)

        // 3. Thinking pause — spark only, no text yet.
        demoTimeoutRef.current = setTimeout(() => {
          setThinking(false)
          const fullText = assistantMsg.text
          let pos = 0

          demoIntervalRef.current = setInterval(() => {
            pos = Math.min(pos + chunkChars, fullText.length)
            bufferRef.current = fullText.slice(0, pos)
            setStreamBuffer(bufferRef.current)

            if (pos >= fullText.length) {
              if (demoIntervalRef.current) {
                clearInterval(demoIntervalRef.current)
                demoIntervalRef.current = null
              }
              // 4. Commit — React batches these so the in-flight bubble
              // vanishes the same frame the committed message appears, no flash.
              setChats((cs) =>
                cs.map((c) =>
                  c.id === chatId ? { ...c, messages: [...c.messages, assistantMsg] } : c,
                ),
              )
              bufferRef.current = ''
              setStreamBuffer('')
              setStreamingChatId(null)
              setDemoTurnByChatId((prev) => ({ ...prev, [chatId]: idx + 1 }))
              setDemoBusy(false)
            }
          }, tickMs)
        }, thinkingMs)
      }, userFadeMs + pauseMs)
    },
    [demoBusy, streamingChatId, demoTurnByChatId, lessons, actions],
  )

  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current)
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current)
    }
  }, [])

  return (
    <ChatContext.Provider
      value={{
        config,
        models: MODELS,
        model,
        setModel,
        chats,
        thinking,
        streamBuffer,
        streamingChatId,
        toolEvents,
        createChat,
        sendReply,
        deleteChat,
        stopStream,
        demoTurnByChatId,
        demoBusy,
        advanceDemo,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatStore() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatStore must be used within ChatProvider')
  return ctx
}
