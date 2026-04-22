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

import type { Lesson } from '@/lib/types/lesson'

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
 * Strip ```edit fenced JSON blocks from text for display.
 */
export function stripEditBlocks(text: string): string {
  return text
    .replace(/```edit[\s\S]*?```/g, '')
    .replace(/```edit[\s\S]*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
