'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useLesson, type LessonOverlay } from '@/lib/lesson-context'
import { RichTextViewer } from '@/components/simulator/richtext'
import { ExpandableDropdown } from '@/components/simulator/expandable-dropdown'
import { TabbedGallery } from '@/components/simulator/tabbed-gallery'
import { renderEditsInline } from '@/lib/format-edits'
import type {
  Lesson,
  LessonDropdown,
  DropdownsBlock,
  TabsBlock,
  VideoBlock,
  RichTextBlock,
} from '@/lib/types/lesson'
import {
  findRichTextBlock,
  findDropdownsBlock,
  findTabsBlock,
  findVideoBlock,
  findDropdownItem,
  findTabItem,
  findObjectiveById,
} from '@/lib/types/lesson'

/** Soft cap on inline-card body height. Taller content collapses behind a fade
 *  with a "Show all" toggle, then breaks at the nearest paragraph when expanded. */
const CARD_MAX_HEIGHT = 'min(60vh, 520px)'

export type InlineCardKind = 'by-id' | 'diff'

type Props = {
  kind: InlineCardKind
  /** Stable id from the marker. For `by-id`, resolves to whichever block or
   *  item owns that id. For `diff`, must refer to a richtext block. */
  id: string
  /** Optional item filter when `id` points to a dropdown group — shows only
   *  the listed item ids. */
  itemIds?: string[]
  /** Optional lesson override — lets callers render a different lesson than the
   *  one in LessonContext (e.g. prompt-lab per-turn snapshots). Falls back to context. */
  lesson?: Lesson
  /** Lesson id this card was authored against. Resolved from `lessons` so the
   *  card stays pinned to the right lesson even when the user navigates away. */
  lessonId?: string
  /** Chat id — needed so the jump arrow opens the correct chat's panel. */
  chatId?: string
}

export function InlineCard({ kind, id, itemIds, lesson: lessonProp, lessonId, chatId }: Props) {
  const ctx = useLesson()
  const resolvedById = lessonId ? ctx.lessons.find((l) => l.id === lessonId) : undefined
  const lesson = lessonProp ?? resolvedById ?? ctx.lesson

  const buildJump = (field: string, overlay: LessonOverlay, opts?: { expandDropdowns?: boolean }) => {
    if (!chatId) return undefined
    return () =>
      ctx.actions.jumpToField({
        chatId,
        lessonId: lesson.id,
        field,
        overlay,
        expandDropdowns: opts?.expandDropdowns,
      })
  }

  if (kind === 'diff') {
    const block = findRichTextBlock(lesson, id)
    if (!block) return <Missing label={`diff ${id}`} />
    const edits = block.feedback?.edits ?? []
    if (edits.length === 0) {
      return (
        <CardShell label={`No proposed edits — ${block.label ?? 'section'}`} onJump={buildJump(block.id, 'feedback')}>
          <Collapsible>
            <RichTextViewer htmlContent={block.content} />
          </Collapsible>
        </CardShell>
      )
    }
    const inlineHtml = renderEditsInline(block.content, edits)
    return (
      <CardShell label={`Edit preview — ${block.label ?? block.id}`} onJump={buildJump(block.id, 'feedback')}>
        <Collapsible>
          <div style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(31, 30, 29, 0.12)', backgroundColor: 'white' }}>
            <RichTextViewer htmlContent={inlineHtml} />
          </div>
        </Collapsible>
      </CardShell>
    )
  }

  // kind === 'by-id' — resolve the id against blocks, items, or objectives.
  const objectiveHit = findObjectiveById(lesson, id)
  if (objectiveHit) {
    return (
      <ObjectiveCard
        index={objectiveHit.index}
        text={objectiveHit.text}
        onJump={buildJump('objectives', 'preview')}
      />
    )
  }

  const richTextBlock = findRichTextBlock(lesson, id)
  if (richTextBlock) {
    return <RichTextCard block={richTextBlock} onJump={buildJump(richTextBlock.id, 'preview')} />
  }

  const dropdownsBlock = findDropdownsBlock(lesson, id)
  if (dropdownsBlock) {
    return (
      <DropdownsBlockCard
        block={dropdownsBlock}
        itemIds={itemIds}
        onJump={buildJump(dropdownsBlock.id, 'preview', { expandDropdowns: true })}
      />
    )
  }

  const tabsBlock = findTabsBlock(lesson, id)
  if (tabsBlock) {
    return <TabsBlockCard block={tabsBlock} onJump={buildJump(tabsBlock.id, 'preview')} />
  }

  const videoBlock = findVideoBlock(lesson, id)
  if (videoBlock) {
    return <VideoBlockCard block={videoBlock} onJump={buildJump(videoBlock.id, 'preview')} />
  }

  const dropdownHit = findDropdownItem(lesson, id)
  if (dropdownHit) {
    return (
      <SingleDropdownCard
        dropdown={dropdownHit.item}
        onJump={buildJump(
          dropdownHit.item.id,
          dropdownHit.item.feedback?.edits?.length ? 'feedback' : 'preview',
          { expandDropdowns: true },
        )}
      />
    )
  }

  const tabHit = findTabItem(lesson, id)
  if (tabHit) {
    // A single tab renders the parent gallery with the same affordances as the full gallery.
    return <TabsBlockCard block={tabHit.block} onJump={buildJump(tabHit.item.id, 'preview')} />
  }

  return <Missing label={id} />
}

