import type { Message } from './types/chat'
import { CANNED_RESPONSE, DEFAULT_CONFIG } from './seed'

export type Model = {
  id: string
  label: string
}

export const MODELS: Model[] = [
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
]

export const DEFAULT_MODEL = MODELS[2]

export type ToolCallEvent = { id: string; name: string; input: unknown }
export type ToolResultEvent = { id: string; name: string }

export type StreamCallbacks = {
  onDelta: (chunk: string) => void
  onToolCall?: (event: ToolCallEvent) => void
  onToolResult?: (event: ToolResultEvent) => void
}

/**
 * Stream a chat completion over Server-Sent Events.
 *
 * The server route emits four event types: `text` (Claude prose delta),
 * `tool_call` (Claude invoked a tool), `tool_result` (tool finished), and
 * `done` (turn complete). This parses them and dispatches to the matching
 * callback. The full accumulated assistant text is returned when the stream
 * closes.
 *
 * Falls back to a simulated canned response when the server has no API key.
 */
export async function streamChat(
  history: Message[],
  model: Model,
  callbacks: StreamCallbacks | ((chunk: string) => void),
  signal?: AbortSignal,
  extra?: {
    lesson?: Record<string, unknown>
    course?: Record<string, unknown>
  },
): Promise<string> {
  // Backward compat: allow passing just an onDelta function
  const cb: StreamCallbacks = typeof callbacks === 'function' ? { onDelta: callbacks } : callbacks

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model.id,
      messages: history.map((m) => ({ role: m.role, content: m.text })),
      lesson: extra?.lesson || null,
      course: extra?.course || null,
    }),
    signal,
  })

  if (res.status === 501) {
    return simulate(cb.onDelta, signal)
  }

  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed: ${res.status}`)
  }

  let full = ''
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += value

      // Process complete SSE frames (double-newline separated).
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        if (!frame.trim()) continue

        let event = 'message'
        let data = ''
        for (const line of frame.split('\n')) {
          if (line.startsWith('event: ')) event = line.slice(7).trim()
          else if (line.startsWith('data: ')) data += line.slice(6)
        }

        let parsed: unknown = {}
        if (data) {
          try { parsed = JSON.parse(data) } catch { /* ignore */ }
        }
        const payload = parsed as Record<string, unknown>

        switch (event) {
          case 'text': {
            const delta = typeof payload.delta === 'string' ? payload.delta : ''
            if (delta) {
              full += delta
              cb.onDelta(delta)
            }
            break
          }
          case 'tool_call': {
            cb.onToolCall?.({
              id: String(payload.id ?? ''),
              name: String(payload.name ?? ''),
              input: payload.input,
            })
            break
          }
          case 'tool_result': {
            cb.onToolResult?.({
              id: String(payload.id ?? ''),
              name: String(payload.name ?? ''),
            })
            break
          }
          case 'done':
            return full
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
  return full
}

async function simulate(onDelta: (chunk: string) => void, signal?: AbortSignal): Promise<string> {
  await delay(DEFAULT_CONFIG.thinkingDelay, signal)

  let full = ''
  for (const char of CANNED_RESPONSE) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    full += char
    onDelta(char)
    await delay(DEFAULT_CONFIG.streamSpeed)
  }
  return full
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
