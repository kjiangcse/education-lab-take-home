/**
 * Course type. Lesson types live in `./lesson` — a Lesson links back via
 * `course_id` but a Course does NOT embed a `lessons` array.
 *
 * Lesson-related imports should come from `@/lib/types/lesson`. This file
 * re-exports them for backwards compatibility during migration but new code
 * should import directly from `./lesson`.
 */

export type { BloomLevel } from './blooms'
export { BLOOM_LEVELS, formatBloomLabel } from './blooms'

export type Course = {
  id: string
  name: string
  short_description: string
  about: string
  learning_objectives: string[]
  prerequisites: string[]
  audience: string
  estimated_duration: string
  target_level: string
  default_lesson_id: string
}

// ── Display formatting helpers ──────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem === 0 ? `${hours} hr` : `${hours} hr ${rem} min`
}

// ── Backwards-compat re-exports ─────────────────────────────────────────
// Old imports `from '@/lib/types/course'` continue to work. Prefer importing
// from `@/lib/types/lesson` in new code.

export type {
  TextEdit,
  SectionFeedback,
  LessonDropdown,
  LessonTab,
  LessonSection,
  RichTextBlock,
  DropdownsBlock,
  TabsBlock,
  LessonBlock,
  Lesson,
} from './lesson'

