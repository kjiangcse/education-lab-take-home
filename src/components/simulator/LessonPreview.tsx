'use client'

import { useState, useEffect, useRef, type ComponentProps } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Layers, PenLine, BookOpen, ChevronRight, FileText, Search, Undo2, Check, Play, X } from 'lucide-react'
import type { BloomLevel } from '@/lib/types/blooms'
import type { Lesson, LessonBlock, SectionFeedback } from '@/lib/types/lesson'
import { useLesson } from '@/lib/lesson-context'
import { renderEditsInline } from '@/lib/format-edits'
import { CourseView } from './CourseView'
import { LandingSection } from './landing-section'
import { RichTextViewer } from './richtext'
import { ExpandableDropdown } from './expandable-dropdown'
import { TabbedGallery } from './tabbed-gallery'

// Minimal markdown override for feedback-block prose. Scoped tighter than the
// chat-side markdown (feedback sits inside a smaller container + has its own
// type scale), so we don't reuse AssistantBody's components directly.
const feedbackMarkdownComponents = {
  p: ({ children, ...props }: ComponentProps<'p'>) => (
    <p style={{ margin: '0 0 6px', lineHeight: 1.6 }} {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: ComponentProps<'strong'>) => (
    <strong style={{ fontWeight: 600 }} {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: ComponentProps<'em'>) => (
    <em style={{ fontStyle: 'italic' }} {...props}>{children}</em>
  ),
  code: ({ children, ...props }: ComponentProps<'code'>) => (
    <code style={{
      backgroundColor: 'rgba(31, 30, 29, 0.06)',
      padding: '1px 4px',
      borderRadius: 3,
      fontSize: '0.9em',
      fontFamily: 'var(--font-geist-mono), monospace',
    }} {...props}>{children}</code>
  ),
}

// Bloom's levels with colors
const BLOOMS_COLORS: Record<BloomLevel, { bg: string; border: string; text: string; badge: string; label: string }> = {
  remember:    { bg: 'rgba(239, 68, 68, 0.04)',  border: 'rgba(239, 68, 68, 0.2)',  text: 'rgb(185, 28, 28)',  badge: 'rgb(220, 80, 80)',  label: 'Remember' },
  understand:  { bg: 'rgba(249, 115, 22, 0.04)', border: 'rgba(249, 115, 22, 0.2)', text: 'rgb(194, 65, 12)', badge: 'rgb(220, 120, 50)', label: 'Understand' },
  apply:       { bg: 'rgba(234, 179, 8, 0.04)',  border: 'rgba(234, 179, 8, 0.2)',  text: 'rgb(161, 98, 7)',  badge: 'rgb(190, 150, 30)', label: 'Apply' },
  analyze:     { bg: 'rgba(34, 197, 94, 0.04)',  border: 'rgba(34, 197, 94, 0.2)',  text: 'rgb(21, 128, 61)', badge: 'rgb(40, 160, 80)',  label: 'Analyze' },
  evaluate:    { bg: 'rgba(59, 130, 246, 0.04)', border: 'rgba(59, 130, 246, 0.2)', text: 'rgb(29, 78, 216)', badge: 'rgb(60, 120, 220)', label: 'Evaluate' },
  create:      { bg: 'rgba(139, 92, 246, 0.04)', border: 'rgba(139, 92, 246, 0.2)', text: 'rgb(109, 40, 217)', badge: 'rgb(120, 80, 220)', label: 'Create' },
}

type LessonPreviewProps = ComponentProps<'aside'> & {
  lesson: Lesson
  chatId: string
}

export function LessonPreview({ lesson, chatId, style, ...props }: LessonPreviewProps) {
  const { course, lessons, lessonIndex, view, overlayByChat, panelOpenByChat, canUndo, actions } = useLesson()
  const panelOpen = panelOpenByChat[chatId] ?? false
  const overlay = overlayByChat[chatId] ?? 'preview'
  // Alias for the existing render logic below: when panel is closed we behave
  // the same as the previous "collapsed" mode (no inner chrome rendered), but
  // the container itself animates to width 0 + opacity 0.
  const collapsed = !panelOpen
  const [showCourseDropdown, setShowCourseDropdown] = useState(false)
  const [showLessonDropdown, setShowLessonDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const showBlooms = overlay === 'blooms'
  const showFeedback = overlay === 'feedback'
  const hasContent = lesson.name || lesson.blocks.length > 0

  /** Replace every occurrence of each edit's `original` with its `replacement`.
   *  Case-insensitive first match, same discipline as the richtext path. */
  const applyEditsToString = (source: string, edits: SectionFeedback['edits']): string => {
    let out = source
    for (const edit of edits) {
      const escaped = edit.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      out = out.replace(new RegExp(escaped, 'i'), edit.replacement)
    }
    return out
  }

  const applyFeedback = (id: string) => {
    // Richtext block path.
    const rtBlock = lesson.blocks.find(
      (b): b is Extract<LessonBlock, { kind: 'richtext' }> =>
        b.kind === 'richtext' && b.id === id,
    )
    if (rtBlock && rtBlock.feedback) {
      const newContent = applyEditsToString(rtBlock.content, rtBlock.feedback.edits)
      const nextBloomsLevel = rtBlock.feedback.blooms_level_after ?? rtBlock.blooms_level
      const newBlocks = lesson.blocks.map((b) =>
        b.kind === 'richtext' && b.id === id
          ? { ...b, content: newContent, blooms_level: nextBloomsLevel, feedback: undefined }
          : b,
      )
      const label = rtBlock.label ? `Apply feedback on "${rtBlock.label}"` : 'Apply feedback'
      actions.updateLesson(lesson.id, { blocks: newBlocks }, label)
      return
    }

    // Dropdown item path — search across every dropdowns block for the item id.
    for (const block of lesson.blocks) {
      if (block.kind !== 'dropdowns') continue
      const item = block.items.find((d) => d.id === id)
      if (!item || !item.feedback) continue
      const edits = item.feedback.edits
      const newHeading = applyEditsToString(item.heading, edits)
      const newContent = applyEditsToString(item.content, edits)
      const nextBloomsLevel = item.feedback.blooms_level_after ?? item.blooms_level
      const newBlocks = lesson.blocks.map((b) => {
        if (b.kind !== 'dropdowns') return b
        return {
          ...b,
          items: b.items.map((it) =>
            it.id === id
              ? { ...it, heading: newHeading, content: newContent, blooms_level: nextBloomsLevel, feedback: undefined }
              : it,
          ),
        }
      })
      actions.updateLesson(lesson.id, { blocks: newBlocks }, `Apply feedback on "${item.heading}"`)
      return
    }

    // Tab item path.
    for (const block of lesson.blocks) {
      if (block.kind !== 'tabs') continue
      const item = block.items.find((t) => t.id === id)
      if (!item || !item.feedback) continue
      const edits = item.feedback.edits
      const newHeading = applyEditsToString(item.heading, edits)
      const newContent = applyEditsToString(item.content, edits)
      const nextBloomsLevel = item.feedback.blooms_level_after ?? item.blooms_level
      const newBlocks = lesson.blocks.map((b) => {
        if (b.kind !== 'tabs') return b
        return {
          ...b,
          items: b.items.map((it) =>
            it.id === id
              ? { ...it, heading: newHeading, content: newContent, blooms_level: nextBloomsLevel, feedback: undefined }
              : it,
          ),
        }
      })
      actions.updateLesson(lesson.id, { blocks: newBlocks }, `Apply feedback on "${item.heading}"`)
      return
    }
  }

  const dismissFeedback = (id: string) => {
    // Richtext block path.
    const rtBlock = lesson.blocks.find(
      (b): b is Extract<LessonBlock, { kind: 'richtext' }> =>
        b.kind === 'richtext' && b.id === id,
    )
    if (rtBlock && rtBlock.feedback) {
      const newBlocks = lesson.blocks.map((b) =>
        b.kind === 'richtext' && b.id === id ? { ...b, feedback: undefined } : b,
      )
      const label = rtBlock.label ? `Dismiss feedback on "${rtBlock.label}"` : 'Dismiss feedback'
      actions.updateLesson(lesson.id, { blocks: newBlocks }, label)
      return
    }

    // Dropdown item path.
    for (const block of lesson.blocks) {
      if (block.kind !== 'dropdowns') continue
      const item = block.items.find((d) => d.id === id)
      if (!item || !item.feedback) continue
      const newBlocks = lesson.blocks.map((b) => {
        if (b.kind !== 'dropdowns') return b
        return {
          ...b,
          items: b.items.map((it) =>
            it.id === id ? { ...it, feedback: undefined } : it,
          ),
        }
      })
      actions.updateLesson(lesson.id, { blocks: newBlocks }, `Dismiss feedback on "${item.heading}"`)
      return
    }

    // Tab item path.
    for (const block of lesson.blocks) {
      if (block.kind !== 'tabs') continue
      const item = block.items.find((t) => t.id === id)
      if (!item || !item.feedback) continue
      const newBlocks = lesson.blocks.map((b) => {
        if (b.kind !== 'tabs') return b
        return {
          ...b,
          items: b.items.map((it) =>
            it.id === id ? { ...it, feedback: undefined } : it,
          ),
        }
      })
      actions.updateLesson(lesson.id, { blocks: newBlocks }, `Dismiss feedback on "${item.heading}"`)
      return
    }
  }

  return (
    <aside
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        backgroundColor: '#f7f6f2',
        borderLeft: panelOpen ? '1px solid rgba(31, 30, 29, 0.1)' : 'none',
        overflow: 'hidden',
        width: panelOpen ? '50%' : 0,
        maxWidth: panelOpen ? 720 : 0,
        minWidth: panelOpen ? 280 : 0,
        opacity: panelOpen ? 1 : 0,
        pointerEvents: panelOpen ? 'auto' : 'none',
        transition:
          'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease 0.18s',
        ...style,
      }}
      {...props}
    >
      {/* Header */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 16px', borderBottom: '1px solid rgba(31, 30, 29, 0.08)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8, flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, position: 'relative' }}>
            {/* Course dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => { setShowCourseDropdown(!showCourseDropdown); setShowLessonDropdown(false); setSearchQuery('') }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, height: 28,
                  fontSize: 13, fontWeight: view === 'course' ? 600 : 500,
                  color: view === 'course' ? 'rgb(20, 20, 19)' : 'rgb(115, 114, 108)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                  lineHeight: 1, borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(31, 30, 29, 0.04)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
              >
                <BookOpen size={13} style={{ color: 'rgb(217, 119, 87)', flexShrink: 0 }} />
                <span>Course</span>
              </button>
              {showCourseDropdown && (
                <NavDropdown
                  items={[{ id: 'course', label: course.name, icon: BookOpen }]}
                  searchQuery={searchQuery}
                  onSearch={setSearchQuery}
                  onSelect={() => { actions.navigateToCourse(); setShowCourseDropdown(false) }}
                  onClose={() => setShowCourseDropdown(false)}
                  placeholder="Search courses..."
                />
              )}
            </div>

            <ChevronRight size={11} style={{ color: 'rgb(200, 199, 195)', flexShrink: 0 }} />
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => { setShowLessonDropdown(!showLessonDropdown); setShowCourseDropdown(false); setSearchQuery('') }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, height: 28,
                  fontSize: 13, fontWeight: view === 'lesson' ? 600 : 500,
                  color: view === 'lesson' ? 'rgb(20, 20, 19)' : 'rgb(115, 114, 108)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
                  lineHeight: 1, borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(31, 30, 29, 0.04)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
              >
                <FileText size={12} style={{ color: 'rgb(115, 114, 108)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180, lineHeight: '28px' }}>
                  {view === 'course' ? 'Select lesson...' : (() => { const t = lessons[lessonIndex]?.name || ''; return t.length > 24 ? t.slice(0, 24) + '...' : t })()}
                </span>
              </button>
              {showLessonDropdown && (
                <NavDropdown
                  items={lessons.map((l, i) => ({ id: l.id, label: `${i + 1}. ${l.name}`, icon: FileText }))}
                  searchQuery={searchQuery}
                  onSearch={setSearchQuery}
                  onSelect={(id) => { actions.navigateToLesson(id); setShowLessonDropdown(false) }}
                  onClose={() => setShowLessonDropdown(false)}
                  placeholder="Search lessons..."
                  activeId={lessons[lessonIndex]?.id}
                />
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {!collapsed && (
            <button
              type="button"
              onClick={actions.undo}
              disabled={!canUndo}
              title={canUndo ? 'Undo last edit' : 'Nothing to undo'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6, border: 'none',
                background: 'transparent',
                cursor: canUndo ? 'pointer' : 'default',
                color: canUndo ? 'rgb(61, 61, 58)' : 'rgb(200, 199, 195)',
                flexShrink: 0,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.background = 'rgba(115, 114, 108, 0.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <Undo2 size={13} />
            </button>
          )}
          {!collapsed && (
            <div style={{
              display: 'flex', borderRadius: 7, padding: 2,
              border: '1px solid rgba(31, 30, 29, 0.12)', background: 'rgba(31, 30, 29, 0.03)',
            }}>
              {([
                { id: 'preview' as const, label: 'Preview', icon: Eye },
                { id: 'feedback' as const, label: 'Feedback', icon: PenLine },
                { id: 'blooms' as const, label: "Bloom's", icon: Layers },
              ]).map((item) => {
                const Icon = item.icon
                const active = overlay === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => actions.setOverlay(chatId, item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      height: 24, padding: '0 10px', borderRadius: 5, fontSize: 10, fontWeight: active ? 600 : 500,
                      border: 'none',
                      background: active ? 'white' : 'transparent',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      color: active ? 'rgb(20, 20, 19)' : 'rgb(115, 114, 108)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={11} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => actions.closePanel(chatId)}
            title="Close panel"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgb(61, 61, 58)', flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(115, 114, 108, 0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Bloom's legend — only in lesson view */}
      {!collapsed && view === 'lesson' && (
        <div style={{
          maxHeight: showBlooms ? 40 : 0,
          opacity: showBlooms ? 1 : 0,
          overflow: 'hidden',
          padding: showBlooms ? '8px 16px' : '0 16px',
          borderBottom: showBlooms ? '1px solid rgba(31, 30, 29, 0.06)' : 'none',
          display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0,
          transition: 'max-height 0.5s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s ease, padding 0.5s cubic-bezier(0.25, 0.1, 0.25, 1), border-color 0.3s ease',
        }}>
          {Object.entries(BLOOMS_COLORS).map(([key, c], i, arr) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 500, color: c.text }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.border }} />
                {c.label}
              </div>
              {i < arr.length - 1 && (
                <span style={{ fontSize: 10, color: 'rgba(31, 30, 29, 0.2)', marginLeft: 4 }}>→</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {!collapsed && view === 'course' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <CourseView course={course} lessons={lessons} />
        </div>
      )}

      {!collapsed && view === 'lesson' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {hasContent ? (
            <div>
              {lesson.name && <LandingSection title={lesson.name} paragraph={lesson.short_description} />}
              <div style={{ padding: '20px 24px 60px' }}>
                {lesson.objectives.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <ObjectivesList objectives={lesson.objectives} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {lesson.blocks.map((block) => (
                    <BlockRenderer
                      key={block.id}
                      block={block}
                      showBlooms={showBlooms}
                      showFeedback={showFeedback}
                      onApplyFeedback={applyFeedback}
                      onDismissFeedback={dismissFeedback}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px' }}>
              <p style={{ fontSize: 13, color: 'rgb(115, 114, 108)', textAlign: 'center', lineHeight: 1.6 }}>
                Your lesson preview will appear here as you build it with Claude.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        .sim-rich-text { font-size: 13px; line-height: 1.6; color: rgb(0, 0, 0); }
        .sim-rich-text h2 { font-size: 18px; font-weight: 600; margin: 12px 0 6px; color: rgb(20, 20, 19); }
        .sim-rich-text h3 { font-size: 15px; font-weight: 600; margin: 10px 0 4px; color: rgb(20, 20, 19); }
        .sim-rich-text h4 { font-size: 14px; font-weight: 600; margin: 8px 0 4px; color: rgb(20, 20, 19); }
        .sim-rich-text p { margin: 0 0 8px; }
        .sim-rich-text ul { list-style: disc; padding-left: 20px; margin: 4px 0 8px; }
        .sim-rich-text ol { list-style: decimal; padding-left: 20px; margin: 4px 0 8px; }
        .sim-rich-text li { margin-bottom: 2px; }
        .sim-rich-text strong { font-weight: 600; }
        .sim-rich-text em { font-style: italic; }
        .sim-rich-text code { background: rgba(31, 30, 29, 0.06); padding: 1px 4px; border-radius: 3px; font-size: 0.9em; font-family: var(--font-geist-mono), monospace; }
        .sim-rich-text blockquote { border-left: 3px solid rgb(219, 212, 204); padding-left: 12px; margin: 8px 0; color: rgb(115, 114, 108); font-style: italic; }
        /* Kill trailing bottom margin so the highlight ring (inset -14px) has
           symmetric top/bottom gap around the content — otherwise a final
           paragraph's 8px margin-bottom stacks under the ring offset. */
        .sim-rich-text > *:last-child { margin-bottom: 0; }
        @keyframes bloomFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bloomWrapperIn {
          from { opacity: 0; background-color: transparent; border-color: transparent; }
          to { opacity: 1; }
        }
        @keyframes bloomBadgeIn {
          from { opacity: 0; transform: translateY(3px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Jump-target highlight. Lives on a ::after pseudo-element offset
           14px outside the section bounds so the ring + tint grow outward
           without nudging the section's own layout. isolation + z-index:-1
           keep the tint behind the content so text stays crisp. */
        .field-flash {
          position: relative;
          isolation: isolate;
        }
        .field-flash::after {
          content: '';
          position: absolute;
          inset: -14px;
          border-radius: 18px;
          pointer-events: none;
          z-index: -1;
          animation: fieldFlash 1.4s ease;
        }
        @keyframes fieldFlash {
          0%   { box-shadow: 0 0 0 0 rgba(217, 119, 87, 0); background-color: transparent; }
          15%  { box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.5); background-color: rgba(217, 119, 87, 0.07); }
          100% { box-shadow: 0 0 0 0 rgba(217, 119, 87, 0); background-color: transparent; }
        }
      `}</style>
    </aside>
  )
}

// --- Block renderer: dispatches on kind to the right component ---

function BlockRenderer({
  block,
  showBlooms,
  showFeedback,
  onApplyFeedback,
  onDismissFeedback,
}: {
  block: LessonBlock
  showBlooms: boolean
  showFeedback: boolean
  onApplyFeedback: (blockId: string) => void
  onDismissFeedback: (blockId: string) => void
}) {
  if (block.kind === 'richtext') {
    return (
      <div
        data-field={block.id}
        style={{ borderRadius: 10, transition: 'box-shadow 0.6s ease, background-color 0.6s ease' }}
      >
        <BloomsWrapper level={block.blooms_level} note={block.blooms_note} show={showBlooms}>
          <RichTextViewer
            htmlContent={
              showFeedback && block.feedback
                ? renderEditsInline(block.content, block.feedback.edits)
                : block.content
            }
            label={block.label}
          />
          <FeedbackBlock
            feedback={block.feedback}
            show={showFeedback}
            onApply={() => onApplyFeedback(block.id)}
            onDismiss={() => onDismissFeedback(block.id)}
          />
        </BloomsWrapper>
      </div>
    )
  }

  if (block.kind === 'tabs') {
    return (
      <div
        data-field={block.id}
        style={{ borderRadius: 10, transition: 'box-shadow 0.6s ease, background-color 0.6s ease' }}
      >
        <BloomsWrapper level={block.items[0]?.blooms_level} show={showBlooms}>
          <TabbedGallery
            tabs={block.items.map((t) => t.heading)}
            contents={block.items.map((t) => t.content)}
            tabEdits={showFeedback ? block.items.map((t) => t.feedback?.edits) : undefined}
          />
        </BloomsWrapper>
      </div>
    )
  }

  if (block.kind === 'video') {
    return (
      <div
        data-field={block.id}
        style={{ borderRadius: 10, transition: 'box-shadow 0.6s ease, background-color 0.6s ease' }}
      >
        <BloomsWrapper level={block.blooms_level} note={block.blooms_note} show={showBlooms}>
          <VideoPlaceholder
            title={block.title}
            duration={block.duration}
            scriptNote={block.script_note}
            label={block.label}
          />
        </BloomsWrapper>
      </div>
    )
  }

  if (block.kind === 'dropdowns') {
    return (
      <div
        data-field={block.id}
        style={{ borderRadius: 10, transition: 'box-shadow 0.6s ease, background-color 0.6s ease' }}
      >
        <BloomsWrapper
          level={block.items[0]?.blooms_level}
          note={block.items[0]?.blooms_note}
          show={showBlooms}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {block.items.map((d) => {
              const edits = d.feedback?.edits ?? []
              const showEdits = showFeedback && edits.length > 0
              return (
                <div key={d.id} data-field={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div
                    style={{
                      border: '1px solid rgb(219, 212, 204)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      transition: 'box-shadow 0.6s ease',
                    }}
                  >
                    {showEdits ? (
                      <ExpandableDropdown
                        headingHtml={renderEditsInline(d.heading, edits)}
                        contentHtml={renderEditsInline(d.content, edits)}
                        defaultExpanded
                      />
                    ) : (
                      <ExpandableDropdown heading={d.heading} content={d.content} />
                    )}
                  </div>
                  <FeedbackBlock
                    feedback={d.feedback}
                    show={showFeedback}
                    onApply={() => onApplyFeedback(d.id)}
                    onDismiss={() => onDismissFeedback(d.id)}
                  />
                </div>
              )
            })}
          </div>
        </BloomsWrapper>
      </div>
    )
  }

  return null
}

// --- Video placeholder (design-only; no real playback yet) ---

function VideoPlaceholder({
  title,
  duration,
  scriptNote,
  label,
}: {
  title: string
  duration?: string
  scriptNote?: string
  label?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {label && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'rgb(115, 114, 108)',
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          paddingTop: '56.25%',
          background: 'linear-gradient(180deg, rgb(41, 41, 38) 0%, rgb(31, 30, 29) 100%)',
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(31, 30, 29, 0.15)',
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
            gap: 12,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <Play size={22} style={{ color: 'rgb(31, 30, 29)', marginLeft: 3 }} fill="rgb(31, 30, 29)" />
          </div>
          <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.92)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{title}</div>
            {duration && (
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)' }}>{duration}</div>
            )}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: 'rgba(255, 255, 255, 0.55)',
          }}
        >
          Video placeholder
        </div>
      </div>
      {scriptNote ? (
        <div style={{ fontSize: 12, lineHeight: 1.55, color: 'rgb(115, 114, 108)' }}>
          <strong style={{ color: 'rgb(61, 61, 58)', fontWeight: 600 }}>Teaches:</strong>{' '}
          {scriptNote}
        </div>
      ) : (
        <div
          style={{
            fontSize: 11,
            fontStyle: 'italic',
            color: 'rgb(170, 169, 165)',
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px dashed rgba(161, 98, 7, 0.3)',
          }}
        >
          No script note yet. Document what this video will teach before recording.
        </div>
      )}
    </div>
  )
}

// --- Learning Objectives list (renders structured objectives) ---

function ObjectivesList({ objectives }: { objectives: string[] }) {
  return (
    <div className="sim-rich-text">
      <h2>Learning Objectives</h2>
      <ul>
        {objectives.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
    </div>
  )
}

// --- Bloom's overlay wrapper ---

function BloomsWrapper({
  level,
  note,
  show,
  children,
}: {
  level?: BloomLevel
  note?: string
  show: boolean
  children: React.ReactNode
}) {
  const [visible, setVisible] = useState(show)
  const [colored, setColored] = useState(show)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(timeoutRef.current)

    if (show) {
      setVisible(true)
      setColored(true)
    } else {
      setColored(false)
      timeoutRef.current = setTimeout(() => {
        setVisible(false)
      }, 500)
    }

    return () => clearTimeout(timeoutRef.current)
  }, [show])

  if (!level) return <>{children}</>

  const colors = BLOOMS_COLORS[level]

  return (
    <div style={{
      position: 'relative',
      borderLeft: `3px solid ${colored ? colors.border : 'transparent'}`,
      borderRadius: '0 10px 10px 0',
      backgroundColor: colored ? colors.bg : 'transparent',
      padding: visible ? '16px 20px' : '0',
      transition: 'padding 0.5s cubic-bezier(0.25, 0.1, 0.25, 1), background-color 0.4s ease, border-color 0.4s ease',
    }}>
      {/* Badge — absolute overlay */}
      <div style={{
        position: 'absolute',
        top: 6,
        right: 6,
        zIndex: 2,
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 10px', borderRadius: 5,
        backgroundColor: colors.badge,
        border: `1.5px solid ${colors.badge}`,
        fontSize: 9, fontWeight: 600,
        color: 'white', textTransform: 'uppercase', letterSpacing: '0.3px',
        opacity: colored ? 0.85 : 0,
        transform: colored ? 'translateY(0) scale(1)' : 'translateY(3px) scale(0.95)',
        transition: 'opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s',
      }}>
        {colors.label}
      </div>

      {children}

      {note && visible && (
        <div style={{
          marginTop: 10, padding: '5px 0',
          fontSize: 10, lineHeight: 1.5, color: colors.text, fontStyle: 'italic',
          opacity: colored ? 1 : 0,
          transition: 'opacity 0.4s ease 0.25s',
        }}>
          {note}
        </div>
      )}
    </div>
  )
}

// --- Feedback helpers ---

function FeedbackBlock({
  feedback,
  show,
  onApply,
  onDismiss,
}: {
  feedback?: SectionFeedback
  show: boolean
  onApply?: () => void
  onDismiss?: () => void
}) {
  if (!feedback || !show) return null

  return (
    <div style={{
      marginTop: 12,
      padding: '14px 18px',
      borderRadius: 8,
      backgroundColor: 'rgba(31, 30, 29, 0.03)',
      borderLeft: '3px solid rgba(31, 30, 29, 0.12)',
      opacity: 0,
      animation: 'bloomFadeIn 0.4s ease both',
      animationDelay: '0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'rgb(115, 114, 108)' }}>
          Feedback
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {onApply && (
            <FeedbackActionButton
              icon={Check}
              label="Apply"
              restColor="rgba(21, 128, 61, 0.6)"
              hoverBg="rgba(34, 197, 94, 0.12)"
              hoverBorder="rgb(21, 128, 61)"
              hoverColor="rgb(21, 128, 61)"
              onClick={onApply}
            />
          )}
          {onDismiss && (
            <FeedbackActionButton
              icon={X}
              label="Dismiss"
              restColor="rgba(115, 114, 108, 0.6)"
              hoverBg="rgba(239, 68, 68, 0.10)"
              hoverBorder="rgb(185, 28, 28)"
              hoverColor="rgb(185, 28, 28)"
              onClick={onDismiss}
            />
          )}
        </div>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgb(41, 41, 38)' }}>
        <Markdown remarkPlugins={[remarkGfm]} components={feedbackMarkdownComponents}>{feedback.explanation}</Markdown>
      </div>
      {feedback.edits.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {feedback.edits.map((edit, i) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.5, color: 'rgb(61, 61, 58)', display: 'flex', gap: 6 }}>
              <span style={{ fontWeight: 600, color: 'rgb(61, 61, 58)', flexShrink: 0 }}>Edit {i + 1}:</span>
              <span style={{ flex: 1 }}>
                <Markdown remarkPlugins={[remarkGfm]} components={feedbackMarkdownComponents}>{edit.reason}</Markdown>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FeedbackActionButton({
  icon: Icon,
  label,
  restColor,
  hoverBg,
  hoverBorder,
  hoverColor,
  onClick,
}: {
  icon: typeof Check
  label: string
  restColor: string
  hoverBg: string
  hoverBorder: string
  hoverColor: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        height: 24, padding: '0 10px', borderRadius: 6,
        border: `1px solid ${restColor}`,
        background: 'transparent', color: restColor,
        fontSize: 11, fontWeight: 600, lineHeight: 1,
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg
        e.currentTarget.style.borderColor = hoverBorder
        e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = restColor
        e.currentTarget.style.color = restColor
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}

// --- Navigation Dropdown ---

function NavDropdown({
  items,
  searchQuery,
  onSearch,
  onSelect,
  onClose,
  placeholder,
  activeId,
}: {
  items: { id: string; label: string; icon: typeof BookOpen }[]
  searchQuery: string
  onSearch: (q: string) => void
  onSelect: (id: string) => void
  onClose: () => void
  placeholder: string
  activeId?: string
}) {
  const filtered = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
      />
      {/* Dropdown */}
      <div style={{
        position: 'absolute', top: '100%', left: 0, marginTop: 4,
        zIndex: 50, width: 280,
        backgroundColor: 'white', borderRadius: 10,
        border: '1px solid rgba(31, 30, 29, 0.12)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(31, 30, 29, 0.1)',
        overflow: 'hidden',
      }}>
        {/* Search */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(31, 30, 29, 0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Search size={13} style={{ color: 'rgb(170, 169, 165)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            autoFocus
            style={{
              width: '100%', border: 'none', outline: 'none', fontSize: 12,
              color: 'rgb(20, 20, 19)', background: 'transparent',
            }}
          />
        </div>
        {/* Items */}
        <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 10px', fontSize: 12, color: 'rgb(170, 169, 165)', textAlign: 'center' }}>
              No results
            </div>
          ) : (
            filtered.map(item => {
              const Icon = item.icon
              const isActive = item.id === activeId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 10px', borderRadius: 6,
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'rgb(217, 119, 87)' : 'rgb(20, 20, 19)',
                    background: isActive ? 'rgba(217, 119, 87, 0.06)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(31, 30, 29, 0.04)' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon size={13} style={{ color: 'rgb(115, 114, 108)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
