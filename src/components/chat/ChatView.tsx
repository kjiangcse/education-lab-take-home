'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  AssistantBody,
  ChatHeader,
  ClaudeMessage,
  InputBar,
  SparkIndicator,
  UserMessage,
} from '@/components/chat'
import { LessonPreview } from '@/components/simulator/LessonPreview'
import { useLesson } from '@/lib/lesson-context'
import { BloomTaxonomy } from '@/components/chat/BloomTaxonomy'
import { ChatLessonIndicator } from '@/components/chat/ChatLessonIndicator'
import { useChatStore } from '@/lib/chat-store'
import {
  COURSE_LEVEL_CHAT_IDS,
  DEMO_CHAT_LESSON_MAP,
  SCRIPTED_DEMO_CHAT_IDS,
  SCRIPTED_DEMO_MESSAGES,
} from '@/lib/seed'
import { downloadConversationBundle } from '@/lib/download-conversation'
import { collectReferencedIds } from '@/lib/demo/referenced-ids'

type ChatViewProps = {
  chatId: string
  /**
   * When true (default), redirect to `/new` if the chat doesn't exist. The
   * normal chat route wants this; embedded uses (e.g. demo slides) should
   * pass false so a missing seed renders a fallback instead of bouncing.
   */
  redirectOnMissing?: boolean
}

const NON_LESSON_IDS = new Set(['c1', 'c2', 'c3'])

/** Demo chats where the presenter wants to walk the conversation top-down.
 *  These chats open with the scrollbar pinned to the top rather than the
 *  usual "jump to the newest message" behavior. Only applied on chat load —
 *  subsequent streaming / new messages still stick to the bottom so live
 *  interaction works normally. */
const WALKTHROUGH_CHAT_IDS = new Set(['demo-structure', 'demo-skills', 'demo-closing'])

