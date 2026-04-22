'use client'

import { useEffect, useRef, useState } from 'react'
import { AssistantBody } from './AssistantBody'
import { ClaudeMessage } from './ClaudeMessage'
import { UserMessage } from './UserMessage'
import { SAMPLE_LESSONS_BY_ID } from '@/lib/data/sample-course'
import type { Lesson } from '@/lib/types/lesson'

/**
 * Side-by-side slide illustration for the prompt-engineering talk track.
 *
 * This is NOT a live chat — it's a framed illustration embedded in a slide.
 * Both columns share one lesson ("Understanding the People You Build For")
 * and reveal their scripted turns one bubble at a time with a soft fade, so
 * the reader can actually watch the two prompt patterns unfold rather than
 * scroll through a wall of prose.
 *
 *   Left column  — Information dump: one user ask, one giant Claude reply
 *                  with every card inlined. Appears in two beats.
 *   Right column — Modular back-and-forth: short turns, one card at a time,
 *                  the writer steering the next move each round.
 *
 * Cards render against lesson 1 regardless of the user's right-panel nav,
 * so the demo stays grounded in the same knowledge-dumper draft.
 */

type ScriptTurn = { role: 'user' | 'assistant'; text: string }
type Scenario = {
  id: string
  label: string
  subhead: string
  caption: string
  turns: ScriptTurn[]
}

const USER_ASK =
  'Can you review my draft of "Understanding the People You Build For"? Just wrapped the first pass and I\'d like your take before I ship it.'

const SCENARIO_DUMP: Scenario = {
  id: 'dump',
  label: 'Information dump',
  subhead: '1 reply · every finding at once',
  caption:
    'All ten findings surfaced in one response with every card inlined. The writer sees a wall of content and has to decide which to tackle first.',
  turns: [
    { role: 'user', text: USER_ASK },
    {
      role: 'assistant',
      text: `I reviewed the lesson and pulled out ten issues across objectives, structure, Bloom's alignment, and assessment.

**1. Objective 1 is unobservable.**

{{{card:objective-0}}}

Rewrite to: "Describe the four quadrants of an empathy map and what each captures."

**2. Objective 2 is unobservable.**

{{{card:objective-1}}}

Rewrite to: "Explain why semi-structured interviews surface workarounds better than surveys."

**3. Objective 3 uses an unmeasurable verb.**

{{{card:objective-2}}}

Rewrite to: "Classify user statements as pain points or habits when reviewing interview data."

**4. Objective 4 has no corresponding content.**

{{{card:objective-3}}}

The lesson never teaches observation techniques. Drop the objective or add a section.

**5. Introduction is an information dump.**

{{{card:section-1}}}

Six research methods in one sentence. Narrow to two.

**6. Empathy mapping is a wall of text.**

{{{card:section-2}}}

One paragraph doing four jobs. Break into three beats: definition, worked example, your-turn.

**7. No worked example.** No filled-in empathy map anywhere. Add one.

**8. No knowledge check.** Ask: "Given these observations, which quadrant does each belong to?"

**9. Dropdowns hide core content.**

{{{card:dropdown-1}}}

The question bank is essential. Promote it to a visible section.

**10. Tabs don't earn their space.**

{{{card:tabs-1}}}

Overview restates the intro; Resources is a book list. Drop the component.

Which would you like to apply first?`,
    },
  ],
}

const SCENARIO_MODULAR: Scenario = {
  id: 'modular',
  label: 'Modular back-and-forth',
  subhead: 'short turns · one card at a time',
  caption:
    'Issues surfaced once as a summary, then tackled 1–2 at a time. Each turn pairs a single card with a focused critique and a clear next step.',
  turns: [
    { role: 'user', text: USER_ASK },
    {
      role: 'assistant',
      text: `I took a pass. The content is comprehensive but reads like a reference doc — thin on practice, heavy on definitions. Three clusters:

- **Objectives.** All four use unobservable verbs.
- **Empathy mapping section.** One paragraph covering five things.
- **Assessment.** Nothing verifies learning.

Objectives set what the rest should deliver. Want to start there?`,
    },
    { role: 'user', text: "yes let's start there" },
    {
      role: 'assistant',
      text: `Start with the first one:

{{{card:objective-0}}}

Rewrite to: "Describe the four quadrants of an empathy map and what each captures." A verb you can watch someone demonstrate.`,
    },
    { role: 'user', text: 'nice. next?' },
    {
      role: 'assistant',
      text: `{{{card:objective-1}}}

Rewrite to: "Explain why semi-structured interviews surface workarounds better than surveys."`,
    },
    { role: 'user', text: 'and the last two?' },
    {
      role: 'assistant',
      text: `{{{card:objective-3}}}

The lesson never teaches workflow observation. Drop this one. Coverage gap closed.`,
    },
    { role: 'user', text: "cut it. what's next?" },
    {
      role: 'assistant',
      text: `The empathy mapping section. Let's look at it together:

{{{card:section-2}}}

One paragraph doing five jobs. Break it into three beats — definition, worked example, your-turn exercise. Want me to draft the example?`,
    },
    { role: 'user', text: 'yeah' },
    {
      role: 'assistant',
      text: `A filled-in empathy map for a support rep:

- **Says:** "I copy numbers into a spreadsheet because I don't trust the dashboard."
- **Thinks:** "This tool was built by someone who's never done month-end close."
- **Does:** Opens the dashboard, exports to Excel.
- **Feels:** Frustrated. Rushed. Distrustful.

The insight lives where Says and Does contradict.`,
    },
    { role: 'user', text: 'nice. structural stuff left?' },
    {
      role: 'assistant',
      text: `The question bank:

{{{card:dropdown-1}}}

This is core content, not supplementary. Promote it to its own richtext block so learners don't miss it.`,
    },
    { role: 'user', text: "let's promote it" },
    {
      role: 'assistant',
      text: `Done. Question bank is now its own block between the empathy beats and the assessment. Same rhythm works for the other sections — you'll ship faster.`,
    },
  ],
}

