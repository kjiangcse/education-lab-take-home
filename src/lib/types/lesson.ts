/**
 * Lesson content model.
 *
 * A lesson is an ordered list of blocks — rich text, dropdown groups, tab
 * galleries, and (eventually) video, image, callout, etc. The renderer walks
 * `blocks` in order. Authors can interleave anything they want; the shape is
 * NOT hardcoded to a sections-then-tabs-then-dropdowns sequence.
 *
 * Identity is by stable string `id`, type-scoped and monotonically assigned
 * (e.g. `section-1`, `section-2`, `dropdown-1`, `dropdowns-1`, `tabs-1`,
 * `tab-1`). IDs never shift when blocks move, and deleted IDs are not reused
 * when new blocks are added. Chat markers and edit paths refer to these IDs
 * directly — see `InlineCard` / `edit-parser` / `build-prompt`.
 */

import type { BloomLevel } from './blooms'

// ── Feedback primitives (shared between block types) ────────────────────

export type TextEdit = {
  original: string
  replacement: string
  reason: string
}

export type SectionFeedback = {
  edits: TextEdit[]
  explanation: string
  /** When set, applying this feedback also updates the target block/item's
   *  `blooms_level` to this value. Used to model cognitive-tier shifts that
   *  are the actual point of some edits (e.g. moving a section from
   *  Remember to Apply by rewriting its opening). */
  blooms_level_after?: BloomLevel
}

// ── Individual item types ───────────────────────────────────────────────

export type LessonDropdown = {
  /** Stable type-scoped id, e.g. "dropdown-1". Never reused. */
  id: string
  heading: string
  content: string
  blooms_level?: BloomLevel
  blooms_note?: string
  feedback?: SectionFeedback
}

export type LessonTab = {
  /** Stable type-scoped id, e.g. "tab-1". Never reused. */
  id: string
  heading: string
  content: string
  blooms_level?: BloomLevel
  feedback?: SectionFeedback
}

// ── Block types (discriminated union on `kind`) ─────────────────────────

export type RichTextBlock = {
  kind: 'richtext'
  /** Stable type-scoped id, e.g. "section-1". Never reused. */
  id: string
  label?: string
  content: string
  blooms_level?: BloomLevel
  blooms_note?: string
  feedback?: SectionFeedback
}

export type DropdownsBlock = {
  kind: 'dropdowns'
  /** Stable type-scoped id, e.g. "dropdowns-1". Never reused. */
  id: string
  items: LessonDropdown[]
}

export type TabsBlock = {
  kind: 'tabs'
  /** Stable type-scoped id, e.g. "tabs-1". Never reused. */
  id: string
  items: LessonTab[]
}

/** Video placeholder. For design purposes today — no real playback yet.
 *  Authors supply a title, estimated duration, and ideally a `script_note`
 *  explaining what the video will teach. A missing script_note is one of the
 *  common faults the AI flags ("empty video"). */
export type VideoBlock = {
  kind: 'video'
  /** Stable type-scoped id, e.g. "video-1". Never reused. */
  id: string
  label?: string
  /** Short title shown on the placeholder. */
  title: string
  /** Estimated runtime, e.g. "2:30". */
  duration?: string
  /** The teaching goal the video is meant to hit. When empty, the AI can
   *  flag "empty video" since the author hasn't explained the pedagogical
   *  intent and future-you won't know what to script or shoot. */
  script_note?: string
  blooms_level?: BloomLevel
  blooms_note?: string
  feedback?: SectionFeedback
}

export type LessonBlock = RichTextBlock | DropdownsBlock | TabsBlock | VideoBlock

// Kept as an alias so callers that imported LessonSection continue to compile.
export type LessonSection = RichTextBlock

// ── Top-level lesson entity ─────────────────────────────────────────────

export type Lesson = {
  id: string
  course_id: string
  name: string
  short_description: string
  duration_minutes: number
  blooms_profile: BloomLevel
  objectives: string[]
  blocks: LessonBlock[]
}

// ── Lookups by stable ID ────────────────────────────────────────────────

export function findRichTextBlock(lesson: Lesson, id: string): RichTextBlock | undefined {
  return lesson.blocks.find(
    (b): b is RichTextBlock => b.kind === 'richtext' && b.id === id,
  )
}

export function findDropdownsBlock(lesson: Lesson, id: string): DropdownsBlock | undefined {
  return lesson.blocks.find(
    (b): b is DropdownsBlock => b.kind === 'dropdowns' && b.id === id,
  )
}

export function findTabsBlock(lesson: Lesson, id: string): TabsBlock | undefined {
  return lesson.blocks.find(
    (b): b is TabsBlock => b.kind === 'tabs' && b.id === id,
  )
}

export function findVideoBlock(lesson: Lesson, id: string): VideoBlock | undefined {
  return lesson.blocks.find(
    (b): b is VideoBlock => b.kind === 'video' && b.id === id,
  )
}

/** Find a single dropdown item by id across all dropdown-group blocks. */
export function findDropdownItem(
  lesson: Lesson,
  id: string,
): { block: DropdownsBlock; item: LessonDropdown } | undefined {
  for (const b of lesson.blocks) {
    if (b.kind !== 'dropdowns') continue
    const item = b.items.find((d) => d.id === id)
    if (item) return { block: b, item }
  }
  return undefined
}

/** Find a single tab item by id across all tab-gallery blocks. */
export function findTabItem(
  lesson: Lesson,
  id: string,
): { block: TabsBlock; item: LessonTab } | undefined {
  for (const b of lesson.blocks) {
    if (b.kind !== 'tabs') continue
    const item = b.items.find((t) => t.id === id)
    if (item) return { block: b, item }
  }
  return undefined
}

/** Parse an id like "objective-1" and return the addressed objective.
 *  Objectives are a flat string[] on the lesson, so they don't belong to a
 *  block — but the card syntax treats each one as addressable.
 *
 *  IDs are 1-based, matching the `section-1` / `dropdown-1` / `tab-1`
 *  convention for every other element type. `objective-1` → first objective
 *  (array index 0), `objective-4` → fourth objective (array index 3). The
 *  `objectives[N]` edit-field syntax stays 0-based because that's literal
 *  array indexing, not an id. */
export function findObjectiveById(
  lesson: Lesson,
  id: string,
): { index: number; text: string } | undefined {
  const match = id.match(/^objective-(\d+)$/)
  if (!match) return undefined
  const n = Number(match[1])
  if (n < 1) return undefined
  const index = n - 1
  const text = lesson.objectives[index]
  if (text === undefined) return undefined
  return { index, text }
}

/** Collect every id that appears at any level (blocks + items). */
export function listAllIds(lesson: Lesson): string[] {
  const out: string[] = []
  for (const b of lesson.blocks) {
    out.push(b.id)
    if (b.kind === 'dropdowns' || b.kind === 'tabs') {
      for (const item of b.items) out.push(item.id)
    }
  }
  return out
}
