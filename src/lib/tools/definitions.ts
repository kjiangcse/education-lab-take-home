/**
 * Tool definitions and executors for Claude's lesson/course read tools.
 *
 * Read-only for Phase 1. Propose-edit tools come in Phase 2 and will live here
 * alongside these. The executor is pure: it reads from the in-process sample
 * data (`SAMPLE_COURSE`, `SAMPLE_LESSONS_BY_ID`) and returns JSON-serializable
 * results. No network, no filesystem — runs fine in the edge runtime.
 */

import Anthropic from '@anthropic-ai/sdk'
import { SAMPLE_COURSE, SAMPLE_LESSONS, SAMPLE_LESSONS_BY_ID } from '@/lib/data/sample-course'
import type { Course } from '@/lib/types/course'
import type { Lesson, LessonBlock, SectionFeedback } from '@/lib/types/lesson'
import { getFeedbackAssemblyFormat } from '@/lib/skills/feedback-assembly'

/** In-flight context for the tool executor. The route passes the current
 *  lesson + course from the POST body so audit tools reflect the actual
 *  current state (with pending feedback), not just the static seed data. */
export type ToolContext = {
  currentLesson?: Lesson
  currentCourse?: Course
}

// ── Audit helpers ───────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function firstVerbs(text: string, max = 3): string[] {
  const ACTION = /\b(explain|describe|list|identify|name|recall|define|state|recognize|apply|use|run|build|create|design|draft|pick|choose|decide|implement|wire|configure|compare|contrast|analyze|break|decompose|evaluate|judge|assess|critique|weigh|produce|compose|generate|orient|introduce|set up|walk through|see|show|tell)\b/gi
  const matches = text.toLowerCase().match(ACTION) ?? []
  const dedup: string[] = []
  for (const v of matches) {
    if (!dedup.includes(v)) dedup.push(v)
    if (dedup.length >= max) break
  }
  return dedup
}

function summarizeBlock(block: LessonBlock): {
  id: string
  kind: string
  label?: string
  snippet: string
  primary_verbs: string[]
  children?: { id: string; heading: string; snippet: string; primary_verbs: string[] }[]
} {
  if (block.kind === 'richtext') {
    const text = stripHtml(block.content)
    return {
      id: block.id,
      kind: 'richtext',
      label: block.label,
      snippet: text.slice(0, 200) + (text.length > 200 ? '…' : ''),
      primary_verbs: firstVerbs(text),
    }
  }
  if (block.kind === 'dropdowns') {
    return {
      id: block.id,
      kind: 'dropdowns',
      snippet: `${block.items.length} dropdown items`,
      primary_verbs: [],
      children: block.items.map((d) => {
        const text = stripHtml(d.content)
        return {
          id: d.id,
          heading: d.heading,
          snippet: text.slice(0, 140) + (text.length > 140 ? '…' : ''),
          primary_verbs: firstVerbs(text),
        }
      }),
    }
  }
  if (block.kind === 'tabs') {
    return {
      id: block.id,
      kind: 'tabs',
      snippet: `${block.items.length} tab items`,
      primary_verbs: [],
      children: block.items.map((t) => {
        const text = stripHtml(t.content)
        return {
          id: t.id,
          heading: t.heading,
          snippet: text.slice(0, 140) + (text.length > 140 ? '…' : ''),
          primary_verbs: firstVerbs(text),
        }
      }),
    }
  }
  return {
    id: block.id,
    kind: block.kind,
    label: block.label,
    snippet: block.script_note ? block.script_note.slice(0, 200) : '(video placeholder, no script_note)',
    primary_verbs: block.script_note ? firstVerbs(block.script_note) : [],
  }
}

function resolveLesson(input: ToolInput, context?: ToolContext): Lesson | { error: string; hint: string } {
  const id = typeof input.lesson_id === 'string' ? input.lesson_id : ''
  if (!id) return { error: 'missing_lesson_id', hint: 'Pass lesson_id (e.g. "l4"). Call list_lessons if you need to discover it.' }
  // Prefer the in-flight lesson passed from the client — it reflects any
  // pending feedback and applied edits the user has made this session.
  if (context?.currentLesson?.id === id) return context.currentLesson
  const lesson = SAMPLE_LESSONS_BY_ID[id]
  if (!lesson) return { error: 'lesson_not_found', hint: `No lesson with id "${id}". Call list_lessons to see valid ids.` }
  return lesson
}

/** Flatten pending feedback across the lesson for quick surfacing in audits
 *  and the assembly step. Returns one entry per element with queued edits. */
