import type { ToolActivityEvent } from '@/components/chat/ToolActivity'
import type { Course } from './course'
import type { Lesson } from './lesson'

export type Role = 'user' | 'assistant'

/**
 * Full right-panel state at the moment a chat turn was recorded. Captured on
 * both user and assistant messages so the conversation transcript and the
 * lesson timeline stay coupled — downloads can replay turn-by-turn and
 * re-evaluate edits without losing which message changed which field.
 */
export type TurnStateSnapshot = {
  course: Course
  lessons: Lesson[]
  lessonId: string
  view: 'course' | 'lesson'
  overlay?: 'preview' | 'feedback' | 'blooms'
  timestamp: number
}

export type Message = {
  role: Role
  text: string
  /**
   * Tool invocations that happened during this assistant turn. The text body
   * contains `{{{tool:ID}}}` markers at the positions the pills should render;
   * this array carries the event data (name, input) needed to label each one.
   */
  toolEvents?: ToolActivityEvent[]
  /**
   * Lesson id that was active when this assistant turn committed. Inline
   * `{{{card:...}}}` markers are scoped to this lesson so the preview stays
   * bound to what Claude was actually discussing, even if the user later
   * navigates to a different lesson in the right panel.
   */
  lessonId?: string
  /**
   * Frozen copy of the lesson at authoring time. Inline `{{{card:...}}}`
   * artifacts resolve block content from this snapshot so the chat transcript
   * stays a stable record: applying feedback in the right panel does not
   * rewrite the diff cards that proposed it. Absent for older messages;
   * consumers fall back to the live lesson when missing.
   */
  lessonSnapshot?: Lesson
  /**
   * Full right-panel state at the moment this turn committed. Used by the
   * conversation export so each message carries the course/lesson world as it
   * stood when the turn happened.
   */
  stateSnapshot?: TurnStateSnapshot
  /**
   * Marks a message that should fade in when first mounted — used by the Demo
   * button to stagger scripted turns. Not persisted meaningfully; absence is
   * treated as "no animation."
   */
  animate?: boolean
}

export type Chat = {
  id: string
  title: string
  messages: Message[]
}

export type Config = {
  userName: string
  thinkingDelay: number
  streamSpeed: number
}
