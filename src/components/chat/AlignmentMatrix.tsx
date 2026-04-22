'use client'

import type { BloomLevel } from '@/lib/types/blooms'

/**
 * Compact alignment matrix: one row per learning objective, showing the tier
 * the objective's verb implies ("stated") next to the tier the matching lesson
 * content actually delivers ("achieved"), with a gap marker.
 *
 * This is the artifact an instructional designer would actually reach for when
 * auditing a lesson — the pyramid's working-tool cousin. Pair it with the
 * per-section Bloom's overlay for the in-context view.
 */

const TIER_ORDER: BloomLevel[] = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]

const TIER_LABEL: Record<BloomLevel, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
}

const TIER_COLOR: Record<BloomLevel, { bg: string; fg: string; border: string }> = {
  remember: { bg: 'rgba(239, 68, 68, 0.08)', fg: 'rgb(185, 28, 28)', border: 'rgba(239, 68, 68, 0.28)' },
  understand: { bg: 'rgba(249, 115, 22, 0.08)', fg: 'rgb(194, 65, 12)', border: 'rgba(249, 115, 22, 0.28)' },
  apply: { bg: 'rgba(234, 179, 8, 0.1)', fg: 'rgb(161, 98, 7)', border: 'rgba(234, 179, 8, 0.3)' },
  analyze: { bg: 'rgba(34, 197, 94, 0.08)', fg: 'rgb(21, 128, 61)', border: 'rgba(34, 197, 94, 0.28)' },
  evaluate: { bg: 'rgba(59, 130, 246, 0.08)', fg: 'rgb(29, 78, 216)', border: 'rgba(59, 130, 246, 0.28)' },
  create: { bg: 'rgba(139, 92, 246, 0.08)', fg: 'rgb(109, 40, 217)', border: 'rgba(139, 92, 246, 0.28)' },
}

export type AlignmentRow = {
  /** Objective text as authored by the writer. */
  objective: string
  /** Tier implied by the objective verb (author intent). */
  stated: BloomLevel
  /** Highest tier the lesson content actually demands. Omit when no
   *  matching activity exists. */
  achieved?: BloomLevel
}

export type AlignmentMatrixProps = {
  title?: string
  rows: AlignmentRow[]
  summary?: string
}

function tierGap(stated: BloomLevel, achieved?: BloomLevel): number | null {
  if (!achieved) return null
  return TIER_ORDER.indexOf(achieved) - TIER_ORDER.indexOf(stated)
}

export function AlignmentMatrix({ title, rows, summary }: AlignmentMatrixProps) {
  return (
    <div
      style={{
        margin: '12px 0',
        borderRadius: 10,
        border: '1px solid rgba(31, 30, 29, 0.08)',
        background: 'rgba(255, 254, 252, 0.85)',
        overflow: 'hidden',
        fontSize: 13,
      }}
    >
      {title && (
        <div
          style={{
            padding: '12px 16px 10px',
            borderBottom: '1px solid rgba(31, 30, 29, 0.06)',
            fontSize: 13,
            fontWeight: 600,
            color: 'rgb(20, 20, 19)',
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(31, 30, 29, 0.05)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'rgb(115, 114, 108)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 100px 100px 48px',
          gap: 12,
        }}
      >
        <div>Objective</div>
        <div>Stated</div>
        <div>Achieved</div>
        <div style={{ textAlign: 'center' }}>Gap</div>
      </div>

      {rows.map((row, i) => {
        const gap = tierGap(row.stated, row.achieved)
        return (
          <div
            key={i}
            style={{
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 100px 100px 48px',
              gap: 12,
              alignItems: 'center',
              borderBottom: i < rows.length - 1 ? '1px solid rgba(31, 30, 29, 0.05)' : undefined,
            }}
          >
            <div style={{ lineHeight: 1.45, color: 'rgb(20, 20, 19)' }}>{row.objective}</div>
            <TierChip tier={row.stated} />
            {row.achieved ? (
              <TierChip tier={row.achieved} />
            ) : (
              <span
                style={{
                  fontSize: 11,
                  color: 'rgb(170, 169, 165)',
                  fontStyle: 'italic',
                }}
              >
                none
              </span>
            )}
            <GapMarker gap={gap} />
          </div>
        )
      })}

      {summary && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(31, 30, 29, 0.06)',
            background: 'rgba(247, 246, 242, 0.45)',
            fontSize: 12,
            lineHeight: 1.55,
            color: 'rgb(91, 90, 84)',
          }}
        >
          {summary}
        </div>
      )}
    </div>
  )
}

function TierChip({ tier }: { tier: BloomLevel }) {
  const c = TIER_COLOR[tier]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {TIER_LABEL[tier]}
    </span>
  )
}

function GapMarker({ gap }: { gap: number | null }) {
  if (gap === null) {
    return (
      <span
        title="No matching activity"
        style={{ textAlign: 'center', color: 'rgb(170, 169, 165)', fontSize: 14 }}
      >
        —
      </span>
    )
  }
  if (gap === 0) {
    return (
      <span
        title="Aligned"
        style={{
          textAlign: 'center',
          color: 'rgb(34, 150, 90)',
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        ✓
      </span>
    )
  }
  if (gap < 0) {
    const n = Math.abs(gap)
    return (
      <span
        title={`${n} tier${n === 1 ? '' : 's'} below`}
        style={{
          textAlign: 'center',
          color: 'rgb(194, 65, 12)',
          fontSize: 13,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        ↓{n > 1 ? n : ''}
      </span>
    )
  }
  return (
    <span
      title="Exceeds stated tier"
      style={{ textAlign: 'center', color: 'rgb(29, 78, 216)', fontSize: 15 }}
    >
      ↑
    </span>
  )
}
