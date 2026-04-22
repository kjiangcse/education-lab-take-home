'use client'

/**
 * Course-level user-journey artifact. Shows the learner's workflow journey
 * from problem-in-the-wild to shipped tool, with each stage mapped to the
 * lesson(s) that address it. Surfaces coverage gaps as "Gap" pills so a
 * course-level reviewer can see holes in the workflow arc at a glance.
 */

export type JourneyStage = {
  /** Short uppercase stage name, e.g. "Notice". */
  label: string
  /** One-line plain-English description of what happens at this stage. */
  caption: string
  /** 1-indexed lesson number that addresses this stage. Omit for a gap. */
  lessonNumber?: number
  /** Optional full lesson title — reserved for richer renderings later. */
  lessonName?: string
  /** Brief note explaining why a stage is uncovered. Only shown on gaps. */
  note?: string
}

type Props = {
  title?: string
  subtitle?: string
  stages?: JourneyStage[]
  summary?: string
}

const DEFAULT_STAGES: JourneyStage[] = [
  {
    label: 'Notice',
    caption: 'Friction at work surfaces',
    note: 'Assumes the learner brings a candidate problem',
  },
  {
    label: 'Understand',
    caption: 'Who has it, what they actually do',
    lessonNumber: 1,
    lessonName: 'Understanding the People You Build For',
  },
  {
    label: 'Frame',
    caption: 'Name the right problem to solve',
    lessonNumber: 2,
    lessonName: 'Design Thinking for Internal Tools',
  },
  {
    label: 'Build',
    caption: 'Prototype with Claude',
    lessonNumber: 3,
    lessonName: 'Custom Claude Tools — From Prompt to Product',
  },
  {
    label: 'Integrate',
    caption: 'Slot into the daily workflow',
    lessonNumber: 4,
    lessonName: 'Workflow Integration & Adoption',
  },
  {
    label: 'Iterate',
    caption: 'Measure adoption, keep or sunset',
    lessonNumber: 5,
    lessonName: 'Evaluating & Iterating on Internal Tools',
  },
]

const ACCENT = 'rgb(217, 119, 87)'
const ACCENT_SOFT_BG = 'rgba(217, 119, 87, 0.1)'
const ACCENT_SOFT_BORDER = 'rgba(217, 119, 87, 0.28)'
const MUTED = 'rgb(150, 149, 144)'
const GAP_BORDER = 'rgba(31, 30, 29, 0.2)'
const DIVIDER = 'rgba(31, 30, 29, 0.08)'

export function UserJourney({
  title = 'Learner journey',
  subtitle = 'Problem in the wild → a shipped tool coworkers actually reach for',
  stages = DEFAULT_STAGES,
  summary = "Five of six stages are covered — one lesson per stage, clean arc. Stage 1 (Notice) assumes the learner already has a candidate problem; worth acknowledging in the intro so learners without one don't bounce.",
}: Props) {
  return (
    <div
      style={{
        border: `1px solid ${DIVIDER}`,
        borderRadius: 10,
        background: 'rgba(255, 254, 252, 0.85)',
        padding: '16px 18px 14px',
        margin: '10px 0',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: ACCENT,
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'rgb(61, 61, 58)', lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.4px',
            color: MUTED,
            whiteSpace: 'nowrap',
            paddingTop: 2,
          }}
        >
          Course level
        </div>
      </div>

      {/* Stage rail */}
      <div style={{ position: 'relative', padding: '4px 0 0' }}>
        {/* Connecting line at dot center */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: `${100 / (stages.length * 2)}%`,
            right: `${100 / (stages.length * 2)}%`,
            height: 1,
            background: 'rgba(31, 30, 29, 0.12)',
            zIndex: 0,
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
            gap: 4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {stages.map((s, i) => {
            const covered = s.lessonNumber !== undefined
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0 2px',
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: covered ? ACCENT : 'rgb(250, 249, 245)',
                    border: `1.5px solid ${covered ? ACCENT : GAP_BORDER}`,
                    marginBottom: 10,
                  }}
                />
                {/* Stage label */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: covered ? 'rgb(20, 20, 19)' : MUTED,
                    textAlign: 'center',
                  }}
                >
                  {s.label}
                </div>
                {/* Caption */}
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.35,
                    color: covered ? 'rgb(115, 114, 108)' : MUTED,
                    textAlign: 'center',
                    marginTop: 4,
                    minHeight: 44,
                  }}
                >
                  {s.caption}
                </div>
                {/* Lesson badge / gap pill */}
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    color: covered ? ACCENT : MUTED,
                    background: covered ? ACCENT_SOFT_BG : 'transparent',
                    border: covered ? `1px solid ${ACCENT_SOFT_BORDER}` : `1px dashed ${GAP_BORDER}`,
                    borderRadius: 999,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {covered ? `Lesson ${s.lessonNumber}` : 'Gap'}
                </div>
                {/* Gap note */}
                {!covered && s.note && (
                  <div
                    style={{
                      fontSize: 10,
                      color: MUTED,
                      textAlign: 'center',
                      marginTop: 6,
                      fontStyle: 'italic',
                      lineHeight: 1.3,
                      maxWidth: 110,
                    }}
                  >
                    {s.note}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {summary && (
        <div
          style={{
            marginTop: 18,
            paddingTop: 12,
            borderTop: `1px solid ${DIVIDER}`,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'rgb(91, 90, 84)',
          }}
        >
          {summary}
        </div>
      )}
    </div>
  )
}