function collectPendingFeedback(lesson: Lesson): Array<{ target_id: string; edit_count: number; reasons: string[] }> {
  const out: Array<{ target_id: string; edit_count: number; reasons: string[] }> = []
  const push = (target_id: string, fb: SectionFeedback | undefined) => {
    if (!fb || fb.edits.length === 0) return
    out.push({ target_id, edit_count: fb.edits.length, reasons: fb.edits.map((e) => e.reason) })
  }
  for (const b of lesson.blocks) {
    if (b.kind === 'richtext' || b.kind === 'video') push(b.id, b.feedback)
    if (b.kind === 'dropdowns') for (const d of b.items) push(d.id, d.feedback)
    if (b.kind === 'tabs') for (const t of b.items) push(t.id, t.feedback)
  }
  return out
}

export const TOOL_DEFINITIONS: Anthropic.Messages.Tool[] = [
  {
    name: 'list_lessons',
    description:
      'Return the catalog of lessons in the current course. Each entry includes the lesson id, title, short description, Bloom\'s profile, and duration. Use this to resolve user references like "lesson 2" or "the lesson on design thinking" into a concrete lesson id before calling get_lesson.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Optional case-insensitive substring filter against lesson name and short description. Omit for the full catalog.',
        },
      },
    },
  },
  {
    name: 'get_lesson',
    description:
      'Fetch the full content of one lesson by id: blocks in render order (richtext sections, dropdown groups, tab galleries) with stable type-scoped ids, plus objectives, feedback, and metadata. Call this before proposing edits or giving detailed review of a lesson that is not already in your current context.',
    input_schema: {
      type: 'object',
      properties: {
        lesson_id: {
          type: 'string',
          description: 'The lesson id (e.g. "l1", "l2"). Resolve ambiguous references via list_lessons first.',
        },
      },
      required: ['lesson_id'],
    },
  },
  {
    name: 'list_courses',
    description:
      'Return the catalog of available courses. The demo currently has one course; use get_course for its full content.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_course',
    description:
      'Fetch the current course: name, about, learning objectives, prerequisites, audience, estimated duration, target level. Does NOT include per-lesson detail — use get_lesson for that.',
    input_schema: {
      type: 'object',
      properties: {
        course_id: {
          type: 'string',
          description: 'Optional — ignored today since the demo has a single course.',
        },
      },
    },
  },
  // ── Audit tools ──────────────────────────────────────────────────────
  // These are the dimension-specific "lenses" the review protocol fans out
  // over in parallel before synthesizing a response. Each tool pre-digests
  // the lesson for one dimension and returns structured evidence + the
  // focused questions the AI must answer. No sub-LLM calls — the tools
  // just shape the AI's attention.
  {
    name: 'audit_attributes',
    description:
      'Audit lesson-level attributes: name, short_description, objectives, stated blooms_profile, duration. Returns the attribute values alongside the criteria for judging whether they are internally consistent and promise what the lesson actually delivers. Call as part of the parallel review fan-out.',
    input_schema: {
      type: 'object',
      properties: {
        lesson_id: { type: 'string', description: 'Target lesson id (e.g. "l4").' },
      },
      required: ['lesson_id'],
    },
  },
  {
    name: 'audit_blooms_alignment',
    description:
      'Audit Bloom\'s alignment: returns the stated target tier plus per-element snippets and primary verbs so you can judge observed cognitive level against target. Flags gaps between stated target and content behavior. Call as part of the parallel review fan-out.',
    input_schema: {
      type: 'object',
      properties: {
        lesson_id: { type: 'string', description: 'Target lesson id.' },
      },
      required: ['lesson_id'],
    },
  },
  {
    name: 'audit_content_structure',
    description:
      'Audit content structure: block order, component choice (richtext vs dropdowns vs tabs vs video), pacing, scaffolding, section lengths. Returns the block sequence with sizes and component kinds so you can judge whether the structure serves learning. Call as part of the parallel review fan-out.',
    input_schema: {
      type: 'object',
      properties: {
        lesson_id: { type: 'string', description: 'Target lesson id.' },
      },
      required: ['lesson_id'],
    },
  },
  {
    name: 'audit_user_journey',
    description:
      'Audit how the lesson fits the course-wide learner journey: course objectives, prerequisites, where this lesson sits in the sequence, which course objectives it advances. Call as part of the parallel review fan-out.',
    input_schema: {
      type: 'object',
      properties: {
        lesson_id: { type: 'string', description: 'Target lesson id.' },
      },
      required: ['lesson_id'],
    },
  },
  {
    name: 'audit_assessment',
    description:
      'Audit assessment: whether learning is actually verified anywhere in the lesson. Returns a summary of active/passive elements and whether any section asks the learner to make a decision, produce an artifact, or self-check. Call as part of the parallel review fan-out.',
    input_schema: {
      type: 'object',
      properties: {
        lesson_id: { type: 'string', description: 'Target lesson id.' },
      },
      required: ['lesson_id'],
    },
  },
  {
    name: 'assemble_feedback',
    description:
      'FINAL step of a review. Call this AFTER all five audit_* tools have returned. It re-reads the current lesson state (including any pending feedback), returns the lesson\'s stated objectives, a pending-edit summary, and the format spec for the user-facing response. Only call this once per review turn. Do NOT call audit_* or get_lesson after this — the next thing you emit is the user-facing response written against this format.',
    input_schema: {
      type: 'object',
      properties: {
        lesson_id: { type: 'string', description: 'Target lesson id. Must match the lesson the audits were run against.' },
      },
      required: ['lesson_id'],
    },
  },
]

