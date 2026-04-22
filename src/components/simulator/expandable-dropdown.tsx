'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableDropdownProps {
  heading?: string
  content?: string
  /** When set, heading renders as HTML (so inline edit spans can be embedded). Takes precedence over `heading`. */
  headingHtml?: string
  /** When set, content renders as this HTML (so inline edit spans can be embedded). Takes precedence over `content`. */
  contentHtml?: string
  /** Start expanded. Useful when the dropdown contains proposed edits that should be visible without a click. */
  defaultExpanded?: boolean
  /** Force the dropdown open regardless of click state. Used in feedback
   *  mode so a dropdown with proposed edits can't be collapsed while the
   *  Apply / Dismiss controls sit inside its body. Hides the chevron. */
  forceExpanded?: boolean
  /** Optional node rendered below the content when expanded — e.g. the
   *  FeedbackBlock with Apply / Dismiss, so those controls live inside the
   *  dropdown instead of outside it. */
  footer?: ReactNode
  /** Override the heading text color (parent wrappers can force black for high-contrast diff rendering). */
  headingColor?: string
}

export function ExpandableDropdown({
  heading = '',
  content = '',
  headingHtml,
  contentHtml,
  defaultExpanded = false,
  forceExpanded = false,
  footer,
  headingColor = 'rgb(0, 0, 0)',
}: ExpandableDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const effectiveExpanded = forceExpanded || isExpanded

  const resolvedHeading = headingHtml ?? heading
  const resolvedContent = contentHtml ?? content

  if (!resolvedHeading?.trim() && !resolvedContent?.trim()) return null

  return (
    <div style={{ background: 'white', overflow: 'hidden' }}>
      <div
        data-dropdown-header="true"
        aria-expanded={effectiveExpanded}
        role="button"
        tabIndex={forceExpanded ? -1 : 0}
        onClick={forceExpanded ? undefined : () => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          cursor: forceExpanded ? 'default' : 'pointer',
        }}
      >
        {headingHtml ? (
          <span
            style={{ fontSize: 13, fontWeight: 500, color: headingColor }}
            dangerouslySetInnerHTML={{ __html: headingHtml }}
          />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 500, color: headingColor }}>{heading}</span>
        )}
        {!forceExpanded && (
          effectiveExpanded
            ? <ChevronUp size={14} style={{ color: 'rgb(115, 114, 108)' }} />
            : <ChevronDown size={14} style={{ color: 'rgb(115, 114, 108)' }} />
        )}
      </div>
      {effectiveExpanded && (resolvedContent || footer) && (
        <div style={{ padding: '0 16px 12px', borderTop: '1px solid rgb(240, 238, 234)' }}>
          {resolvedContent && (
            <div className="sim-rich-text" style={{ paddingTop: 12 }} dangerouslySetInnerHTML={{ __html: resolvedContent }} />
          )}
          {footer}
        </div>
      )}
    </div>
  )
}
