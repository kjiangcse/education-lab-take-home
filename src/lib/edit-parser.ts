/**
 * Shared edit parsing and application logic.
 * Used by both the chat UI (to parse streaming responses) and the simulation
 * (to apply edits programmatically).
 *
 * Field paths address blocks and items by their stable type-scoped ids:
 *   name
 *   short_description
 *   objectives[0]
 *   <id>.label       — richtext block label
 *   <id>.content     — richtext block content, or dropdown/tab item content
 *   <id>.heading     — dropdown/tab item heading
 */

import type { Lesson, SectionFeedback, TextEdit } from '@/lib/types/lesson'

export type LessonEdit = {
  lesson_id: string
  field: string
  original: string
  replacement: string
  reason: string
  skill_id: string
}

/**
 * Parse ```edit blocks from Claude's response text.
 */
export function parseEditsFromText(text: string): LessonEdit[] {
  const edits: LessonEdit[] = []
  const regex = /```edit\s*\n([\s\S]*?)\n```/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(m[1])
      if (parsed.field && parsed.original && parsed.replacement) {
        edits.push(parsed)
      }
    } catch {
      // Skip malformed edit blocks
    }
  }
  return edits
}

/** Parse a field path into its addressable pieces.
 *  Returns one of:
 *    { kind: 'scalar', target: 'name' | 'short_description' }
 *    { kind: 'objective', index: number }
 *    { kind: 'id-field', id: string, field: 'label' | 'content' | 'heading' } */
type ParsedField =
  | { kind: 'scalar'; target: 'name' | 'short_description' }
  | { kind: 'objective'; index: number }
  | { kind: 'id-field'; id: string; field: 'label' | 'content' | 'heading' }

function parseField(field: string): ParsedField | undefined {
  if (field === 'name') return { kind: 'scalar', target: 'name' }
  if (field === 'short_description') return { kind: 'scalar', target: 'short_description' }
  const objMatch = field.match(/^objectives\[(\d+)\]$/)
  if (objMatch) return { kind: 'objective', index: Number(objMatch[1]) }
  const idMatch = field.match(/^([a-z0-9-]+)\.(label|content|heading)$/)
  if (idMatch) {
    return { kind: 'id-field', id: idMatch[1], field: idMatch[2] as 'label' | 'content' | 'heading' }
  }
  return undefined
}

/**
 * Apply edits to a lesson, returning a new lesson object. Does not mutate.
 */
export function applyEditsToLesson(lesson: Lesson, edits: LessonEdit[]): Lesson {
  const patched = JSON.parse(JSON.stringify(lesson)) as Lesson

  for (const edit of edits) {
    const parsed = parseField(edit.field)
    if (!parsed) continue

    if (parsed.kind === 'scalar') {
      if (parsed.target === 'name') patched.name = edit.replacement
      else patched.short_description = edit.replacement
      continue
    }

    if (parsed.kind === 'objective') {
      if (patched.objectives[parsed.index] !== undefined) {
        patched.objectives[parsed.index] = edit.replacement
      }
      continue
    }

    // id-field: search blocks and group items for the id.
    for (const block of patched.blocks) {
      if (block.kind === 'richtext' && block.id === parsed.id) {
        if (parsed.field === 'content') {
          block.content = block.content.replace(edit.original, edit.replacement)
        } else if (parsed.field === 'label') {
          block.label = edit.replacement
        }
        break
      }
      if (block.kind === 'dropdowns') {
        const item = block.items.find((d) => d.id === parsed.id)
        if (item) {
          if (parsed.field === 'content') {
            item.content = item.content.replace(edit.original, edit.replacement)
          } else if (parsed.field === 'heading') {
            item.heading = edit.replacement
          }
          break
        }
      }
      if (block.kind === 'tabs') {
        const item = block.items.find((t) => t.id === parsed.id)
        if (item) {
          if (parsed.field === 'content') {
            item.content = item.content.replace(edit.original, edit.replacement)
          } else if (parsed.field === 'heading') {
            item.heading = edit.replacement
          }
          break
        }
      }
    }
  }

  return patched
}