// ── Card subcomponents ──────────────────────────────────────────────────

function ObjectiveCard({
  index,
  text,
  onJump,
}: {
  index: number
  text: string
  onJump?: () => void
}) {
  return (
    <CardShell label={`Objective ${index + 1}`} onJump={onJump}>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgb(20, 20, 19)' }}>
        {text}
      </div>
    </CardShell>
  )
}

function RichTextCard({ block, onJump }: { block: RichTextBlock; onJump?: () => void }) {
  return (
    <CardShell label={block.label ?? block.id} onJump={onJump}>
      <Collapsible>
        <RichTextViewer htmlContent={block.content} />
      </Collapsible>
    </CardShell>
  )
}

function DropdownsBlockCard({
  block,
  itemIds,
  onJump,
}: {
  block: DropdownsBlock
  itemIds?: string[]
  onJump?: () => void
}) {
  const picked = itemIds && itemIds.length > 0
    ? block.items.filter((d) => itemIds.includes(d.id))
    : block.items
  if (picked.length === 0) return <Missing label={`${block.id} (no matching items)`} />
  const anyEdited = picked.some((d) => (d.feedback?.edits ?? []).length > 0)
  return (
    <CardShell label={anyEdited ? 'Edit preview — dropdowns' : 'Dropdowns'} onJump={onJump}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {picked.map((d) => (
          <DropdownInline key={d.id} dropdown={d} />
        ))}
      </div>
    </CardShell>
  )
}

function SingleDropdownCard({ dropdown, onJump }: { dropdown: LessonDropdown; onJump?: () => void }) {
  const hasEdits = (dropdown.feedback?.edits ?? []).length > 0
  return (
    <CardShell label={hasEdits ? 'Edit preview — dropdown' : 'Dropdown'} onJump={onJump}>
      <DropdownInline dropdown={dropdown} />
    </CardShell>
  )
}

function VideoBlockCard({ block, onJump }: { block: VideoBlock; onJump?: () => void }) {
  return (
    <CardShell label={block.label ?? 'Video'} onJump={onJump}>
      <div
        style={{
          position: 'relative',
          paddingTop: '56.25%',
          background: 'linear-gradient(180deg, rgb(41, 41, 38) 0%, rgb(31, 30, 29) 100%)',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid rgba(31, 30, 29, 0.2)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: 'rgba(255, 255, 255, 0.92)',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgb(31, 30, 29)',
              fontSize: 16,
            }}
          >
            ▶
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{block.title}</div>
            {block.duration && (
              <div style={{ fontSize: 10.5, color: 'rgba(255, 255, 255, 0.6)' }}>{block.duration}</div>
            )}
          </div>
        </div>
      </div>
      {block.script_note ? (
        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgb(115, 114, 108)', marginTop: 8 }}>
          <strong style={{ color: 'rgb(61, 61, 58)', fontWeight: 600 }}>Teaches:</strong>{' '}
          {block.script_note}
        </div>
      ) : (
        <div
          style={{
            fontSize: 11,
            fontStyle: 'italic',
            color: 'rgb(161, 98, 7)',
            marginTop: 8,
            padding: '4px 8px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px dashed rgba(161, 98, 7, 0.3)',
            borderRadius: 5,
          }}
        >
          No script note yet — the video lacks a documented teaching goal.
        </div>
      )}
    </CardShell>
  )
}

