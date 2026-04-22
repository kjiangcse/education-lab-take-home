'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Course } from '@/lib/types/course'
import type { Lesson } from '@/lib/types/lesson'
import { applyFeedbackToLesson } from '@/lib/lesson-edits'
import { SAMPLE_COURSE, SAMPLE_LESSONS } from '@/lib/data/sample-course'

export type LessonView = 'course' | 'lesson'
export type LessonOverlay = 'preview' | 'feedback' | 'blooms'

const HISTORY_CAP = 50
const OVERLAY_STORAGE_KEY = 'education-labs:overlay-by-chat'
const PANEL_STORAGE_KEY = 'education-labs:panel-open-by-chat'

export type HistoryEntry = {
  course: Course
  lessons: Lesson[]
  timestamp: number
  label: string
}

type OpenPanelArgs = {
  chatId: string
  lessonId?: string
  course?: boolean
}

export type JumpTarget = {
  chatId: string
  lessonId: string
  /** DOM anchor id: "sections-0", "dropdowns-1", "tabs", etc.
   *  Omit when the artifact (e.g. Bloom's pyramid) targets the whole lesson. */
  field?: string
  /** Which right-panel overlay should be active after the jump. The AI/card
   *  chooses this: preview for plain content, feedback for edit proposals,
   *  blooms for taxonomy critique. */
  overlay?: LessonOverlay
  /** When true, force-open any collapsed ExpandableDropdown headers inside the
   *  landed element so jumps from inline dropdown cards don't leave the target
   *  collapsed. */
  expandDropdowns?: boolean
}

type LessonActions = {
  /** Switch the "active" chat whose lesson state feeds the right panel and
   *  every useLesson() consumer. ChatView calls this on mount so each chat
   *  sees its own lesson state: demo chats keep the scripted seed (with
   *  feedback); non-demo chats get a feedback-stripped copy so new live
   *  reviews don't inherit pre-existing edits. */
  setActiveChat: (chatId: string) => void
  navigateToLesson: (id: string) => void
  navigateToNextLesson: () => void
  navigateToPreviousLesson: () => void
  navigateToCourse: () => void
  openPanel: (args: OpenPanelArgs) => void
  closePanel: (chatId: string) => void
  setOverlay: (chatId: string, mode: LessonOverlay) => void
  updateCourse: (patch: Partial<Course>, label?: string) => void
  updateLesson: (id: string, patch: Partial<Lesson>, label?: string) => void
  /** Apply the pending feedback on the block/item addressed by `fieldId`
   *  inside the given lesson. Returns the post-apply lesson so callers that
   *  need the new state immediately (e.g. the scripted demo runner taking a
   *  snapshot) don't have to wait for React state to flush. */
  applyFeedback: (lessonId: string, fieldId: string, label?: string) => Lesson | null
  /** Switch to the given lesson, open this chat's panel, and scroll the
   *  named field into the center of the right panel viewport. */
  jumpToField: (target: JumpTarget) => void
  undo: () => void
  getHistory: () => HistoryEntry[]
}

type LessonContextValue = {
  course: Course
  lessons: Lesson[]
  lesson: Lesson
  lessonId: string
  lessonIndex: number
  view: LessonView
  overlayByChat: Record<string, LessonOverlay>
  panelOpenByChat: Record<string, boolean>
  canUndo: boolean
  actions: LessonActions
}

/** State held per chat id. Replaces the previous singletons so each chat can
 *  evolve its own lesson review independently — live chats start clean,
 *  demo chats start from the scripted seed. */
type ChatLessonState = {
  course: Course
  lessons: Lesson[]
  lessonId: string
  view: LessonView
  history: HistoryEntry[]
}

const LessonContext = createContext<LessonContextValue | null>(null)

function isDemoChatId(chatId: string): boolean {
  return chatId.startsWith('demo-')
}

/** Clone a lesson with every block/item-level `feedback` entry removed. Used
 *  to derive the initial state for a non-demo chat: the sample data ships
 *  with seeded feedback for the scripted demos, and a fresh live chat
 *  shouldn't inherit those. */
function stripLessonFeedback(lesson: Lesson): Lesson {
  return {
    ...lesson,
    blocks: lesson.blocks.map((block) => {
      if (block.kind === 'richtext') {
        const { feedback: _f, ...rest } = block
        void _f
        return rest
      }
      if (block.kind === 'dropdowns') {
        return {
          ...block,
          items: block.items.map((item) => {
            const { feedback: _f, ...rest } = item
            void _f
            return rest
          }),
        }
      }
      if (block.kind === 'tabs') {
        return {
          ...block,
          items: block.items.map((item) => {
            const { feedback: _f, ...rest } = item
            void _f
            return rest
          }),
        }
      }
      return block
    }),
  }
}