/**
 * Attach parsed edits to a lesson as pending `feedback.edits` on their target
 * blocks/items. This is the path the live chat takes — edits proposed by the
 * AI surface in the right-panel Feedback overlay with Apply/Dismiss buttons
 * and render inline diffs via `{{{card:diff:ID}}}`, instead of being silently
 * committed to content.
 *
 * Scope rules:
 * - Edits targeting richtext/dropdown/tab ids get attached as pending feedback.
 *   Multiple edits in one turn targeting the same id collate into one
 *   `SectionFeedback.edits[]`. Previous pending feedback on that id is replaced
 *   by the newer proposal.
 * - Edits targeting `name` / `short_description` / `objectives[N]` have no
 *   feedback slot (they're scalar fields on the lesson itself). We apply them
 *   directly since there's no "diff card" for them anyway.
 * - Edits with unknown field paths are skipped.
 */
export function attachEditsAsFeedback(lesson: Lesson, edits: LessonEdit[]): Lesson {
  if (edits.length === 0) return lesson

  // Group id-addressed edits by target id. Scalar/objective edits are applied
  // directly in a second pass.
  const editsById = new Map<string, TextEdit[]>()
  const reasonsById = new Map<string, string[]>()
  const scalarEdits: LessonEdit[] = []

  for (const edit of edits) {
    const parsed = parseField(edit.field)
    if (!parsed) continue
    if (parsed.kind === 'scalar' || parsed.kind === 'objective') {
      scalarEdits.push(edit)
      continue
    }
    const textEdit: TextEdit = {
      original: edit.original,
      replacement: edit.replacement,
      reason: edit.reason,
    }
    const arr = editsById.get(parsed.id) ?? []
    arr.push(textEdit)
    editsById.set(parsed.id, arr)
    const reasons = reasonsById.get(parsed.id) ?? []
    reasons.push(edit.reason)
    reasonsById.set(parsed.id, reasons)
  }

  const patched = JSON.parse(JSON.stringify(lesson)) as Lesson

  // Apply scalars/objectives directly — no feedback slot exists for them.
  for (const edit of scalarEdits) {
    const parsed = parseField(edit.field)
    if (!parsed) continue
    if (parsed.kind === 'scalar') {
      if (parsed.target === 'name') patched.name = edit.replacement
      else patched.short_description = edit.replacement
    } else if (parsed.kind === 'objective') {
      if (patched.objectives[parsed.index] !== undefined) {
        patched.objectives[parsed.index] = edit.replacement
      }
    }
  }

  // Attach id-scoped edits as pending feedback. A newer proposal replaces any
  // previous pending feedback on the same id — the AI's latest thinking wins,
  // and the user still has Dismiss in the panel if they disagree.
  const makeFeedback = (id: string): SectionFeedback | undefined => {
    const e = editsById.get(id)
    if (!e || e.length === 0) return undefined
    const reasons = reasonsById.get(id) ?? []
    return {
      edits: e,
      explanation: reasons.length > 1 ? reasons.map((r) => `- ${r}`).join('\n') : (reasons[0] ?? ''),
    }
  }

  for (const block of patched.blocks) {
    if (block.kind === 'richtext') {
      const fb = makeFeedback(block.id)
      if (fb) block.feedback = fb
    } else if (block.kind === 'dropdowns') {
      for (const item of block.items) {
        const fb = makeFeedback(item.id)
        if (fb) item.feedback = fb
      }
    } else if (block.kind === 'tabs') {
      for (const item of block.items) {
        const fb = makeFeedback(item.id)
        if (fb) item.feedback = fb
      }
    }
  }

  return patched
}

/** True when the parsed edits include at least one id-addressed target — i.e.
 *  something that would land in the feedback panel. Used by chat-store to
 *  decide whether to flip the right-panel overlay to "feedback". */
export function hasFeedbackTargets(edits: LessonEdit[]): boolean {
  for (const edit of edits) {
    const parsed = parseField(edit.field)
    if (parsed && parsed.kind === 'id-field') return true
  }
  return false
}

/**
 * Strip ```edit fenced JSON blocks from text for display.
 */
export function stripEditBlocks(text: string): string {
  return text
    .replace(/```edit[\s\S]*?```/g, '')
    .replace(/```edit[\s\S]*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