function TabsBlockCard({ block, onJump }: { block: TabsBlock; onJump?: () => void }) {
  const anyEdited = block.items.some((t) => (t.feedback?.edits ?? []).length > 0)
  return (
    <CardShell label={anyEdited ? 'Edit preview — tab gallery' : 'Tab gallery'} onJump={onJump}>
      <TabbedGallery
        tabs={block.items.map((t) => t.heading)}
        contents={block.items.map((t) => t.content)}
        tabEdits={block.items.map((t) => t.feedback?.edits)}
      />
    </CardShell>
  )
}

function DropdownInline({ dropdown }: { dropdown: LessonDropdown }) {
  const edits = dropdown.feedback?.edits ?? []
  if (edits.length > 0) {
    const headingHtml = renderEditsInline(dropdown.heading, edits)
    const contentHtml = renderEditsInline(dropdown.content, edits)
    return (
      <div style={{ border: '1px solid rgba(31, 30, 29, 0.12)', borderRadius: 8, overflow: 'hidden' }}>
        <ExpandableDropdown
          headingHtml={headingHtml}
          contentHtml={contentHtml}
          defaultExpanded
        />
      </div>
    )
  }
  return (
    <div style={{ border: '1px solid rgb(219, 212, 204)', borderRadius: 8, overflow: 'hidden' }}>
      <ExpandableDropdown heading={dropdown.heading} content={dropdown.content} />
    </div>
  )
}

// ── Shell + layout helpers (unchanged from before) ──────────────────────

function CardShell({
  label,
  children,
  onJump,
}: {
  label: string
  children: React.ReactNode
  onJump?: () => void
}) {
  return (
    <div style={{
      margin: '12px 0',
      padding: 14,
      borderRadius: 10,
      backgroundColor: 'rgba(31, 30, 29, 0.03)',
      border: '1px solid rgba(31, 30, 29, 0.08)',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, gap: 8,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
          color: 'rgb(115, 114, 108)',
        }}>
          {label}
        </div>
        {onJump && (
          <button
            type="button"
            onClick={onJump}
            title="Open in lesson"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: 4,
              height: 22, borderRadius: 6,
              padding: '0 8px',
              border: '1px solid rgba(31, 30, 29, 0.1)',
              background: 'transparent',
              color: 'rgb(115, 114, 108)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(217, 119, 87, 0.1)'
              e.currentTarget.style.color = 'rgb(217, 119, 87)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgb(115, 114, 108)'
            }}
          >
            View
            <ArrowUpRight size={12} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Collapsible({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setOverflowing(el.scrollHeight - el.clientHeight > 1)
  }, [children])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onResize = () => setOverflowing(el.scrollHeight - el.clientHeight > 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        style={{
          maxHeight: expanded ? 'none' : CARD_MAX_HEIGHT,
          overflow: 'hidden',
          maskImage: overflowing && !expanded
            ? 'linear-gradient(to bottom, rgb(0,0,0) calc(100% - 48px), transparent 100%)'
            : undefined,
          WebkitMaskImage: overflowing && !expanded
            ? 'linear-gradient(to bottom, rgb(0,0,0) calc(100% - 48px), transparent 100%)'
            : undefined,
        }}
      >
        {children}
      </div>
      {overflowing && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '4px 12px',
              border: '1px solid rgba(31,30,29,0.12)',
              borderRadius: 999,
              background: 'white',
              cursor: 'pointer',
              color: 'rgb(61,61,58)',
            }}
          >
            {expanded ? 'Show less' : 'Show all'}
          </button>
        </div>
      )}
    </div>
  )
}

function Missing({ label }: { label: string }) {
  return (
    <div style={{
      margin: '12px 0',
      padding: '10px 14px',
      borderRadius: 8,
      border: '1px dashed rgba(31, 30, 29, 0.2)',
      fontSize: 11,
      color: 'rgb(115, 114, 108)',
      fontStyle: 'italic',
    }}>
      Artifact unavailable ({label})
    </div>
  )
}
