'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useLesson } from '@/lib/lesson-context'
import type { Lesson } from '@/lib/types/lesson'
import type { BloomArtifactData, BloomLevel, BloomView } from '@/lib/types/blooms'

const BLOOM_LEVELS: { id: BloomLevel; label: string; description: string }[] = [
  { id: 'create', label: 'Create', description: 'Produce something new by combining ideas' },
  { id: 'evaluate', label: 'Evaluate', description: 'Make judgments based on criteria' },
  { id: 'analyze', label: 'Analyze', description: 'Break concepts into parts and find relationships' },
  { id: 'apply', label: 'Apply', description: 'Use knowledge in new situations' },
  { id: 'understand', label: 'Understand', description: 'Explain ideas in your own words' },
  { id: 'remember', label: 'Remember', description: 'Recall facts or terminology' },
]

const ACCENT = 'rgb(217, 119, 87)'
const FILL = 'rgba(217, 119, 87, 0.45)'
const TRACK = 'rgba(31, 30, 29, 0.06)'
const PREVIEW_RED = 'rgb(220, 38, 38)'
const CAPTION_FADE_MS = 200

const EMPTY_DISTRIBUTION: Record<BloomLevel, number> = {
  remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0,
}

/** Walk every tagged unit in the lesson (richtext blocks, dropdown items, tab
 *  items) and return a percentage share per level, summing to 100. Untagged
 *  units are ignored. When nothing is tagged, returns null so callers can fall
 *  back to whatever distribution (if any) was provided externally. */
function computeDistributionFromLesson(lesson: Lesson): Record<BloomLevel, number> | null {
  const counts: Record<BloomLevel, number> = { ...EMPTY_DISTRIBUTION }
  let total = 0
  for (const block of lesson.blocks) {
    if (block.kind === 'richtext' || block.kind === 'video') {
      if (block.blooms_level) {
        counts[block.blooms_level]++
        total++
      }
    } else {
      for (const item of block.items) {
        if (item.blooms_level) {
          counts[item.blooms_level]++
          total++
        }
      }
    }
  }
  if (total === 0) return null
  const out: Record<BloomLevel, number> = { ...EMPTY_DISTRIBUTION }
  for (const key of Object.keys(counts) as BloomLevel[]) {
    out[key] = Math.round((counts[key] / total) * 100)
  }
  return out
}

function diagnose(d: Record<BloomLevel, number>): string {
  const foundational = (d.remember + d.understand) / 2
  const application = (d.apply + d.analyze) / 2
  const synthesis = (d.evaluate + d.create) / 2
  if (synthesis > 40) return 'Module spans all tiers through synthesis.'
  if (application > 40 && synthesis > 15) return 'Coverage reaches Analyze; light on synthesis.'
  if (application > 40) return 'Coverage balanced through Apply.'
  if (foundational > 60 && application < 30) return 'Heavy on foundational tiers; thin above Apply.'
  if (foundational < 30) return 'Thin foundation — unusual shape.'
  return 'Mixed coverage.'
}

type Props = BloomArtifactData & {
  /** Frozen lesson snapshot taken at the time this artifact was authored.
   *  When provided, distribution is computed from this snapshot so the
   *  widget doesn't drift as the live lesson mutates in later turns. */
  lesson?: Lesson
  /** Lesson id the artifact was authored against — used by the jump button. */
  lessonId?: string
  /** Chat id — required for the jump button to open the correct panel. */
  chatId?: string
}

