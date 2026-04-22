/**
 * Serialize lesson/course data into a prompt-friendly format so Claude can
 * see the full structure and reference specific blocks and items by id.
 *
 * Field paths use id dot-notation:
 *   name
 *   short_description
 *   objectives[0]
 *   <block-id>.label           (richtext)
 *   <block-id>.content         (richtext)
 *   <item-id>.heading          (dropdown / tab)
 *   <item-id>.content          (dropdown / tab)
 *
 * IDs are type-scoped and stable: section-1, section-2, dropdown-1,
 * dropdowns-1, tab-1, tabs-1.
 */

import type { Course } from '@/lib/types/course'
import type { Lesson } from '@/lib/types/lesson'
import type { Skill } from './index'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export function serializeLessonForPrompt(lesson: Lesson, course: Course): string {
  let out = `## Current Lesson Content\n\n`
  out += `lesson_id: ${lesson.id}\n`
  out += `course: ${course.name}\n`
  out += `name: "${lesson.name}"\n`
  out += `short_description: "${lesson.short_description}"\n`
  out += `duration: ${lesson.duration_minutes} min\n`
  out += `blooms_profile: ${lesson.blooms_profile}\n\n`

  // Objectives — field path: objectives[i]
  out += `### objectives\n`
  lesson.objectives.forEach((obj, i) => {
    out += `  objectives[${i}]: "${obj}"\n`
  })
  out += '\n'

  // Blocks in document order. Each block and each group-item is addressed by
  // its stable id. This is the order the renderer displays them in.
  //
  // Note: `blooms_level` is intentionally NOT serialized per block/item.
  // Per-element Bloom's ratings are a UI-side snapshot of an analysis run;
  // sending them to Claude would let it parrot the existing label instead of
  // doing the cognitive-level assessment from the content itself. Claude
  // infers the level from the text, verbs, and structure. Only
  // `blooms_profile` (the lesson author's stated target) is passed above.
  out += `### blocks (in render order)\n`
  lesson.blocks.forEach((block, i) => {
    out += `\n  [${i}] id: ${block.id}  kind: ${block.kind}\n`
    if (block.kind === 'richtext') {
      if (block.label) out += `    ${block.id}.label: "${block.label}"\n`
      out += `    ${block.id}.content:\n      ${stripHtml(block.content).split('\n').join('\n      ')}\n`
    } else if (block.kind === 'dropdowns') {
      out += `    items:\n`
      block.items.forEach((d) => {
        out += `      - id: ${d.id}\n`
        out += `        ${d.id}.heading: "${d.heading}"\n`
        out += `        ${d.id}.content: "${stripHtml(d.content)}"\n`
      })
    } else if (block.kind === 'tabs') {
      out += `    items:\n`
      block.items.forEach((t) => {
        out += `      - id: ${t.id}\n`
        out += `        ${t.id}.heading: "${t.heading}"\n`
        out += `        ${t.id}.content: "${stripHtml(t.content)}"\n`
      })
    } else if (block.kind === 'video') {
      if (block.label) out += `    ${block.id}.label: "${block.label}"\n`
      out += `    ${block.id}.title: "${block.title}"\n`
      if (block.duration) out += `    ${block.id}.duration: "${block.duration}"\n`
      out += `    ${block.id}.script_note: ${
        block.script_note ? `"${block.script_note}"` : '(missing — flag as empty video)'
      }\n`
    }
  })

  return out
}

export function serializeSkillsForPrompt(skills: Skill[]): string {
  let out = `## Review Skills\n\n`
  out += `Assess sequentially: instructional skills first, then design, then assessment.\n\n`

  skills.forEach((skill) => {
    out += `### ${skill.name} (${skill.id})\n`
    out += `${skill.description}\n`
    out += `Criteria: ${skill.criteria.join('; ')}\n`
    out += `Faults: ${skill.faults.join('; ')}\n\n`
  })

  return out
}

export function serializeEditInstructions(lessonId: string): string {
  return `## Proposing Edits

When you identify a specific improvement, emit it as a JSON block on its own line:

\`\`\`edit
{
  "lesson_id": "${lessonId}",
  "field": "<id>.content",
  "original": "the exact text currently there",
  "replacement": "the improved text",
  "reason": "one sentence explaining why this is better",
  "skill_id": "structural-integrity"
}
\`\`\`

Field paths address blocks and items by their stable ids from the lesson
structure above. Examples:
  - section-1.content / section-1.label
  - dropdown-3.heading / dropdown-3.content
  - tab-2.content
  - objectives[0]
  - name / short_description

Rules:
- Only propose edits for text you can see in the lesson structure
- Keep original and replacement as plain text (no HTML)
- One edit per block — multiple edits get multiple blocks
- Prioritize: max 5 edits per response, highest impact first
- Always include the skill_id that motivated the edit

Edit length discipline:
- Keep "original" under ~200 characters. Quote the specific phrase, sentence, or clause that needs to change — NOT a whole paragraph. The UI highlights exact substrings inline; a paragraph-sized "original" flattens the diff into wall-of-text before/after blocks that are hard to read.
- If a whole paragraph needs rewriting, break it into 2-3 sentence-level edits so each one is scannable.
- "replacement" can be longer than "original" (you're often expanding scaffolding) but avoid replacements over ~400 characters — prefer splitting into multiple edits.`
}
