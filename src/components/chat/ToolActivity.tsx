'use client'

import { Check, Loader2 } from 'lucide-react'

export type ToolActivityEvent = {
  id: string
  name: string
  input?: unknown
  status: 'running' | 'done'
}

function labelFor(name: string, input: unknown): string {
  const obj = (input ?? {}) as Record<string, unknown>
  switch (name) {
    case 'list_lessons': {
      const q = typeof obj.query === 'string' && obj.query.trim() ? obj.query.trim() : ''
      return q ? `Searching lessons for "${q}"` : 'Reading lesson catalog'
    }
    case 'get_lesson': {
      const id = typeof obj.lesson_id === 'string' ? obj.lesson_id : ''
      return id ? `Reading lesson ${id}` : 'Reading lesson'
    }
    case 'list_courses':
      return 'Reading course catalog'
    case 'get_course':
      return 'Reading course'
    case 'audit_attributes':
      return 'Auditing lesson attributes'
    case 'audit_blooms_alignment':
      return "Auditing Bloom's alignment"
    case 'audit_content_structure':
      return 'Auditing content structure'
    case 'audit_user_journey':
      return 'Auditing learner journey'
    case 'audit_assessment':
      return 'Auditing assessment'
    case 'assemble_feedback':
      return 'Assembling feedback'
    default:
      return name
  }
}

type PillProps = {
  event: ToolActivityEvent
}

export function ToolPill({ event: ev }: PillProps) {
  return (
    <div style={{ display: 'flex', margin: '6px 0' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid rgba(31, 30, 29, 0.1)',
          backgroundColor: 'rgba(31, 30, 29, 0.03)',
          fontSize: 11,
          color: 'rgb(61, 61, 58)',
          fontFamily: 'var(--font-geist-mono), monospace',
          letterSpacing: '0.01em',
        }}
      >
        {ev.status === 'running' ? (
          <Loader2 size={12} style={{ color: 'rgb(217, 119, 87)', animation: 'toolSpin 1s linear infinite' }} />
        ) : (
          <Check size={12} style={{ color: 'rgb(21, 128, 61)' }} />
        )}
        <span>{labelFor(ev.name, ev.input)}</span>
      </div>
      <style>{`@keyframes toolSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

type Props = {
  events: ToolActivityEvent[]
}

/**
 * Legacy block rendering of all tool events stacked. No longer used for the
 * main chat (pills are now inline via {{{tool:ID}}} markers), but kept for
 * any caller that still wants a summary list.
 */
export function ToolActivity({ events }: Props) {
  if (events.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '4px 0 8px' }}>
      {events.map((ev) => (
        <ToolPill key={ev.id} event={ev} />
      ))}
    </div>
  )
}
