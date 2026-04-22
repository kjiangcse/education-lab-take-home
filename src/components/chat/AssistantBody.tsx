'use client'

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BloomTaxonomy } from './BloomTaxonomy'
import { InlineCard, type InlineCardKind } from './InlineCard'
import { ToolPill, type ToolActivityEvent } from './ToolActivity'
import { UserJourney } from './UserJourney'
import { stripEditBlocks } from '@/lib/edit-parser'
import { BLOOM_COVERAGE_BY_CHAT } from '@/lib/demo/bloom-coverage'
import type { BloomLevel } from '@/lib/types/blooms'
import type { Lesson } from '@/lib/types/lesson'

type AssistantBodyProps = {
  text: string
  /** Optional lesson override passed through to InlineCard for inline artifacts. */
  lesson?: Lesson
  /**
   * Lesson id this message was authored against. When set, inline cards
   * resolve their content from that specific lesson regardless of the
   * user's current right-panel navigation.
   */
  lessonId?: string
  /** Chat id this message belongs to — cards use it to target the right panel for the jump action. */
  chatId?: string
  /**
   * Events that happened during this message's stream. Rendered inline at
   * `{{{tool:ID}}}` markers embedded in `text`.
   */
  toolEvents?: ToolActivityEvent[]
}

/**
 * Artifact markers that can be embedded anywhere in Claude's response.
 * Supported:
 *   {{{bloom:LEVEL}}}                     — Bloom's pyramid
 *   [[bloom:LEVEL]]                       — legacy alias
 *   {{{card:ID}}}                         — renders a block or item by stable id
 *                                           (section-1 / dropdown-3 / dropdowns-1 / tabs-1)
 *   {{{card:GROUP_ID:ITEM_ID,ITEM_ID}}}   — a group block rendered with a subset of items
 *   {{{card:diff:ID}}}                    — edit preview for a richtext block
 *   {{{tool:ID}}}                         — tool-use pill
 *   {{{journey}}}                         — course-level learner-journey map
 *   {{{bloom-coverage}}}                  — Bloom's distribution/coverage widget
 *                                           (config resolved from chatId)
 *   [[error]] TEXT                        — error display
 */

const ARTIFACT_REGEX = /\{\{\{bloom:(remember|understand|apply|analyze|evaluate|create)\}\}\}|\[\[bloom:(remember|understand|apply|analyze|evaluate|create)\]\]|\{\{\{card:diff:([a-z0-9-]+)\}\}\}|\{\{\{card:([a-z0-9-]+)(?::([a-z0-9,\-\s]+))?\}\}\}|\{\{\{tool:([^}]+)\}\}\}|\{\{\{(journey)\}\}\}|\{\{\{bloom-coverage(?::([a-z0-9-]+))?\}\}\}/g

type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'bloom'; level: BloomLevel }
  | { kind: 'bloom-coverage'; variant?: string }
  | { kind: 'card'; cardKind: InlineCardKind; id: string; itemIds?: string[] }
  | { kind: 'tool'; id: string }
  | { kind: 'journey' }

function splitSegments(text: string): Segment[] {
  const out: Segment[] = []
  let last = 0
  let m: RegExpExecArray | null
  ARTIFACT_REGEX.lastIndex = 0
  while ((m = ARTIFACT_REGEX.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) })
    const [full, bloomNew, bloomLegacy, diffId, cardId, itemFilter, toolId, journey, coverageVariant] = m
    if (bloomNew || bloomLegacy) {
      out.push({ kind: 'bloom', level: (bloomNew || bloomLegacy) as BloomLevel })
    } else if (toolId) {
      out.push({ kind: 'tool', id: toolId })
    } else if (journey) {
      out.push({ kind: 'journey' })
    } else if (full.startsWith('{{{bloom-coverage')) {
      out.push({ kind: 'bloom-coverage', variant: coverageVariant || undefined })
    } else if (diffId) {
      out.push({ kind: 'card', cardKind: 'diff', id: diffId })
    } else if (cardId) {
      const itemIds = itemFilter
        ? itemFilter.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
      out.push({ kind: 'card', cardKind: 'by-id', id: cardId, itemIds })
    }
    last = ARTIFACT_REGEX.lastIndex
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) })
  return out
}

function hasArtifacts(text: string): boolean {
  ARTIFACT_REGEX.lastIndex = 0
  return ARTIFACT_REGEX.test(text)
}