export function BloomTaxonomy({
  level,
  distribution,
  notes,
  defaultView = 'level',
  summary,
  title,
  subtitle,
  lesson: lessonProp,
  lessonId,
  chatId,
}: Props) {
  const ctx = useLesson()

  // Prefer a distribution computed from the lesson's actual tagged units so
  // the pyramid reflects real Bloom's overlay ratings (counts of
  // sections/dropdowns/tabs tagged at each level, normalized to 100%). The
  // lesson source priority: message-time snapshot prop → lessonId lookup →
  // currently focused lesson. The snapshot path is what keeps turn-1
  // widgets frozen after the user applies edits in later turns.
  const resolvedLesson =
    lessonProp ??
    (lessonId ? ctx.lessons.find((l) => l.id === lessonId) : undefined) ??
    ctx.lesson
  const computed = resolvedLesson ? computeDistributionFromLesson(resolvedLesson) : null
  const effectiveDistribution = computed ?? distribution
  const dist = effectiveDistribution ?? EMPTY_DISTRIBUTION
  const view: BloomView = effectiveDistribution ? defaultView : 'level'
  const [preview, setPreview] = useState<BloomLevel | null>(null)
  const [fadingOut, setFadingOut] = useState(false)

  const handleJump = chatId
    ? () => ctx.actions.jumpToField({
        chatId,
        lessonId: lessonId ?? ctx.lesson.id,
        overlay: 'blooms',
      })
    : undefined

  // Level-view caption state (cross-fade between primary / preview captions)
  const [captionVisible, setCaptionVisible] = useState(true)
  const [displayedLevel, setDisplayedLevel] = useState<BloomLevel>(level)

  // Coverage-view preview caption state
  const [covDisplayed, setCovDisplayed] = useState<BloomLevel | null>(null)
  const [covVisible, setCovVisible] = useState(false)

  // Preview 5s auto-reset with fade
  useEffect(() => {
    if (!preview) {
      setFadingOut(false)
      return
    }
    setFadingOut(false)
    const fadeTimer = setTimeout(() => setFadingOut(true), 4500)
    const clearTimer = setTimeout(() => setPreview(null), 5000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(clearTimer)
    }
  }, [preview])

  // Level caption fade
  const levelFocused = preview ?? level
  useEffect(() => {
    if (view !== 'level') return
    if (levelFocused === displayedLevel) return
    setCaptionVisible(false)
    const t = setTimeout(() => {
      setDisplayedLevel(levelFocused)
      setCaptionVisible(true)
    }, CAPTION_FADE_MS)
    return () => clearTimeout(t)
  }, [levelFocused, displayedLevel, view])

  // Coverage caption fade
  useEffect(() => {
    if (view !== 'coverage') return
    if (preview === covDisplayed) return
    if (covDisplayed === null) {
      setCovDisplayed(preview)
      setCovVisible(preview !== null)
      return
    }
    setCovVisible(false)
    const t = setTimeout(() => {
      setCovDisplayed(preview)
      setCovVisible(preview !== null)
    }, CAPTION_FADE_MS)
    return () => clearTimeout(t)
  }, [preview, covDisplayed, view])

  const handleClick = (id: BloomLevel) => {
    if (view === 'level' && id === level) {
      setPreview(null)
      return
    }
    setPreview((prev) => (prev === id ? null : id))
  }

  // ─── Derived caption data ────────────────────────────────────────────────
  const levelEntry = BLOOM_LEVELS.find((l) => l.id === displayedLevel)
  const levelIndex = BLOOM_LEVELS.findIndex((l) => l.id === displayedLevel)
  const levelNextUp = levelIndex > 0 ? BLOOM_LEVELS[levelIndex - 1] : null
  const displayedIsPreview = displayedLevel !== level

  const covEntry = covDisplayed ? BLOOM_LEVELS.find((l) => l.id === covDisplayed) : null
  const covPct = covDisplayed !== null ? dist[covDisplayed] : null
  const covNote = covDisplayed && notes ? notes[covDisplayed] : null

  const fade = {
    opacity: captionVisible ? 1 : 0,
    transition: `opacity ${CAPTION_FADE_MS}ms ease-out`,
  } as const

  return (
    <div
      style={{
        border: '1px solid rgba(31, 30, 29, 0.1)',
        borderRadius: 10,
        padding: 16,
        margin: '12px 0',
        backgroundColor: 'rgba(247, 246, 242, 0.6)',
      }}
    >
      {/* Title */}
      {(title || subtitle) && (
        <div style={{ marginBottom: 10 }}>
          {title && <div style={{ fontSize: 14, fontWeight: 600, color: 'rgb(20, 20, 19)', lineHeight: 1.3 }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 12, color: 'rgb(115, 114, 108)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      )}

      {/* Header: eyebrow + view toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'rgb(115, 114, 108)',
          }}
        >
          Bloom&apos;s Taxonomy
        </div>

        {handleJump && (
          <button
            type="button"
            onClick={handleJump}
            title="Open lesson with Bloom's overlay"
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
              fontFamily: 'inherit',
              transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(217, 119, 87, 0.1)'
              e.currentTarget.style.color = 'rgb(217, 119, 87)'
              e.currentTarget.style.borderColor = 'rgba(217, 119, 87, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgb(115, 114, 108)'
              e.currentTarget.style.borderColor = 'rgba(31, 30, 29, 0.1)'
            }}
          >
            View
            <ArrowUpRight size={12} />
          </button>
        )}
      </div>

      {/* Pyramid */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        {BLOOM_LEVELS.map((l, i) => {
          const width = 50 + i * 10
          const isPrimary = view === 'level' && l.id === level
          const isPreview = preview === l.id
          const pct = dist[l.id] ?? 0

          return (
            <button
              key={l.id}
              type="button"
              onClick={() => handleClick(l.id)}
              aria-pressed={isPreview || isPrimary}
              style={{
                width: `${width}%`,
                position: 'relative',
                padding: '7px 12px',
                backgroundColor: isPrimary ? ACCENT : TRACK,
                color: isPrimary ? 'white' : 'rgb(61, 61, 58)',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: isPrimary ? 600 : view === 'coverage' && pct >= 50 ? 500 : 400,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                fontFamily: 'inherit',
                letterSpacing: isPrimary ? '0.2px' : 0,
                boxShadow: isPreview
                  ? `inset 0 0 0 2px ${fadingOut ? 'rgba(220, 38, 38, 0)' : PREVIEW_RED}`
                  : 'none',
                transition: 'box-shadow 500ms ease-out, background-color 250ms ease-out, color 250ms ease-out',
              }}
            >
              {/* Coverage fill */}
              {view === 'coverage' && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: FILL,
                    pointerEvents: 'none',
                    transition: 'width 300ms ease-out',
                  }}
                />
              )}

              <span style={{ position: 'relative' }}>{l.label}</span>

              {view === 'coverage' && (
                <span
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 11,
                    color: 'rgb(115, 114, 108)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {pct}%
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Caption */}
      {view === 'level' ? (
        levelEntry && (
          <div
            style={{
              marginTop: 14,
              fontSize: 12,
              color: 'rgb(115, 114, 108)',
              lineHeight: 1.5,
            }}
          >
            <div>
              <span style={{ ...fade, color: 'rgb(20, 20, 19)', fontWeight: 600 }}>
                {displayedIsPreview
                  ? `Previewing: ${levelEntry.label}`
                  : `You're at ${levelEntry.label}`}
              </span>
              {' — '}
              <span style={fade}>{levelEntry.description.toLowerCase()}</span>
              .
            </div>
            {levelNextUp && (
              <div style={{ marginTop: 4 }}>
                <span style={{ color: 'rgb(115, 114, 108)' }}>Next: </span>
                <span style={{ ...fade, color: 'rgb(20, 20, 19)' }}>{levelNextUp.label}</span>
                {' — '}
                <span style={fade}>{levelNextUp.description.toLowerCase()}</span>
                .
              </div>
            )}
          </div>
        )
      ) : (
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: 'rgb(115, 114, 108)',
            lineHeight: 1.5,
          }}
        >
          <div>{summary || diagnose(dist)}</div>
          {covEntry && (
            <div
              style={{
                marginTop: 6,
                opacity: covVisible ? 1 : 0,
                transition: `opacity ${CAPTION_FADE_MS}ms ease-out`,
              }}
            >
              <span style={{ color: 'rgb(20, 20, 19)', fontWeight: 600 }}>
                {covEntry.label} ({covPct}%)
              </span>
              {' — '}
              {covEntry.description.toLowerCase()}.
              {covNote && (
                <div style={{ marginTop: 4, color: 'rgb(61, 61, 58)' }}>{covNote}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