export type ToolInput = Record<string, unknown>
export type ToolResult = unknown

export function executeTool(name: string, input: ToolInput, context?: ToolContext): ToolResult {
  switch (name) {
    case 'list_lessons': {
      const query = typeof input.query === 'string' ? input.query.toLowerCase() : ''
      // Deliberately not returning blooms_profile — the AI is the analyzer,
      // stored Bloom's labels are never passed as INPUT.
      const entries = SAMPLE_LESSONS.map((l) => ({
        id: l.id,
        name: l.name,
        short_description: l.short_description,
        duration_minutes: l.duration_minutes,
      }))
      return query
        ? entries.filter(
            (l) =>
              l.name.toLowerCase().includes(query) ||
              l.short_description.toLowerCase().includes(query),
          )
        : entries
    }
    case 'get_lesson': {
      const id = typeof input.lesson_id === 'string' ? input.lesson_id : ''
      const lesson = SAMPLE_LESSONS_BY_ID[id]
      if (!lesson) {
        return {
          error: 'lesson_not_found',
          lesson_id: id,
          hint: 'Call list_lessons to see valid ids.',
        }
      }
      // Strip ALL stored Bloom's state before handing the lesson to the AI.
      // The AI is the Bloom's analyzer — it assesses from content alone,
      // then produces ratings as OUTPUT that flow back into the lesson.
      // Passing any stored label (lesson-level profile or per-element level)
      // as INPUT would let the AI parrot it back instead of evaluating.
      const { blooms_profile: _bp, ...rest } = lesson
      void _bp
      return {
        ...rest,
        blocks: lesson.blocks.map((block) => {
          if (block.kind === 'richtext') {
            const { blooms_level: _bl, blooms_note: _bn, ...rt } = block
            void _bl; void _bn
            return rt
          }
          if (block.kind === 'dropdowns') {
            return {
              ...block,
              items: block.items.map((d) => {
                const { blooms_level: _bl, blooms_note: _bn, ...item } = d
                void _bl; void _bn
                return item
              }),
            }
          }
          if (block.kind === 'tabs') {
            return {
              ...block,
              items: block.items.map((t) => {
                const { blooms_level: _bl, ...item } = t
                void _bl
                return item
              }),
            }
          }
          return block
        }),
      }
    }
    case 'list_courses': {
      return [
        {
          id: SAMPLE_COURSE.id,
          name: SAMPLE_COURSE.name,
          short_description: SAMPLE_COURSE.short_description,
        },
      ]
    }
    case 'get_course': {
      return SAMPLE_COURSE
    }
    case 'audit_attributes': {
      const lesson = resolveLesson(input, context)
      if ('error' in lesson) return lesson
      return {
        dimension: 'attributes',
        values: {
          name: lesson.name,
          short_description: lesson.short_description,
          duration_minutes: lesson.duration_minutes,
          // Stored blooms_profile intentionally omitted — you infer the
          // intended tier from the user's stated goal + the objective verbs,
          // then produce Bloom's ratings as output.
          objectives: lesson.objectives.map((o, i) => ({
            id: `objective-${i + 1}`,
            text: o,
            primary_verbs: firstVerbs(o),
          })),
        },
        criteria: [
          'Does the title promise what the lesson actually delivers?',
          'Does short_description match the scope and depth of the blocks?',
          'Do the objective verbs imply a concrete, observable tier? Unobservable verbs ("understand", "be familiar with") cap what the lesson can verify.',
          'Is there a gap between any single objective and the section(s) that would deliver it?',
        ],
        output_shape: {
          top_issues: '[{target_id, observation, severity: low|med|high}]',
          one_line_summary: 'string — the attribute-level pattern in one sentence',
        },
      }
    }
    case 'audit_blooms_alignment': {
      const lesson = resolveLesson(input, context)
      if ('error' in lesson) return lesson
      return {
        dimension: 'blooms_alignment',
        // No target_tier is passed. You are the analyzer — derive the
        // intended tier from the user\'s stated goal in the conversation
        // and from the objective verbs below. Your Bloom\'s ratings per
        // element are the OUTPUT; they will be persisted back onto the
        // lesson via edit blocks with `blooms_level_after`.
        objectives: lesson.objectives.map((o, i) => ({
          id: `objective-${i + 1}`,
          text: o,
          primary_verbs: firstVerbs(o),
        })),
        elements: lesson.blocks.map(summarizeBlock),
        criteria: [
          'Infer the intended tier from the user\'s conversation plus the objective verbs (the highest tier the objectives legitimately imply).',
          'For each element, judge the observed cognitive level from its verbs + the action asked of the learner.',
          'Compare observed vs intended. Name the gap direction (below | at | above) per element.',
          'Which 1–3 elements show the biggest gap, and why? (concrete verb or missing decision)',
          'If the lesson systematically sits below intent, name the single structural change that would move the most elements up one tier.',
        ],
        output_shape: {
          intended_tier: 'string — the tier you inferred for this lesson (not a stored value)',
          per_element: '[{target_id, observed_level, gap: below|at|above, evidence: one short phrase}]',
          biggest_gap_ids: 'string[] — the 1–3 target_ids with the largest gap, in impact order',
          one_line_summary: 'string — the Bloom\'s pattern in one sentence',
        },
      }
    }
    case 'audit_content_structure': {
      const lesson = resolveLesson(input, context)
      if ('error' in lesson) return lesson
      const sequence = lesson.blocks.map((b, idx) => {
        if (b.kind === 'richtext') {
          const plain = stripHtml(b.content)
          return { position: idx + 1, id: b.id, kind: 'richtext', label: b.label, char_count: plain.length, word_count: plain.split(/\s+/).filter(Boolean).length }
        }
        if (b.kind === 'dropdowns') return { position: idx + 1, id: b.id, kind: 'dropdowns', item_count: b.items.length, headings: b.items.map((d) => d.heading) }
        if (b.kind === 'tabs') return { position: idx + 1, id: b.id, kind: 'tabs', item_count: b.items.length, headings: b.items.map((t) => t.heading) }
        return { position: idx + 1, id: b.id, kind: 'video', title: b.title, has_script_note: Boolean(b.script_note) }
      })
      return {
        dimension: 'content_structure',
        block_sequence: sequence,
        criteria: [
          'Does the block order scaffold from orientation → explanation → application, or does it front-load dense reference and back-load practice?',
          'Are any richtext sections walls of text (rough cutoff: >900 characters without structural relief)?',
          'Is the component choice earning its keep? Dropdowns for progressive disclosure, tabs for parallel comparison, richtext for narrative. A tabs gallery used as a flat list is a misuse.',
          'Is there a visible pacing problem — e.g. three consecutive richtext walls with no activity between them, or a single decision buried in an appendix?',
        ],
        output_shape: {
          top_issues: '[{target_id, pattern, severity}]',
          one_line_summary: 'string',
        },
      }
    }
    case 'audit_user_journey': {
      const lesson = resolveLesson(input, context)
      if ('error' in lesson) return lesson
      // Per-lesson blooms_profile intentionally omitted from the sequence —
      // the AI derives cognitive expectations from the content, not stored
      // labels.
      const courseLessons = SAMPLE_LESSONS.map((l, i) => ({ index: i + 1, id: l.id, name: l.name, short_description: l.short_description }))
      const position = courseLessons.findIndex((l) => l.id === lesson.id)
      return {
        dimension: 'user_journey',
        course: {
          name: SAMPLE_COURSE.name,
          short_description: SAMPLE_COURSE.short_description,
          learning_objectives: SAMPLE_COURSE.learning_objectives,
          audience: SAMPLE_COURSE.audience,
          prerequisites: SAMPLE_COURSE.prerequisites,
        },
        lesson_position: position >= 0 ? position + 1 : null,
        total_lessons: courseLessons.length,
        sequence: courseLessons,
        criteria: [
          'Which course-level objective(s) does this lesson advance? Is that advance visible in the blocks?',
          'Does the lesson assume prerequisites the prior lesson(s) actually teach, or is there a silent gap?',
          'If this lesson were removed, which course objective would fail? If none, the lesson is load-bearing in name only.',
          'Does the next lesson pick up where this one leaves off, or is there a tonal/cognitive jump?',
        ],
        output_shape: {
          objectives_advanced: 'string[] — course objectives this lesson makes progress on',
          journey_gaps: 'string[] — missing prerequisites or handoff mismatches',
          one_line_summary: 'string',
        },
      }
    }
    case 'audit_assessment': {
      const lesson = resolveLesson(input, context)
      if ('error' in lesson) return lesson
      const DECISION_CUES = /\b(decide|choose|pick|judge|evaluate|compare|contrast|design|draft|apply|implement|which|why)\b/i
      const elements = lesson.blocks.flatMap<{ id: string; kind: string; asks_decision: boolean; cue?: string }>((b) => {
        if (b.kind === 'richtext') {
          const text = stripHtml(b.content)
          const m = text.match(DECISION_CUES)
          return [{ id: b.id, kind: 'richtext', asks_decision: Boolean(m), cue: m?.[0] }]
        }
        if (b.kind === 'dropdowns') {
          return b.items.map((d) => {
            const text = stripHtml(d.content)
            const m = text.match(DECISION_CUES)
            return { id: d.id, kind: 'dropdown', asks_decision: Boolean(m), cue: m?.[0] }
          })
        }
        if (b.kind === 'tabs') {
          return b.items.map((t) => {
            const text = stripHtml(t.content)
            const m = text.match(DECISION_CUES)
            return { id: t.id, kind: 'tab', asks_decision: Boolean(m), cue: m?.[0] }
          })
        }
        return [{ id: b.id, kind: 'video', asks_decision: false }]
      })
      const active = elements.filter((e) => e.asks_decision)
      return {
        dimension: 'assessment',
        elements,
        active_count: active.length,
        passive_count: elements.length - active.length,
        criteria: [
          'Is learning actually verified anywhere? An element with no decision cue is passive — the learner reads but doesn\'t demonstrate.',
          'Do the objectives promise outcomes the content never asks the learner to demonstrate? That\'s a stated/actual mismatch.',
          'Is there at least one element where the learner must produce an artifact, pick between options, or self-check against a criterion?',
          'If all elements are passive, name the single smallest addition (one embedded prompt, one self-check) that would add verification.',
        ],
        output_shape: {
          verification_present: 'boolean',
          gaps: 'string[] — objectives unverified by any element',
          smallest_fix: 'string — the minimum addition to add verification',
          one_line_summary: 'string',
        },
      }
    }
    case 'assemble_feedback': {
      const lesson = resolveLesson(input, context)
      if ('error' in lesson) return lesson
      // Build an explicit allowlist of every card id the AI is allowed to
      // emit for this lesson. Every `{{{card:ID}}}` marker in the response
      // must use one of these. Anything else will render as "Artifact
      // unavailable" — do not invent ids.
      const card_ids: { kind: string; id: string; label?: string }[] = []
      lesson.objectives.forEach((_, i) => card_ids.push({ kind: 'objective', id: `objective-${i + 1}` }))
      for (const b of lesson.blocks) {
        if (b.kind === 'richtext') card_ids.push({ kind: 'richtext', id: b.id, label: b.label })
        if (b.kind === 'video') card_ids.push({ kind: 'video', id: b.id, label: b.label })
        if (b.kind === 'dropdowns') {
          card_ids.push({ kind: 'dropdowns', id: b.id })
          for (const d of b.items) card_ids.push({ kind: 'dropdown', id: d.id, label: d.heading })
        }
        if (b.kind === 'tabs') {
          card_ids.push({ kind: 'tabs', id: b.id })
          for (const t of b.items) card_ids.push({ kind: 'tab', id: t.id, label: t.heading })
        }
      }
      return {
        step: 'assemble',
        lesson_id: lesson.id,
        lesson_name: lesson.name,
        // No stored Bloom's target passed. The AI derives intended tier
        // from the user\'s conversation goal + the objective verbs.
        objectives: lesson.objectives.map((o, i) => ({
          id: `objective-${i + 1}`,
          text: o,
          primary_verbs: firstVerbs(o),
        })),
        valid_card_ids: card_ids,
        pending_feedback_summary: collectPendingFeedback(lesson),
        format: getFeedbackAssemblyFormat(),
      }
    }
    default:
      return { error: 'unknown_tool', name }
  }
}
