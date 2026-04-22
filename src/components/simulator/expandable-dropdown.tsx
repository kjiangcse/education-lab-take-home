'use client'

import { useState } from 'react'
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
  /** Override the heading text color (parent wrappers can force black for high-contrast diff rendering). */
  headingColor?: string
}

export function ExpandableDropdown({
  heading = '',
  content = '',
  headingHtml,
  contentHtml,
  defaultExpanded = false,
  headingColor = 'rgb(0, 0, 0)',
}: ExpandableDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const resolvedHeading = headingHtml ?? heading
  const resolvedContent = contentHtml ?? content

  if (!resolvedHeading?.trim() && !resolvedContent?.trim()) return null

  return (
    <div style={{ background: 'white', overflow: 'hidden' }}>
      <div
        data-dropdown-header="true"
        aria-expanded={isExpanded}
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer' }}
      >
        {headingHtml ? (
          <span
            style={{ fontSize: 13, fontWeight: 500, color: headingColor }}
            dangerouslySetInnerHTML={{ __html: headingHtml }}
          />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 500, color: headingColor }}>{heading}</span>
        )}
        {isExpanded ? <ChevronUp size={14} style={{ color: 'rgb(115, 114, 108)' }} /> : <ChevronDown size={14} style={{ color: 'rgb(115, 114, 108)' }} />}
      </div>
      {isExpanded && resolvedContent && (
        <div style={{ padding: '0 16px 12px', borderTop: '1px solid rgb(240, 238, 234)' }}>
          <div className="sim-rich-text" style={{ paddingTop: 12 }} dangerouslySetInnerHTML={{ __html: resolvedContent }} />
        </div>
      )}
    </div>
  )
}
