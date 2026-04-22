import Anthropic from '@anthropic-ai/sdk'
import { buildLessonReviewPrompt, getBaseRegister } from '@/lib/skills/build-prompt'
import { TOOL_DEFINITIONS, executeTool, type ToolInput } from '@/lib/tools/definitions'
import type { Course } from '@/lib/types/course'
import type { Lesson } from '@/lib/types/lesson'

export const runtime = 'edge'

const MAX_TOOL_ROUNDS = 8

function friendlyError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { error?: { error?: { message?: string; type?: string } }; status?: number; message?: string }
    const apiMessage = e.error?.error?.message
    const apiType = e.error?.error?.type
    if (apiMessage) {
      if (apiType === 'invalid_request_error' && /credit balance/i.test(apiMessage)) {
        return 'Your Anthropic account is out of credits. Top up at console.anthropic.com → Plans & Billing.'
      }
      if (e.status === 401) return 'Invalid API key. Check ANTHROPIC_API_KEY in .env.'
      if (e.status === 429) return "Rate limited. Wait a moment and try again."
      return apiMessage
    }
    if (e.message) return e.message
  }
  return String(err)
}

const apiKey = process.env.ANTHROPIC_API_KEY

export async function POST(req: Request) {
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY not configured', { status: 501 })
  }

  const { model, messages, lesson, course } = await req.json() as {
    model: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    lesson?: Lesson
    course?: Course
  }
  const client = new Anthropic({ apiKey })

  // Use shared prompt builder — identical to what the Prompt Lab uses.
  // When lesson+course context is available we inject the focused lesson;
  // otherwise Claude discovers via tools.
  const systemPrompt = (lesson && course)
    ? buildLessonReviewPrompt(lesson, course)
    : getBaseRegister()

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Working conversation copy — the tool loop mutates this by appending
      // assistant tool_use and follow-up user tool_result blocks.
      const convo: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      try {
        let round = 0
        while (round < MAX_TOOL_ROUNDS) {
          round++
          const turnStream = client.messages.stream(
            {
              model,
              max_tokens: 8096,
              system: systemPrompt,
              tools: TOOL_DEFINITIONS,
              messages: convo,
            },
            { signal: req.signal },
          )

          turnStream.on('text', (delta) => {
            send('text', { delta })
          })

          const finalMessage = await turnStream.finalMessage()

          if (finalMessage.stop_reason !== 'tool_use') {
            // Claude finished its turn without requesting more tools.
            break
          }

          // Extract tool_use blocks from the assistant message.
          const toolUses = finalMessage.content.flatMap((block) =>
            block.type === 'tool_use'
              ? [{ id: block.id, name: block.name, input: block.input as ToolInput }]
              : [],
          )
          if (toolUses.length === 0) {
            // stop_reason was tool_use but no tool blocks — defensive exit.
            break
          }

          // Execute tools (all reads → safe to run in parallel).
          const toolResults = toolUses.map((tu) => {
            send('tool_call', { id: tu.id, name: tu.name, input: tu.input })
            let result: unknown
            try {
              result = executeTool(tu.name, tu.input)
            } catch (err) {
              result = { error: 'execution_failed', message: String(err) }
            }
            send('tool_result', { id: tu.id, name: tu.name })
            return {
              type: 'tool_result' as const,
              tool_use_id: tu.id,
              content: JSON.stringify(result),
            }
          })

          // Append assistant turn + tool_result user turn, then continue the loop.
          convo.push({ role: 'assistant', content: finalMessage.content })
          convo.push({ role: 'user', content: toolResults })
        }

        send('done', {})
      } catch (err) {
        console.error('Anthropic stream error:', err)
        // Use a plain text frame so the existing [[error]] block styling picks it up.
        send('text', { delta: `\n\n[[error]] ${friendlyError(err)}` })
        send('done', {})
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