export function AssistantBody({ text: rawText, lesson, lessonId, chatId, toolEvents }: AssistantBodyProps) {
  const text = stripEditBlocks(rawText)
  const toolsById = new Map((toolEvents ?? []).map((e) => [e.id, e]))

  // Error handling
  if (text.includes('[[error]]')) {
    const parts = text.split(/\[\[error\]\]\s*/)
    return (
      <>
        {parts[0] && <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{parts[0]}</Markdown>}
        {parts[1] && (
          <div className="my-1 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {parts[1]}
          </div>
        )}
      </>
    )
  }

  // Split on artifact markers and render mixed content
  if (hasArtifacts(text)) {
    const segments = splitSegments(text)
    return (
      <>
        {segments.map((seg, i) => {
          if (seg.kind === 'bloom') return <BloomTaxonomy key={i} level={seg.level} lesson={lesson} lessonId={lessonId} chatId={chatId} />
          if (seg.kind === 'bloom-coverage') {
            const cfgKey = chatId
              ? seg.variant
                ? `${chatId}:${seg.variant}`
                : chatId
              : undefined
            const cfg = cfgKey ? BLOOM_COVERAGE_BY_CHAT[cfgKey] : undefined
            return cfg ? <BloomTaxonomy key={i} {...cfg} lesson={lesson} lessonId={lessonId} chatId={chatId} /> : null
          }
          if (seg.kind === 'tool') {
            const ev = toolsById.get(seg.id)
            return ev ? <ToolPill key={i} event={ev} /> : null
          }
          if (seg.kind === 'journey') return <UserJourney key={i} />
          if (seg.kind === 'card') return <InlineCard key={i} kind={seg.cardKind} id={seg.id} itemIds={seg.itemIds} lesson={lesson} lessonId={lessonId} chatId={chatId} />
          return seg.text.trim() ? (
            <Markdown key={i} components={markdownComponents}>
              {seg.text}
            </Markdown>
          ) : null
        })}
      </>
    )
  }

  return <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{text}</Markdown>
}

const markdownComponents = {
  h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
    <h1
      style={{
        fontSize: 20,
        fontWeight: 600,
        color: 'rgb(20, 20, 19)',
        margin: '16px 0 8px',
        lineHeight: 1.3,
      }}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
    <h2
      style={{
        fontSize: 17,
        fontWeight: 600,
        color: 'rgb(20, 20, 19)',
        margin: '14px 0 6px',
        lineHeight: 1.3,
      }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
    <h3
      style={{
        fontSize: 15,
        fontWeight: 600,
        color: 'rgb(20, 20, 19)',
        margin: '12px 0 4px',
        lineHeight: 1.3,
      }}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.ComponentProps<'p'>) => (
    <p
      style={{
        margin: '0 0 10px',
        lineHeight: 1.6,
      }}
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
    <ul
      style={{
        margin: '4px 0 12px',
        paddingLeft: 20,
        listStyleType: 'disc',
      }}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
    <ol
      style={{
        margin: '4px 0 12px',
        paddingLeft: 20,
        listStyleType: 'decimal',
      }}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentProps<'li'>) => (
    <li
      style={{
        marginBottom: 4,
        lineHeight: 1.5,
      }}
      {...props}
    >
      {children}
    </li>
  ),
  strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
    <strong style={{ fontWeight: 600 }} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.ComponentProps<'em'>) => (
    <em style={{ fontStyle: 'italic' }} {...props}>
      {children}
    </em>
  ),
  blockquote: ({ children, ...props }: React.ComponentProps<'blockquote'>) => (
    <blockquote
      style={{
        borderLeft: '3px solid rgba(217, 119, 87, 0.4)',
        paddingLeft: 16,
        margin: '8px 0 12px',
        color: 'rgb(61, 61, 58)',
        fontStyle: 'italic',
      }}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: React.ComponentProps<'code'>) => (
    <code
      style={{
        backgroundColor: 'rgba(31, 30, 29, 0.06)',
        padding: '2px 5px',
        borderRadius: 4,
        fontSize: '0.9em',
        fontFamily: 'var(--font-geist-mono), monospace',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      }}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: React.ComponentProps<'pre'>) => (
    <pre
      style={{
        backgroundColor: 'rgba(31, 30, 29, 0.05)',
        padding: 12,
        borderRadius: 6,
        margin: '8px 0',
        fontSize: '0.85em',
        fontFamily: 'var(--font-geist-mono), monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        overflowX: 'auto',
        maxWidth: '100%',
      }}
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }: React.ComponentProps<'table'>) => (
    <div style={{ overflowX: 'auto', margin: '10px 0', maxWidth: '100%' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontSize: '0.92em',
          lineHeight: 1.5,
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.ComponentProps<'thead'>) => (
    <thead {...props}>{children}</thead>
  ),
  tbody: ({ children, ...props }: React.ComponentProps<'tbody'>) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }: React.ComponentProps<'tr'>) => (
    <tr style={{ borderBottom: '1px solid rgba(31, 30, 29, 0.08)' }} {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.ComponentProps<'th'>) => (
    <th
      style={{
        textAlign: 'left',
        padding: '8px 10px',
        fontWeight: 600,
        backgroundColor: 'rgba(31, 30, 29, 0.04)',
        borderBottom: '1px solid rgba(31, 30, 29, 0.15)',
        verticalAlign: 'top',
      }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.ComponentProps<'td'>) => (
    <td
      style={{
        padding: '8px 10px',
        verticalAlign: 'top',
      }}
      {...props}
    >
      {children}
    </td>
  ),
}
