'use client'

import { useState } from 'react'
import { StepIllustration } from './step-illustrations'
import { EDIT_GREEN, renderEditsInline } from '@/lib/format-edits'
import type { TextEdit } from '@/lib/types/lesson'

interface TabbedGalleryProps {
  tabs: string[]
  contents: string[]
  /** Parallel array of per-tab edits. Entry may be undefined or empty if that tab has no changes. */
  tabEdits?: (TextEdit[] | undefined)[]
}

export function TabbedGallery({ tabs = [], contents = [], tabEdits }: TabbedGalleryProps) {
  const [activeTab, setActiveTab] = useState(0)

  const validTabs = tabs.filter(t => t.trim())
  if (validTabs.length === 0) return null

  const editsFor = (i: number): TextEdit[] => tabEdits?.[i] ?? []
  const titleEditFor = (heading: string, edits: TextEdit[]): TextEdit | undefined =>
    edits.find((e) => e.original.trim().toLowerCase() === heading.trim().toLowerCase())

  return (
    <div style={{ border: '1px solid rgb(219, 212, 204)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex' }}>
        {validTabs.map((tab, i) => {
          const edits = editsFor(i)
          const hasEdits = edits.length > 0
          const titleEdit = titleEditFor(tab, edits)
          const bodyEditCount = edits.length - (titleEdit ? 1 : 0)
          const isActive = activeTab === i
          const notLast = i < validTabs.length - 1
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              type="button"
              style={{
                position: 'relative',
                flex: 1,
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'rgb(20, 20, 19)' : 'rgb(115, 114, 108)',
                backgroundColor: isActive ? 'rgb(199, 193, 186)' : 'rgb(232, 228, 224)',
                borderBottom: isActive ? 'none' : '1px solid rgb(199, 193, 186)',
                borderRight: notLast ? '1px solid rgba(31, 30, 29, 0.08)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                minHeight: 44,
              }}
            >
              {/* Bottom accent bar — single "this tab has changes" signal, regardless of where the edit lives */}
              {hasEdits && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 6,
                    right: 6,
                    bottom: 3,
                    height: 2,
                    borderRadius: 2,
                    backgroundColor: EDIT_GREEN,
                    opacity: isActive ? 0.9 : 0.7,
                  }}
                />
              )}
              {/* Edit-count chip — answers "how much is in there" for body-only edits,
                  since title-only edits already show their diff in the label below */}
              {bodyEditCount > 0 && (
                <span
                  title={`${bodyEditCount} content edit${bodyEditCount === 1 ? '' : 's'}`}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    fontSize: 9,
                    fontWeight: 600,
                    lineHeight: 1,
                    color: EDIT_GREEN,
                    backgroundColor: 'rgba(19, 115, 82, 0.12)',
                    padding: '2px 5px',
                    borderRadius: 999,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {bodyEditCount}
                </span>
              )}
              {titleEdit ? (
                <>
                  <span style={{ fontSize: 10, textDecoration: 'line-through', color: EDIT_GREEN, opacity: 0.55, lineHeight: 1.2 }}>
                    {titleEdit.original}
                  </span>
                  <span style={{ color: EDIT_GREEN, fontWeight: 500, lineHeight: 1.2 }}>
                    {titleEdit.replacement}
                  </span>
                </>
              ) : (
                <span style={{ lineHeight: 1.2 }}>{tab}</span>
              )}
            </button>
          )
        })}
      </div>
      <div style={{
        backgroundColor: 'rgb(251, 251, 250)',
        padding: 20,
        display: 'grid',
        gridTemplateColumns: '1fr 45%',
        columnGap: 18,
        alignItems: 'start',
      }}>
        <div style={{ minWidth: 0 }}>
          <div
            className="sim-rich-text"
            dangerouslySetInnerHTML={{
              __html: renderEditsInline(contents[activeTab] || '', editsFor(activeTab)),
            }}
          />
        </div>
        <div style={{ width: '100%' }}>
          <StepIllustration heading={validTabs[activeTab]} />
        </div>
      </div>
    </div>
  )
}
