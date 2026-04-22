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
]

export type ToolInput = Record<string, unknown>
export type ToolResult = unknown

export function executeTool(name: string, input: ToolInput): ToolResult {
  switch (name) {
    case 'list_lessons': {
      const query = typeof input.query === 'string' ? input.query.toLowerCase() : ''
      const entries = SAMPLE_LESSONS.map((l) => ({
        id: l.id,
        name: l.name,
        short_description: l.short_description,
        blooms_profile: l.blooms_profile,
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
      // Strip per-element Bloom's ratings before handing the lesson to
      // Claude: those are UI-side snapshots of a prior analysis, and
      // exposing them would let Claude parrot the existing labels instead
      // of assessing the content itself. The lesson's `blooms_profile`
      // (the author's target) stays, since that's the intent Claude is
      // reviewing against.
      const { blooms_profile, ...rest } = lesson
      void blooms_profile // keep on the lesson; destructure just to satisfy lint on the clone
      return {
        ...rest,
        blooms_profile,
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
    default:
      return { error: 'unknown_tool', name }
  }
}
