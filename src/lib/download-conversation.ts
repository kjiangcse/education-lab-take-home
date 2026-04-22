import type { Chat } from './types/chat'
import type { Course } from './types/course'
import type { Lesson } from './types/lesson'
import type { HistoryEntry, LessonOverlay, LessonView } from './lesson-context'

export type ConversationExport = {
  exportedAt: string
  chat: Chat
  finalState: {
    course: Course
    lessons: Lesson[]
    lessonId: string
    view: LessonView
    overlay?: LessonOverlay
  }
  editHistory: HistoryEntry[]
}

function filenameFor(chat: Chat): string {
  const slug =
    chat.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-+|-+$/g, '') || chat.id
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${slug}-${ts}.json`
}

export function downloadConversationBundle(data: Omit<ConversationExport, 'exportedAt'>): void {
  const payload: ConversationExport = {
    exportedAt: new Date().toISOString(),
    ...data,
  }
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filenameFor(data.chat)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