export function ChatView({ chatId, redirectOnMissing = true }: ChatViewProps) {
  const router = useRouter()
  const {
    chats,
    models,
    model,
    setModel,
    thinking,
    streamBuffer,
    streamingChatId,
    toolEvents,
    sendReply,
    stopStream,
    demoTurnByChatId,
    demoBusy,
    advanceDemo,
  } = useChatStore()
  const { lesson, lessons, lessonId, course, view, overlayByChat, panelOpenByChat, actions } = useLesson()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Each chat owns its own lesson state (demo chats start from the scripted
  // seed, non-demo chats start with a feedback-stripped copy). Activate this
  // chat's state before anything else so the right panel reads from it.
  useEffect(() => {
    actions.setActiveChat(chatId)
  }, [chatId, actions])

  // Demo chats: auto-open the panel on first visit to the mapped lesson, or
  // to the course view for course-level demo chats. User chats: leave closed
  // until Claude opens it via tools or the user manually opens it.
  const initializedRef = useRef<string | null>(null)
  useEffect(() => {
    if (initializedRef.current === chatId) return
    if (COURSE_LEVEL_CHAT_IDS.has(chatId)) {
      initializedRef.current = chatId
      actions.openPanel({ chatId, course: true })
      return
    }
    const targetLesson = DEMO_CHAT_LESSON_MAP[chatId]
    if (targetLesson) {
      initializedRef.current = chatId
      actions.openPanel({ chatId, lessonId: targetLesson })
    }
  }, [chatId, actions])

  const chat = chats.find((c) => c.id === chatId)
  const isStreaming = streamingChatId === chatId
  const showInFlight = isStreaming && (thinking || streamBuffer)
  const showLessonPanel = !NON_LESSON_IDS.has(chatId)
  const panelOpen = (panelOpenByChat[chatId] ?? false) && showLessonPanel

  // Scripted-demo flow: an inline "Next turn" button that mirrors the header
  // Demo button, placed below the last visible message so the presenter can
  // sequence the conversation without moving their cursor off the chat.
  const isScriptedDemo = SCRIPTED_DEMO_CHAT_IDS.has(chatId)
  const scriptedTurnsTotal = SCRIPTED_DEMO_MESSAGES[chatId]
    ? Math.floor(SCRIPTED_DEMO_MESSAGES[chatId].length / 2)
    : 0
  const scriptedTurnsPlayed = demoTurnByChatId[chatId] ?? 0
  const scriptComplete = !isScriptedDemo || scriptedTurnsPlayed >= scriptedTurnsTotal
  const canAdvanceScript =
    isScriptedDemo && scriptedTurnsPlayed < scriptedTurnsTotal && !demoBusy && !isStreaming

  // Right-panel feedback overlay is scoped to blocks Claude has actually
  // referenced in the chat so far. For scripted demos this means edits on
  // sections not yet walked through stay hidden until their turn plays. A
  // null set means "no gating" — used for non-scripted chats so their
  // feedback behavior is unchanged.
  const revealedFeedbackIds = useMemo<Set<string> | null>(() => {
    if (!isScriptedDemo) return null
    const ids = new Set<string>()
    for (const m of chat?.messages ?? []) {
      if (m.role !== 'assistant') continue
      collectReferencedIds(m.text).forEach((id) => ids.add(id))
    }
    return ids
  }, [isScriptedDemo, chat?.messages])

  // Follow streaming content and new messages — keep the newest bubble in view.
  // Fires on intra-chat updates (streaming tokens, thinking flicker, new turns).
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [streamBuffer, thinking, chat?.messages.length])

  // Initial scroll position when switching chats. Declared AFTER the follow
  // effect so it runs last in this render pass and wins the scrollTop race.
  // Walkthrough demo chats open at the top so the presenter can scroll the
  // scripted thread from the start; every other chat jumps to the bottom.
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = WALKTHROUGH_CHAT_IDS.has(chatId)
      ? 0
      : scrollRef.current.scrollHeight
  }, [chatId])

  useEffect(() => {
    if (!chat && redirectOnMissing) router.replace('/new')
  }, [chat, redirectOnMissing, router])

  if (!chat) {
    if (redirectOnMissing) return null
    return (
      <div style={{ padding: 48, fontSize: 14, color: 'rgb(115, 114, 108)' }}>
        Chat <code>{chatId}</code> isn&apos;t in this session — open the app, visit the chat once to seed it, then come back.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden', minWidth: 0 }}>
        <ChatHeader
          title={chat.title}
          onTogglePanel={showLessonPanel ? () => {
            if (panelOpen) actions.closePanel(chatId)
            else actions.openPanel({ chatId })
          } : undefined}
          panelOpen={panelOpen}
          onDownload={() => {
            downloadConversationBundle({
              chat,
              finalState: {
                course,
                lessons,
                lessonId,
                view,
                overlay: overlayByChat[chatId],
              },
              editHistory: actions.getHistory(),
            })
          }}
        />

        <div ref={scrollRef} className="scroll-area flex-1 overflow-y-auto overflow-x-hidden pt-6">
          <div className="mx-auto max-w-[var(--content-max-width)] px-6 pb-6">
            {chat.messages.map((m, i) =>
              m.role === 'user' ? (
                <UserMessage key={i} text={m.text} animate={m.animate} />
              ) : (
                <ClaudeMessage key={i} animate={m.animate}>
                  <AssistantBody text={m.text} toolEvents={m.toolEvents} lessonId={m.lessonId} lesson={m.lessonSnapshot} chatId={chatId} />
                </ClaudeMessage>
              ),
            )}

            {canAdvanceScript && (
              <InlineNextTurnButton
                onClick={() => advanceDemo(chatId)}
                label={scriptedTurnsPlayed === 0 ? 'Start demo' : 'Next turn'}
              />
            )}

            {chatId === 'demo-skills' && scriptComplete && (
              <ClaudeMessage>
                <BloomTaxonomy
                  title="Lesson 3: Custom Claude Tools — From Prompt to Product"
                  level="remember"
                  distribution={{
                    remember: 100,
                    understand: 75,
                    apply: 30,
                    analyze: 0,
                    evaluate: 0,
                    create: 0,
                  }}
                  notes={{
                    remember: 'Every section names specific API methods, install commands, and config fields. Strong foundation.',
                    understand: 'System prompts, structured outputs, and tool use each get a paragraph of explanation.',
                    apply: 'Four follow-along steps. Learners reproduce the tool but never design one.',
                    analyze: 'Missing. Objectives promise decision-making but no section asks learners to compare or decompose.',
                    evaluate: 'Missing. No criteria for learners to judge whether their tool actually solved the problem.',
                    create: 'Not required by stated objectives.',
                  }}
                  summary="PATTERN: Feature tour masquerading as a lesson. Content plateaus at Remember and Understand; the objectives call for Apply-tier decision-making that the content never scaffolds."
                  defaultView="coverage"
                />
              </ClaudeMessage>
            )}

            {chatId === 'demo-closing' && scriptComplete && (
              <ClaudeMessage>
                <BloomTaxonomy
                  title="Course: Building Better Internal Tools with Claude"
                  level="apply"
                  distribution={{
                    remember: 100,
                    understand: 82,
                    apply: 45,
                    analyze: 15,
                    evaluate: 10,
                    create: 0,
                  }}
                  notes={{
                    remember: 'Every lesson defines its terms and names specific methods, tools, and API surfaces. Strong foundation across all five.',
                    understand: 'Each lesson carries worked explainers. Four have at least one example walkthrough; Lesson 4 leans on reference docs instead.',
                    apply: 'Lessons 2 and 3 scaffold hands-on practice. Lessons 1, 4, and 5 reference practice without exercising it.',
                    analyze: "Only Lesson 2's problem-framing dropdown asks learners to decompose. Other lessons stop at explanation.",
                    evaluate: 'Lesson 5 names "measure adoption" as an objective but teaches metric vocabulary, not the judgment criteria needed to decide.',
                    create: 'Not called for by any course objective — acceptable for this course scope.',
                  }}
                  summary="PATTERN: Course plateaus at Apply. Three of five course objectives are Apply-tier but only two lessons deliver the practice. Analyze and Evaluate each live in a single lesson — course-wide reinforcement is missing."
                  defaultView="coverage"
                />
              </ClaudeMessage>
            )}

            {showInFlight && (
              <ClaudeMessage>
                {streamBuffer && <AssistantBody text={streamBuffer} toolEvents={toolEvents} chatId={chatId} />}
                <SparkIndicator working={thinking} />
              </ClaudeMessage>
            )}
          </div>
        </div>

        <div className="bg-page sticky bottom-0 flex flex-col items-center px-6 pb-2 pt-1" style={{ position: 'sticky' }}>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: -20,
              height: 20,
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(250, 249, 245, 0) 0%, rgba(250, 249, 245, 1) 100%)',
            }}
          />
          <div className="w-full max-w-[var(--input-max-width-lg)]">
            {panelOpen && <ChatLessonIndicator />}
            <InputBar
              placeholder="Reply to Claude…"
              models={models}
              model={model}
              onModelChange={setModel}
              isStreaming={isStreaming}
              onSend={(text) => sendReply(chatId, text)}
              onStop={stopStream}
            />
          </div>
        </div>

        <div className="text-text-tertiary px-6 pb-3 text-center text-xs">
          Claude can make mistakes. Please double-check responses.
        </div>
      </div>

      {showLessonPanel && (
        <LessonPreview lesson={lesson} chatId={chatId} revealedFeedbackIds={revealedFeedbackIds} />
      )}
    </div>
  )
}

function InlineNextTurnButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 24px' }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderRadius: 999,
          border: '1px solid rgba(217, 119, 87, 0.35)',
          background: 'rgba(217, 119, 87, 0.08)',
          color: 'rgb(185, 95, 65)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.2px',
          cursor: 'pointer',
          transition: 'background 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(217, 119, 87, 0.14)'
          e.currentTarget.style.borderColor = 'rgba(217, 119, 87, 0.5)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(217, 119, 87, 0.08)'
          e.currentTarget.style.borderColor = 'rgba(217, 119, 87, 0.35)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </button>
    </div>
  )
}