function makeInitialChatState(chatId: string | null): ChatLessonState {
  const isDemo = chatId ? isDemoChatId(chatId) : false
  const lessons = isDemo ? SAMPLE_LESSONS : SAMPLE_LESSONS.map(stripLessonFeedback)
  return {
    course: SAMPLE_COURSE,
    lessons,
    lessonId: SAMPLE_COURSE.default_lesson_id,
    view: 'lesson',
    history: [],
  }
}

export function LessonProvider({ children }: { children: ReactNode }) {
  const [stateByChat, setStateByChat] = useState<Record<string, ChatLessonState>>({})
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const activeChatIdRef = useRef<string | null>(null)
  const [overlayByChat, setOverlayByChat] = useState<Record<string, LessonOverlay>>({})
  const [panelOpenByChat, setPanelOpenByChat] = useState<Record<string, boolean>>({})

  // Keep a ref in sync so async closures (e.g. in-flight API completions)
  // always read the latest active chat when committing mutations.
  useEffect(() => {
    activeChatIdRef.current = activeChatId
  }, [activeChatId])

  // A shared "no chat active" state — used when nothing has been activated
  // yet (e.g. /new before a chat is created). Matches the feedback-stripped
  // non-demo shape so the landing view never shows seeded edits.
  const defaultState = useMemo(() => makeInitialChatState(null), [])
  const activeState: ChatLessonState = (activeChatId && stateByChat[activeChatId]) || defaultState
  const { course, lessons, lessonId, view, history } = activeState
  const lessonIndex = lessons.findIndex((l) => l.id === lessonId)
  const lesson = lessons[lessonIndex] ?? lessons[0]

  // Hydrate per-chat maps from localStorage after mount.
  useEffect(() => {
    try {
      const overlayRaw = localStorage.getItem(OVERLAY_STORAGE_KEY)
      if (overlayRaw) setOverlayByChat(JSON.parse(overlayRaw))
    } catch { /* ignore */ }
    try {
      const panelRaw = localStorage.getItem(PANEL_STORAGE_KEY)
      if (panelRaw) setPanelOpenByChat(JSON.parse(panelRaw))
    } catch { /* ignore */ }
  }, [])

  // Persist per-chat maps.
  useEffect(() => {
    try { localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(overlayByChat)) } catch { /* ignore */ }
  }, [overlayByChat])
  useEffect(() => {
    try { localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(panelOpenByChat)) } catch { /* ignore */ }
  }, [panelOpenByChat])

  const ensureChatState = useCallback((chatId: string) => {
    setStateByChat((prev) =>
      prev[chatId] ? prev : { ...prev, [chatId]: makeInitialChatState(chatId) },
    )
  }, [])

  const setActiveChat = useCallback((chatId: string) => {
    ensureChatState(chatId)
    setActiveChatId(chatId)
  }, [ensureChatState])

  /** Mutate the currently-active chat's state. No-op if no chat is active. */
  const mutateActive = useCallback(
    (updater: (prev: ChatLessonState) => ChatLessonState) => {
      const key = activeChatIdRef.current
      if (!key) return
      setStateByChat((prev) => {
        const current = prev[key] ?? makeInitialChatState(key)
        return { ...prev, [key]: updater(current) }
      })
    },
    [],
  )

  const pushHistory = (state: ChatLessonState, label: string): ChatLessonState => {
    const entry: HistoryEntry = {
      course: state.course,
      lessons: state.lessons,
      timestamp: Date.now(),
      label,
    }
    const next = [...state.history, entry]
    return {
      ...state,
      history: next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next,
    }
  }

  const navigateToLesson = useCallback((id: string) => {
    mutateActive((s) => ({ ...s, lessonId: id, view: 'lesson' }))
  }, [mutateActive])

  const navigateToCourse = useCallback(() => {
    mutateActive((s) => ({ ...s, view: 'course' }))
  }, [mutateActive])

  const navigateToNextLesson = useCallback(() => {
    mutateActive((s) => {
      const idx = s.lessons.findIndex((l) => l.id === s.lessonId)
      const next = s.lessons[Math.min(idx + 1, s.lessons.length - 1)]
      if (next && next.id !== s.lessonId) {
        return { ...s, lessonId: next.id, view: 'lesson' }
      }
      return s
    })
  }, [mutateActive])

  const navigateToPreviousLesson = useCallback(() => {
    mutateActive((s) => {
      const idx = s.lessons.findIndex((l) => l.id === s.lessonId)
      const prev = s.lessons[Math.max(idx - 1, 0)]
      if (prev && prev.id !== s.lessonId) {
        return { ...s, lessonId: prev.id, view: 'lesson' }
      }
      return s
    })
  }, [mutateActive])

  const openPanel = useCallback((args: OpenPanelArgs) => {
    setPanelOpenByChat((prev) => ({ ...prev, [args.chatId]: true }))
    // Open-panel calls can target any chat (including one that isn't yet
    // active — e.g. a tool-use auto-open). Seed that chat's state if it
    // doesn't exist, then apply the lesson/view patch to it specifically.
    setStateByChat((prev) => {
      const base = prev[args.chatId] ?? makeInitialChatState(args.chatId)
      let patched = base
      if (args.lessonId) {
        patched = { ...patched, lessonId: args.lessonId, view: 'lesson' }
      } else if (args.course) {
        patched = { ...patched, view: 'course' }
      }
      if (patched === base && prev[args.chatId]) return prev
      return { ...prev, [args.chatId]: patched }
    })
  }, [])

  const closePanel = useCallback((chatId: string) => {
    setPanelOpenByChat((prev) => ({ ...prev, [chatId]: false }))
  }, [])

  const setOverlay = useCallback((chatId: string, mode: LessonOverlay) => {
    setOverlayByChat((prev) => ({ ...prev, [chatId]: mode }))
  }, [])

  const jumpToField = useCallback((target: JumpTarget) => {
    // 1. Make sure the panel is open for this chat and the right lesson is
    //    loaded in that chat's state.
    setPanelOpenByChat((prev) => ({ ...prev, [target.chatId]: true }))
    setStateByChat((prev) => {
      const base = prev[target.chatId] ?? makeInitialChatState(target.chatId)
      return {
        ...prev,
        [target.chatId]: { ...base, lessonId: target.lessonId, view: 'lesson' },
      }
    })

    // 2. Apply the overlay the card requested (preview/feedback/blooms). If
    //    none was specified, leave the user's current overlay untouched.
    if (target.overlay) {
      setOverlayByChat((prev) => ({ ...prev, [target.chatId]: target.overlay! }))
    }

    // 3. Scroll the field anchor into view if one was given. Two rAFs: one
    //    for layout, one for the panel transition to settle so scrollIntoView
    //    lands on the final height.
    if (target.field) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.querySelector(`[data-field="${target.field}"]`)
          if (el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Brief highlight pulse so the user's eye catches the landing.
            el.classList.add('field-flash')
            setTimeout(() => el.classList.remove('field-flash'), 1400)

            if (target.expandDropdowns) {
              const headers = el.querySelectorAll<HTMLElement>(
                '[data-dropdown-header="true"][aria-expanded="false"]',
              )
              headers.forEach((h) => h.click())
            }
          }
        })
      })
    }
  }, [])

  const updateCourse = useCallback((patch: Partial<Course>, label?: string) => {
    mutateActive((s) => {
      const withHistory = pushHistory(s, label ?? 'Edit course')
      return { ...withHistory, course: { ...s.course, ...patch } }
    })
  }, [mutateActive])

  const updateLesson = useCallback((id: string, patch: Partial<Lesson>, label?: string) => {
    mutateActive((s) => {
      const target = s.lessons.find((l) => l.id === id)
      const withHistory = pushHistory(s, label ?? (target ? `Edit ${target.name}` : 'Edit lesson'))
      return {
        ...withHistory,
        lessons: withHistory.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }
    })
  }, [mutateActive])

  const applyFeedback = useCallback(
    (lessonId: string, fieldId: string, label?: string): Lesson | null => {
      const key = activeChatIdRef.current
      if (!key) return null
      const current = stateByChat[key] ?? makeInitialChatState(key)
      const target = current.lessons.find((l) => l.id === lessonId)
      if (!target) return null
      const next = applyFeedbackToLesson(target, fieldId)
      if (next === target) return target

      const withHistory = pushHistory(current, label ?? 'Apply feedback')
      setStateByChat((prev) => ({
        ...prev,
        [key]: {
          ...withHistory,
          lessons: withHistory.lessons.map((l) => (l.id === lessonId ? next : l)),
        },
      }))
      return next
    },
    [stateByChat],
  )

  const undo = useCallback(() => {
    mutateActive((s) => {
      if (s.history.length === 0) return s
      const last = s.history[s.history.length - 1]
      return {
        ...s,
        course: last.course,
        lessons: last.lessons,
        history: s.history.slice(0, -1),
      }
    })
  }, [mutateActive])

  const getHistory = useCallback(() => history, [history])

  const actions: LessonActions = useMemo(
    () => ({
      setActiveChat,
      navigateToLesson,
      navigateToNextLesson,
      navigateToPreviousLesson,
      navigateToCourse,
      openPanel,
      closePanel,
      setOverlay,
      updateCourse,
      updateLesson,
      applyFeedback,
      jumpToField,
      undo,
      getHistory,
    }),
    [
      setActiveChat,
      navigateToLesson,
      navigateToNextLesson,
      navigateToPreviousLesson,
      navigateToCourse,
      openPanel,
      closePanel,
      setOverlay,
      updateCourse,
      updateLesson,
      applyFeedback,
      jumpToField,
      undo,
      getHistory,
    ],
  )

  return (
    <LessonContext.Provider
      value={{
        course,
        lessons,
        lesson,
        lessonId,
        lessonIndex,
        view,
        overlayByChat,
        panelOpenByChat,
        canUndo: history.length > 0,
        actions,
      }}
    >
      {children}
    </LessonContext.Provider>
  )
}

export function useLesson() {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used within LessonProvider')
  return ctx
}
