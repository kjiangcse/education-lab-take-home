import Anthropic from '@anthropic-ai/sdk'
import { buildLessonReviewPrompt, REVIEW_MODEL } from '@/lib/skills/build-prompt'
import { serializeLessonForPrompt } from '@/lib/skills/serialize'
import { getWritingGuidelines } from '@/lib/skills/writing-guidelines'
import { LESSON_PATTERNS } from '@/lib/skills/failure-patterns'
import type { Course } from '@/lib/types/course'
import type { Lesson } from '@/lib/types/lesson'

export const runtime = 'edge'
export const maxDuration = 120

const apiKey = process.env.ANTHROPIC_API_KEY

/**
 * Single-turn endpoint for the simulation.
 * The client orchestrates the multi-turn loop, calling this once per turn.
 *
 * Actions: 'review' | 'persona' | 'score' | 'audit'
 */
export async function POST(req: Request) {
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 501 })

  const body = await req.json()
  const client = new Anthropic({ apiKey })

  switch (body.action) {
    case 'review': {
      const { lesson, course, history } = body as {
        action: string; lesson: Lesson; course: Course
        history: { role: 'user' | 'assistant'; content: string }[]
      }

      const reviewerSystem = buildReviewerPrompt(lesson, course)
      const messages = [
        ...history,
        { role: 'user' as const, content: history.length === 0
          ? 'Review this lesson and identify the most important issues. Propose specific edits.'
          : 'The specialist responded. Continue reviewing (lesson may have been updated). Focus on remaining issues.'
        },
      ]

      const response = await client.messages.create({
        model: REVIEW_MODEL,
        max_tokens: 2000,
        system: reviewerSystem,
        messages,
      })

      return Response.json({
        message: response.content[0].type === 'text' ? response.content[0].text : '',
      })
    }

    case 'persona': {
      const { persona_description, reviewer_message, persona_behavior } = body as {
        action: string; persona_description: string; reviewer_message: string; persona_behavior?: string
      }

      const behavior = persona_behavior || 'You generally accept feedback that makes sense. When you have a question, ask it directly, not as pushback, but because you genuinely want to understand. You are learning, not debating.'

      const response = await client.messages.create({
        model: REVIEW_MODEL,
        max_tokens: 300,
        system: `You are simulating a customer education specialist with these traits: ${persona_description}

Your behavior in this conversation:
${behavior}

Respond naturally. Type like a coworker in Slack: casual, lowercase, no em dashes. 1-3 sentences.

Important: you are a learner, not a peer. If the reviewer explains something you didn't know before, acknowledge that you learned something. Don't pretend you already knew it. Ask follow-up questions that show you're processing the feedback, not evaluating it.

Examples of good novice responses:
- "oh wait, i didn't realize that was a bloom's thing. so if my objective says apply, the section needs an actual exercise?"
- "that makes sense about the wall of text. how do i know when to split vs when to keep it together?"
- "ok ill accept those edits. one thing though, if i move the setup to a dropdown, won't people miss it?"`,
        messages: [{ role: 'user', content: `The reviewer said:\n\n${reviewer_message}\n\nRespond as this specialist. Remember: you're learning, not reviewing.` }],
      })

      return Response.json({
        message: response.content[0].type === 'text' ? response.content[0].text : '',
      })
    }

    case 'score': {
      const { lesson, course } = body as { action: string; lesson: Lesson; course: Course }
      const ctx = serializeLessonForPrompt(lesson, course)

      const response = await client.messages.create({
        model: REVIEW_MODEL,
        max_tokens: 1500,
        system: `Diagnose failure patterns. Named patterns: ${Object.values(LESSON_PATTERNS).map(p => `${p.id}: ${p.label}`).join(', ')}.\n\nReturn ONLY JSON:\n{"patterns":[{"pattern":"id","label":"name","description":"specific","severity":"blocking|significant|minor"}]}`,
        messages: [{ role: 'user', content: `${ctx}\n\nDiagnose.` }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const parsed = extractJSON(raw)
      return Response.json(parsed ?? { patterns: [] })
    }

    case 'audit': {
      const { lesson, course, context } = body as { action: string; lesson: Lesson; course: Course; context?: string }
      const ctx = serializeLessonForPrompt(lesson, course)
      const guidelines = getWritingGuidelines()

      const response = await client.messages.create({
        model: REVIEW_MODEL,
        max_tokens: 1500,
        system: `Audit this lesson. Be specific. Reference the actual content directly — quote it.

${guidelines}

You MUST return a single JSON object and NOTHING else. No markdown fences, no preamble, no explanation. Just the raw JSON:

{"content_design":"2-3 sentences about structure, scaffolding, format, pacing","blooms_objectives":"2-3 sentences about cognitive levels and objective quality","writing_quality":"2-3 sentences about tone, voice, readability per style guide","overall":"the single most important thing about this lesson right now","strongest":"what is working best","weakest":"what needs the most attention"}`,
        messages: [{ role: 'user', content: `${ctx}${context ? `\n\nContext: ${context}` : ''}\n\nReturn the JSON audit now.` }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
      const parsed = extractJSON(raw)
      return Response.json(parsed ?? { overall: 'Audit failed — could not parse response', content_design: '', blooms_objectives: '', writing_quality: '', strongest: '', weakest: '' })
    }

    default:
      return Response.json({ error: `Unknown action: ${body.action}` }, { status: 400 })
  }
}

// Uses shared prompt builder — identical to chat API
function buildReviewerPrompt(lesson: Lesson, course: Course): string {
  return buildLessonReviewPrompt(lesson, course)
}

// Robust JSON extraction — handles markdown fences, preamble text, etc.
function extractJSON(text: string): Record<string, unknown> | null {
  // Try raw parse first
  try { return JSON.parse(text.trim()) } catch { /* continue */ }

  // Try stripping markdown fences
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()) } catch { /* continue */ }
  }

  // Try finding the first { ... } block
  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]) } catch { /* continue */ }
  }

  return null
}
