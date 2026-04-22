/**
 * Pure helpers for mutating a lesson in response to accepted feedback. The
 * panel's Apply button and the scripted demo runner both flow through
 * `applyFeedbackToLesson` so the state transition stays in one place.
 */

import type { Lesson, LessonBlock, SectionFeedback } from './types/lesson'
import { applyEditsToHtml as applyEditsToString } from './format-edits'

function patchRichtext(
  block: Extract<LessonBlock, { kind: 'richtext' }>,
  feedback: SectionFeedback,
): Extract<LessonBlock, { kind: 'richtext' }> {
  return {
    ...block,
    content: applyEditsToString(block.content, feedback.edits),
    blooms_level: feedback.blooms_level_after ?? block.blooms_level,
    feedback: undefined,
  }
}

function patchItem<T extends { heading: string; content: string; blooms_level?: import('./types/blooms').BloomLevel; feedback?: SectionFeedback }>(
  item: T,
  feedback: SectionFeedback,
): T {
  return {
    ...item,
    heading: applyEditsToString(item.heading, feedback.edits),
    content: applyEditsToString(item.content, feedback.edits),
    blooms_level: feedback.blooms_level_after ?? item.blooms_level,
    feedback: undefined,
  }
}

/** Apply the pending feedback on the block/item addressed by `id`. Returns a
 *  new Lesson with the change baked in. Returns the input unchanged when the
 *  target doesn't exist or has no pending feedback. */
export function applyFeedbackToLesson(lesson: Lesson, id: string): Lesson {
  // Richtext block path.
  const rtBlock = lesson.blocks.find(
    (b): b is Extract<LessonBlock, { kind: 'richtext' }> => b.kind === 'richtext' && b.id === id,
  )
  if (rtBlock && rtBlock.feedback) {
    const feedback = rtBlock.feedback
    return {
      ...lesson,
      blocks: lesson.blocks.map((b) =>
        b.kind === 'richtext' && b.id === id ? patchRichtext(b, feedback) : b,
      ),
    }
  }

  // Dropdown item path.
  for (const block of lesson.blocks) {
    if (block.kind !== 'dropdowns') continue
    const item = block.items.find((d) => d.id === id)
    if (!item || !item.feedback) continue
    const feedback = item.feedback
    return {
      ...lesson,
      blocks: lesson.blocks.map((b) => {
        if (b.kind !== 'dropdowns') return b
        return {
          ...b,
          items: b.items.map((it) => (it.id === id ? patchItem(it, feedback) : it)),
        }
      }),
    }
  }

  // Tab item path.
  for (const block of lesson.blocks) {
    if (block.kind !== 'tabs') continue
    const item = block.items.find((t) => t.id === id)
    if (!item || !item.feedback) continue
    const feedback = item.feedback
    return {
      ...lesson,
      blocks: lesson.blocks.map((b) => {
        if (b.kind !== 'tabs') return b
        return {
          ...b,
          items: b.items.map((it) => (it.id === id ? patchItem(it, feedback) : it)),
        }
      }),
    }
  }

  return lesson
}

/** Convenience for applying several ids in sequence. */
export function applyFeedbacksToLesson(lesson: Lesson, ids: string[]): Lesson {
  return ids.reduce((acc, id) => applyFeedbackToLesson(acc, id), lesson)
}