const SCENARIOS: [Scenario, Scenario] = [SCENARIO_DUMP, SCENARIO_MODULAR]

// Fade-in pacing. Each turn reveals at a steady tempo — no easing tricks.
const USER_TURN_GAP_MS = 900
const ASSISTANT_TURN_GAP_MS = 1800
const DWELL_AT_END_MS = 4500
const START_DELAY_MS = 600

/** Timeline of absolute delays (ms) at which each turn should appear. */
function buildTimeline(turns: ScriptTurn[]): number[] {
  const timeline: number[] = []
  let t = START_DELAY_MS
  for (let i = 0; i < turns.length; i++) {
    timeline.push(t)
    const gap = turns[i].role === 'user' ? USER_TURN_GAP_MS : ASSISTANT_TURN_GAP_MS
    t += gap
  }
  return timeline
}

export function PromptPatternDemo() {
  const lesson = SAMPLE_LESSONS_BY_ID['l1']
  const [paused, setPaused] = useState(false)
  const [cycle, setCycle] = useState(0)

  const dumpTimeline = buildTimeline(SCENARIO_DUMP.turns)
  const modularTimeline = buildTimeline(SCENARIO_MODULAR.turns)

  const [dumpVisible, setDumpVisible] = useState(0)
  const [modularVisible, setModularVisible] = useState(0)

  useEffect(() => {
    if (paused) return
    setDumpVisible(0)
    setModularVisible(0)

    const timers: number[] = []
    dumpTimeline.forEach((delay, i) => {
      timers.push(window.setTimeout(() => setDumpVisible(i + 1), delay))
    })
    modularTimeline.forEach((delay, i) => {
      timers.push(window.setTimeout(() => setModularVisible(i + 1), delay))
    })

    const dumpDone = dumpTimeline[dumpTimeline.length - 1] ?? 0
    const modularDone = modularTimeline[modularTimeline.length - 1] ?? 0
    const end = Math.max(dumpDone, modularDone) + DWELL_AT_END_MS
    timers.push(window.setTimeout(() => setCycle((c) => c + 1), end))

    return () => timers.forEach((t) => window.clearTimeout(t))
    // Rebuilding timelines on each cycle is cheap (array of numbers); deps
    // intentionally only track loop control, not the constant timelines.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, paused])

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        background: 'rgb(247, 246, 242)',
      }}
    >
      <div
        style={{
          padding: '24px 40px 32px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          style={{
            maxWidth: 1180,
            width: '100%',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          <ScenarioColumn
            scenario={SCENARIOS[0]}
            lesson={lesson}
            visibleCount={dumpVisible}
            cycle={cycle}
          />
          <ScenarioColumn
            scenario={SCENARIOS[1]}
            lesson={lesson}
            visibleCount={modularVisible}
            cycle={cycle}
          />
        </div>
      </div>

      <style>{`
        @keyframes promptDemoFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prompt-demo-bubble {
          animation: promptDemoFadeIn 0.45s ease both;
        }
        /* Scale Claude/User messages down to feel like a slide illustration
           rather than the live chat. Affects only prose inside this demo. */
        .prompt-demo-thread [class*='font-text'] { font-size: 12.5px !important; }
        .prompt-demo-thread h1 { font-size: 15px !important; }
        .prompt-demo-thread h2 { font-size: 13.5px !important; }
        .prompt-demo-thread h3 { font-size: 12.5px !important; }
        .prompt-demo-thread p { margin: 0 0 6px !important; }
        .prompt-demo-thread ul, .prompt-demo-thread ol { margin: 2px 0 6px !important; padding-left: 16px !important; }
      `}</style>
    </div>
  )
}

function ScenarioColumn({
  scenario,
  lesson,
  visibleCount,
  cycle,
}: {
  scenario: Scenario
  lesson: Lesson
  visibleCount: number
  cycle: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // When a new bubble appears, keep the latest one in view — smooth, not
  // an accelerating scroll. No-op when the thread hasn't overflowed yet.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [visibleCount])

  return (
    <div
      className="prompt-demo-thread"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 440,
        background: 'white',
        borderRadius: 12,
        border: '1px solid rgba(31, 30, 29, 0.1)',
        boxShadow:
          '0 12px 28px rgba(31, 30, 29, 0.05), 0 1px 3px rgba(31, 30, 29, 0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '14px 18px 18px',
          scrollBehavior: 'smooth',
        }}
      >
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          {scenario.turns.slice(0, visibleCount).map((turn, i) => (
            <div
              key={`${cycle}-${i}`}
              className="prompt-demo-bubble"
              style={{ animationDelay: '0ms' }}
            >
              {turn.role === 'user' ? (
                <UserMessage text={turn.text} />
              ) : (
                <ClaudeMessage>
                  <AssistantBody text={turn.text} lesson={lesson} />
                </ClaudeMessage>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
