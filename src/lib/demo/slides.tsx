/**
 * Slide registry for presentation mode (/demo/[slide]).
 *
 * Each slide is a route target — the sidebar lists them, the demo page
 * renders the one matching the URL param. Customize the `render` content
 * per slide; keep `title` short so the sidebar label stays scannable.
 */

import type { ReactNode } from 'react'
import { ChatView } from '@/components/chat/ChatView'
import { PromptPatternDemo } from '@/components/chat/PromptPatternDemo'
import { BloomTaxonomy } from '@/components/chat/BloomTaxonomy'
import { InterfaceShowcase } from '@/components/demo/InterfaceShowcase'

export type Slide = {
  id: string
  title: string
  render: () => ReactNode
  /** Presenter narration. Not rendered yet — captured alongside the slide
   *  so the script and the on-screen artifacts stay in the same file. */
  talkTrack?: string
  /** When true, the slide is hidden from the sidebar, arrow-key nav, and
   *  presenter rows. Direct URLs still work. Use to park archived slides
   *  without deleting their content. */
  hidden?: boolean
}

/** Which seeded chat the live-demo slide embeds. Easy to swap if the demo
 *  narrative wants a different starting thread. */
const LIVE_DEMO_CHAT_ID = 'demo-restructure'

// Placeholder content per slide — fill these in as the demo narrative firms up.
// Keeping each slide self-contained (no cross-slide state) so they can be
// rearranged just by reordering this array.
export const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Intro',
    hidden: true,
    render: () => (
      <SlideShell>
        <div style={{ display: 'flex', gap: 56, alignItems: 'center' }}>
          <div style={{ flexShrink: 0, maxWidth: 620 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'rgb(217, 119, 87)',
                marginBottom: 24,
              }}
            >
              Design Engineering · AI Systems · Klaviyo
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
              Hey, I&apos;m Kyle
            </h1>
            <p style={{ fontSize: 22, marginTop: 32, color: 'rgb(115, 114, 108)', lineHeight: 1.55 }}>
              I&apos;m the design lead on the AI systems team at Klaviyo. My work primarily focuses on
              understanding internal and external user friction and thinking about how to improve
              learning efficiency and AI adoption at scale.
            </p>
          </div>
          <ProfileCluster />
        </div>
      </SlideShell>
    ),
  },
  {
    id: '2',
    title: 'The problem',
    hidden: true,
    render: () => (
      <SlideShell>
        <FloatingOutputs />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgb(217, 119, 87)', marginBottom: 24 }}>
            The problem
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: '-0.02em', maxWidth: 960 }}>
            The skill map a writer is expected to own.
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, marginTop: 36, maxWidth: 980 }}>
            <SkillColumn
              label="Core craft"
              accent="rgb(217, 119, 87)"
              items={[
                'Instructional design',
                "Bloom's taxonomy",
                'Content structure',
                'Tone of voice',
                'Glossary discipline',
              ]}
            />
            <SkillColumn
              label="Delivery adjacencies"
              accent="rgb(115, 114, 108)"
              items={[
                'Graphic design',
                'Video production',
                'Accessibility auditing',
                'Motion design',
                'Screencasting',
              ]}
            />
          </div>
        </div>
      </SlideShell>
    ),
  },
  {
    id: '3',
    title: 'The interface',
    hidden: true,
    render: () => (
      <SlideShell>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgb(217, 119, 87)', marginBottom: 24 }}>
          The interface
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: '-0.02em', maxWidth: 880 }}>
          The chat is the stage, not an accessory.
        </h1>

        <InterfaceShowcase />
      </SlideShell>
    ),
  },
  {
    id: '4',
    title: 'Scenario 1',
    hidden: true,
    // Full-bleed: no SlideShell padding. Renders the real chat UI with the
    // lesson studio panel, driven by the seeded demo chat above.
    render: () => <ChatView chatId={LIVE_DEMO_CHAT_ID} redirectOnMissing={false} />,
  },
  {
    id: '5',
    title: 'Scenario 2',
    hidden: true,
    // Full-bleed: renders the seeded demo-blooms thread. ChatView injects a
    // BloomTaxonomy distribution widget for this chatId so the inline
    // "weighted by percentage" view is visible as part of the walkthrough.
    render: () => <ChatView chatId="demo-blooms" redirectOnMissing={false} />,
  },
  {
    id: '6',
    title: 'Closing',
    hidden: true,
    // Full-bleed ChatView opened against the course-level seed chat. The panel
    // defaults to the course view (not a single lesson) via COURSE_LEVEL_CHAT_IDS.
    render: () => <ChatView chatId="demo-closing" redirectOnMissing={false} />,
  },
]

// ── Intro slide profile cluster ─────────────────────────────────────────

/**
 * Two circular headshots: profile-2.png sits as the primary frame, and
 * profile.jpeg overlaps its bottom-right corner as a smaller secondary
 * portrait. Both clip to circles with a matched white ring so the smaller
 * photo reads as a discrete layer on top of the larger one.
 */
function ProfileCluster() {
  const PRIMARY = 300
  // Secondary ≈ 90% of primary, so they read as near-equal but still clearly
  // ranked in size.
  const SECONDARY = 270
  // Pull the secondary inward along both axes so the two circles actually
  // cross edges (~35px of visible clip) instead of just sitting in each
  // other's bounding-box corner without touching.
  const OVERLAP = SECONDARY * 0.4

  return (
    <div
      style={{
        position: 'relative',
        width: PRIMARY + SECONDARY - OVERLAP,
        height: PRIMARY + SECONDARY - OVERLAP,
        flexShrink: 0,
      }}
    >
      {/* Primary portrait: profile-2.png */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: PRIMARY,
          height: PRIMARY,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow:
            '0 40px 80px rgba(31, 30, 29, 0.18), 0 16px 32px rgba(31, 30, 29, 0.12), 0 4px 10px rgba(31, 30, 29, 0.08)',
          background: 'rgb(245, 237, 226)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/profile-2.png"
          alt="Kyle, primary portrait"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Secondary portrait: profile.jpeg, bottom-right, slightly clipping
       *  the primary. No ring — only the shadow separates the two circles. */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: SECONDARY,
          height: SECONDARY,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow:
            '0 30px 56px rgba(31, 30, 29, 0.22), 0 10px 20px rgba(31, 30, 29, 0.14), 0 2px 6px rgba(31, 30, 29, 0.1)',
          background: 'rgb(245, 237, 226)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/profile.jpeg"
          alt="Kyle, secondary portrait"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    </div>
  )
}

// ── Slide scaffolding ───────────────────────────────────────────────────

function SlideShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 96px',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: 'rgb(20, 20, 19)',
      }}
    >
      {children}
    </div>
  )
}

// ── Skills graph (slide 6) ──────────────────────────────────────────────

/**
 * Node-link diagram: Claude on the left, a column of skill nodes on the right,
 * connected by soft curved paths. Built as an SVG layer (for the curves) behind
 * absolutely-positioned DOM nodes (so the labels stay crisp and selectable).
 *
 * Skills mirror what's in src/lib/skills/ — kept in sync by hand, since the
 * slide is a presentation artifact and doesn't need to be data-driven.
 */
function SkillsGraph() {
  const skills = [
    { name: 'Content structure', hint: 'Scaffolding, sequence, pacing' },
    { name: "Bloom's & objectives", hint: 'Cognitive architecture, measurable outcomes' },
    { name: 'Assessment design', hint: 'Does the learner actually learn?' },
    { name: 'Reader experience', hint: 'Voice, tone, reading level, clarity' },
    { name: 'Failure patterns', hint: 'Common anti-patterns surfaced early' },
  ]

  // Dimensions tuned to fit the slide area when the right-side talk-track
  // panel is present. Previous W=980 was correct for the full-width demo, but
  // the 360px narration rail now eats that room, clipping the rightmost card.
  // Everything below is recomputed around W=720 so the graph stops well
  // before the sidebar edge.
  const W = 720
  const H = 420
  const claudeR = 60
  const claudeX = 84
  const claudeY = H / 2
  const cardX = 380
  const cardW = 320
  const cardH = 56
  const gap = 14
  const totalH = skills.length * cardH + (skills.length - 1) * gap
  const startY = (H - totalH) / 2

  return (
    <div style={{ position: 'relative', width: W, height: H, marginTop: 28 }}>
      <svg
        width={W}
        height={H}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <radialGradient id="claudeGlow" cx="30%" cy="30%" r="75%">
            <stop offset="0%" stopColor="rgb(245, 192, 166)" />
            <stop offset="100%" stopColor="rgb(217, 119, 87)" />
          </radialGradient>
          <filter id="claudeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="rgba(217, 119, 87, 0.35)" />
          </filter>
        </defs>
        {skills.map((_, i) => {
          const cy = startY + i * (cardH + gap) + cardH / 2
          const x1 = claudeX + claudeR
          const x2 = cardX
          const midX = (x1 + x2) / 2
          return (
            <path
              key={i}
              d={`M ${x1},${claudeY} C ${midX},${claudeY} ${midX},${cy} ${x2},${cy}`}
              stroke="rgba(217, 119, 87, 0.35)"
              strokeWidth={1.5}
              fill="none"
            />
          )
        })}
        {skills.map((_, i) => {
          const cy = startY + i * (cardH + gap) + cardH / 2
          return (
            <circle
              key={`dot-${i}`}
              cx={cardX}
              cy={cy}
              r={4}
              fill="rgb(217, 119, 87)"
            />
          )
        })}
        <circle
          cx={claudeX}
          cy={claudeY}
          r={claudeR}
          fill="url(#claudeGlow)"
          filter="url(#claudeShadow)"
        />
        <text
          x={claudeX}
          y={claudeY + 6}
          textAnchor="middle"
          fontSize={20}
          fontWeight={600}
          fill="white"
          letterSpacing="-0.01em"
        >
          Claude
        </text>
      </svg>

      {skills.map((skill, i) => (
        <div
          key={skill.name}
          style={{
            position: 'absolute',
            left: cardX + 10,
            top: startY + i * (cardH + gap),
            width: cardW - 10,
            height: cardH,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 18px',
            borderRadius: 12,
            background: 'white',
            border: '1px solid rgba(31, 30, 29, 0.1)',
            boxShadow: '0 2px 8px rgba(31, 30, 29, 0.04)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgb(217, 119, 87)',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'rgb(20, 20, 19)' }}>
              {skill.name}
            </div>
            <div style={{ fontSize: 12, color: 'rgb(115, 114, 108)' }}>{skill.hint}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Curriculum tree (slide 8) ───────────────────────────────────────────

/**
 * Three-tier tree: a certificate/path at the top, courses in the middle,
 * lessons at the bottom. Solid lines show the hierarchy; dashed accent
 * lines arc across the lesson row to show the cross-course "patterns"
 * Claude could surface once it has a view of the whole curriculum.
 *
 * Pure SVG — no DOM overlay — since every label here is short and the
 * cross-arc paths are the visual point of the slide.
 */
function CurriculumGraph() {
  const W = 960
  const H = 440

  const cert = { cx: W / 2, cy: 54, w: 220, h: 52, label: 'Certificate · Klaviyo Pro' }

  const courses = [
    { cx: 160, cy: 214, w: 210, h: 50, label: 'Email deliverability' },
    { cx: 480, cy: 214, w: 210, h: 50, label: 'Segmentation fundamentals' },
    { cx: 800, cy: 214, w: 210, h: 50, label: 'Flow design patterns' },
  ]

  // 3 lessons per course, clustered under each parent.
  const lessons = [
    { cx: 70, cy: 380, label: 'Warm-up', parent: 0 },
    { cx: 160, cy: 380, label: 'Domain auth', parent: 0 },
    { cx: 250, cy: 380, label: 'List hygiene', parent: 0 },
    { cx: 390, cy: 380, label: 'Static vs live', parent: 1 },
    { cx: 480, cy: 380, label: 'Behavior rules', parent: 1 },
    { cx: 570, cy: 380, label: 'Suppression', parent: 1 },
    { cx: 710, cy: 380, label: 'Welcome flow', parent: 2 },
    { cx: 800, cy: 380, label: 'Win-back', parent: 2 },
    { cx: 890, cy: 380, label: 'Post-purchase', parent: 2 },
  ]
  const lessonW = 84
  const lessonH = 38

  // Cross-course connections — the patterns Claude could surface. Indices
  // reference `lessons` above. Kept small so the arcs read as meaningful
  // links, not noise.
  const patterns: Array<[number, number]> = [
    [2, 5], // List hygiene ↔ Suppression (same "clean data" idea)
    [5, 6], // Suppression ↔ Welcome flow (segmentation drives flows)
    [1, 8], // Domain auth ↔ Post-purchase (sender reputation thread)
  ]

  const treeStroke = 'rgba(31, 30, 29, 0.18)'
  const patternStroke = 'rgba(217, 119, 87, 0.75)'

  return (
    <div style={{ marginTop: 28, width: W }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* Cert → course tree: single vertical drop from cert, one
         *  horizontal bus, vertical drops into each course. Classic
         *  orthogonal org-chart geometry — no curves. */}
        {(() => {
          const certBottom = cert.cy + cert.h / 2
          const courseTop = courses[0].cy - courses[0].h / 2
          const busY = (certBottom + courseTop) / 2
          const minX = Math.min(...courses.map((c) => c.cx))
          const maxX = Math.max(...courses.map((c) => c.cx))
          return (
            <g stroke={treeStroke} strokeWidth={1.5} fill="none" strokeLinecap="square">
              <line x1={cert.cx} y1={certBottom} x2={cert.cx} y2={busY} />
              <line x1={minX} y1={busY} x2={maxX} y2={busY} />
              {courses.map((c, i) => (
                <line key={`cc-drop-${i}`} x1={c.cx} y1={busY} x2={c.cx} y2={courseTop} />
              ))}
            </g>
          )
        })()}
        {/* Course → lessons tree: one bus per course so sibling buses
         *  don't overlap. Same orthogonal geometry as above. */}
        {courses.map((parent, i) => {
          const children = lessons.filter((l) => l.parent === i)
          if (children.length === 0) return null
          const parentBottom = parent.cy + parent.h / 2
          const childTop = children[0].cy - lessonH / 2
          const busY = (parentBottom + childTop) / 2
          const minX = Math.min(...children.map((l) => l.cx))
          const maxX = Math.max(...children.map((l) => l.cx))
          return (
            <g
              key={`cl-${i}`}
              stroke={treeStroke}
              strokeWidth={1.25}
              fill="none"
              strokeLinecap="square"
            >
              <line x1={parent.cx} y1={parentBottom} x2={parent.cx} y2={busY} />
              <line x1={minX} y1={busY} x2={maxX} y2={busY} />
              {children.map((l, j) => (
                <line key={`cl-drop-${j}`} x1={l.cx} y1={busY} x2={l.cx} y2={childTop} />
              ))}
            </g>
          )
        })}
        {/* Cross-course pattern arcs */}
        {patterns.map(([a, b], i) => {
          const la = lessons[a]
          const lb = lessons[b]
          const midY = la.cy + lessonH / 2 + 36 + i * 10
          return (
            <path
              key={`pat-${i}`}
              d={`M ${la.cx},${la.cy + lessonH / 2} C ${la.cx},${midY} ${lb.cx},${midY} ${lb.cx},${lb.cy + lessonH / 2}`}
              stroke={patternStroke}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              fill="none"
            />
          )
        })}

        {/* Certificate node */}
        <g>
          <rect
            x={cert.cx - cert.w / 2}
            y={cert.cy - cert.h / 2}
            width={cert.w}
            height={cert.h}
            rx={12}
            fill="rgb(217, 119, 87)"
          />
          <text
            x={cert.cx}
            y={cert.cy - 2}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            letterSpacing="1.2"
            fill="rgba(255, 255, 255, 0.7)"
          >
            CERTIFICATE
          </text>
          <text
            x={cert.cx}
            y={cert.cy + 14}
            textAnchor="middle"
            fontSize={14}
            fontWeight={600}
            fill="white"
          >
            Klaviyo Pro
          </text>
        </g>

        {/* Course nodes */}
        {courses.map((c, i) => (
          <g key={`course-${i}`}>
            <rect
              x={c.cx - c.w / 2}
              y={c.cy - c.h / 2}
              width={c.w}
              height={c.h}
              rx={10}
              fill="white"
              stroke="rgba(217, 119, 87, 0.4)"
              strokeWidth={1.25}
            />
            <text
              x={c.cx}
              y={c.cy - 4}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              letterSpacing="1.2"
              fill="rgb(217, 119, 87)"
            >
              COURSE
            </text>
            <text
              x={c.cx}
              y={c.cy + 12}
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill="rgb(20, 20, 19)"
            >
              {c.label}
            </text>
          </g>
        ))}

        {/* Lesson nodes */}
        {lessons.map((l, i) => (
          <g key={`lesson-${i}`}>
            <rect
              x={l.cx - lessonW / 2}
              y={l.cy - lessonH / 2}
              width={lessonW}
              height={lessonH}
              rx={8}
              fill="white"
              stroke="rgba(31, 30, 29, 0.14)"
              strokeWidth={1}
            />
            <text
              x={l.cx}
              y={l.cy + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={500}
              fill="rgb(61, 61, 58)"
            >
              {l.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, marginTop: 4, paddingLeft: 4, fontSize: 12, color: 'rgb(115, 114, 108)' }}>
        <LegendSwatch color={treeStroke} dashed={false} label="Hierarchy" />
        <LegendSwatch color={patternStroke} dashed label="Patterns Claude can surface" />
      </div>
    </div>
  )
}

function LegendSwatch({ color, dashed, label }: { color: string; dashed: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={28} height={8}>
        <line
          x1={0}
          y1={4}
          x2={28}
          y2={4}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={dashed ? '4 3' : undefined}
        />
      </svg>
      <span>{label}</span>
    </div>
  )
}


/**
 * Ambient background layer for slide 2. Four real writer-designed artifacts
 * drift at low opacity behind the skill copy, blurred and softly rotated so
 * they read as atmosphere, not data. Each tile keeps its natural aspect ratio
 * and gets a slow staggered translate so the deck feels alive without pulling
 * the eye off the text.
 */
function FloatingOutputs() {
  const items: Array<{
    src: string
    width: number
    top?: string
    bottom?: string
    left?: string
    right?: string
    rotate: number
    blur: number
    opacity: number
    duration: string
    delay: string
    variant: 'a' | 'b'
  }> = [
    // Positions use negative pixel offsets (not percentages) so the images
    // peek in from the edges predictably regardless of viewport width —
    // the content block stays free of overlap on anything 1280px+.
    {
      src: 'asset-example-1.jpg',
      width: 340,
      top: '-140px',
      left: '-220px',
      rotate: -7,
      blur: 2,
      opacity: 0.5,
      duration: '13s',
      delay: '0s',
      variant: 'a',
    },
    {
      src: 'asset-example-2.png',
      width: 300,
      top: '60px',
      right: '-230px',
      rotate: 8,
      blur: 2.5,
      opacity: 0.45,
      duration: '15s',
      delay: '1.8s',
      variant: 'b',
    },
    {
      src: 'asset-example-3.png',
      width: 380,
      bottom: '-120px',
      left: '-280px',
      rotate: 4,
      blur: 2,
      opacity: 0.5,
      duration: '14s',
      delay: '2.6s',
      variant: 'a',
    },
    {
      src: 'asset-example-4.png',
      width: 320,
      bottom: '40px',
      right: '-240px',
      rotate: -6,
      blur: 2.5,
      opacity: 0.45,
      duration: '16s',
      delay: '0.9s',
      variant: 'b',
    },
  ]

  return (
    <>
      <style>{`
        @keyframes floating-outputs-a {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -14px, 0); }
        }
        @keyframes floating-outputs-b {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(8px, -10px, 0); }
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {items.map((it) => (
          <div
            key={it.src}
            style={{
              position: 'absolute',
              top: it.top,
              bottom: it.bottom,
              left: it.left,
              right: it.right,
              width: it.width,
              animation: `floating-outputs-${it.variant} ${it.duration} ease-in-out infinite`,
              animationDelay: it.delay,
              willChange: 'transform',
            }}
          >
            <div
              style={{
                transform: `rotate(${it.rotate}deg)`,
                filter: `blur(${it.blur}px) saturate(0.92)`,
                opacity: it.opacity,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow:
                  '0 40px 80px rgba(31, 30, 29, 0.10), 0 12px 24px rgba(31, 30, 29, 0.06)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/${it.src}`}
                alt=""
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function SkillColumn({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          color: accent,
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: `1px solid ${accent === 'rgb(217, 119, 87)' ? 'rgba(217, 119, 87, 0.25)' : 'rgba(31, 30, 29, 0.12)'}`,
        }}
      >
        {label}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'white',
              border: '1px solid rgba(31, 30, 29, 0.08)',
              fontSize: 17,
              fontWeight: 500,
              color: 'rgb(20, 20, 19)',
              lineHeight: 1.3,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accent,
                flexShrink: 0,
              }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Workflow compare (slide 10) ─────────────────────────────────────────

/**
 * Two stacked horizontal flows showing the writer's workflow today vs. the
 * same workflow with this tool slotted in. Same number of nodes, same
 * labels, same positions — only the review step's styling changes. The
 * visual message is "one step gets a collaborator," not "new workflow."
 */
type TimelineStage = { label: string; pct: number; accent?: boolean }

/**
 * Realistic hours split for an enterprise writer producing a lesson. Top row
 * sums to 100% (the full project window). Bottom row sums to ~65% — the same
 * stages, with Claude folding Review + Revise into one shorter collaboration,
 * and shaving small amounts off the middle stages where a live review partner
 * unblocks faster. The empty space at the end of the bottom row is the point:
 * roughly a third of the project window returned to the writer, on top of
 * absorbing the side-of-desk craft learning.
 */
// Stages are listed top-to-bottom as they render, which is reverse-chronological:
// Publish sits on top, Research at the bottom. Only the phases Claude directly
// changes carry `accent: true` so the bar reads as "these colored bands get
// replaced by this one colored band on the right." Everything else is a single
// neutral tone so the eye lands on the swap.
const TODAY_STAGES: TimelineStage[] = [
  { label: 'Publish', pct: 5 },
  { label: 'Revise', pct: 15, accent: true },
  { label: 'Review', pct: 20, accent: true },
  { label: 'Draft', pct: 30 },
  { label: 'Plan', pct: 10 },
  { label: 'Research', pct: 20 },
]

const CLAUDE_STAGES: TimelineStage[] = [
  { label: 'Publish', pct: 5 },
  { label: 'Collaborate with Claude', pct: 12, accent: true },
  { label: 'Draft', pct: 20 },
  { label: 'Plan', pct: 8 },
  { label: 'Research', pct: 20 },
]

/**
 * Two tones, not a gradient. Accent phases (the ones Claude replaces) read in
 * the brand orange; everything else sits on a flat neutral beige so the
 * segmented stack quiets down and the swap lands.
 */
const ACCENT_COLOR = { bg: 'rgb(217, 119, 87)', fg: 'white' }
const NEUTRAL_COLOR = { bg: 'rgb(245, 237, 226)', fg: 'rgb(91, 80, 68)' }

/**
 * Two bottom-aligned vertical bars sharing one time scale. Each bar stacks
 * its stages top-down, so reading top-to-bottom traces the chronology of
 * one lesson. The arrow between bars points at the collapse: the Claude
 * bar is visibly shorter, with a dashed "time returned" region taking the
 * empty space above it.
 */
function WorkflowCompare() {
  const UNIT = 3.6 // px per pct-point → today = 360px, claude = 234px
  const BAR_W = 200
  const todayH = 100 * UNIT
  const claudeTotal = CLAUDE_STAGES.reduce((s, x) => s + x.pct, 0)
  const claudeH = claudeTotal * UNIT

  return (
    <div style={{ marginTop: 32, maxWidth: 1020 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 36 }}>
        <BarColumn
          title="How it’s done today"
          subtitle="100% of the project window"
          titleColor="rgb(115, 114, 108)"
          stages={TODAY_STAGES}
          unit={UNIT}
          width={BAR_W}
          note="+ craft learning on top — evenings, courses, conference talks."
        />

        {/* Arrow sits vertically on the mid-line of the shorter (claude)
         *  bar so it reads as pointing from "today" into "compressed". */}
        <div
          style={{
            height: todayH,
            display: 'flex',
            alignItems: 'flex-end',
            paddingBottom: claudeH / 2 - 14,
          }}
        >
          <CollapseArrow />
        </div>

        <BarColumn
          title="With Claude, in-flow"
          subtitle={`~${claudeTotal}% of the project window`}
          titleColor="rgb(217, 119, 87)"
          stages={CLAUDE_STAGES}
          unit={UNIT}
          width={BAR_W}
          accent
          note="Craft learning folded into the loop — shipping and leveling up at once."
          heroHeight={todayH}
        />
      </div>
    </div>
  )
}

function BarColumn({
  title,
  subtitle,
  titleColor,
  stages,
  unit,
  width,
  accent,
  note,
  heroHeight,
}: {
  title: string
  subtitle: string
  titleColor: string
  stages: TimelineStage[]
  unit: number
  width: number
  accent?: boolean
  note?: string
  /** When set, reserve empty space above the bar so both columns share a
   *  top edge and the "saved" gap is visible. */
  heroHeight?: number
}) {
  const total = stages.reduce((s, x) => s + x.pct, 0)
  const barH = total * unit
  const savedH = heroHeight ? heroHeight - barH : 0

  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 44 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: titleColor,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'rgb(115, 114, 108)' }}>{subtitle}</div>
      </div>

      {heroHeight && savedH > 0 && (
        <div
          style={{
            height: savedH,
            marginBottom: -10,
            borderRadius: 10,
            border: '1px dashed rgba(217, 119, 87, 0.45)',
            background: 'rgba(217, 119, 87, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            color: 'rgb(217, 119, 87)',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
            ~{100 - total}%
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
            }}
          >
            Time returned
          </div>
        </div>
      )}

      <div
        style={{
          width,
          height: barH,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: accent
            ? '0 12px 28px rgba(217, 119, 87, 0.18), 0 2px 6px rgba(31, 30, 29, 0.06)'
            : '0 6px 18px rgba(31, 30, 29, 0.08), 0 1px 3px rgba(31, 30, 29, 0.05)',
        }}
      >
        {stages.map((stage) => {
          const h = stage.pct * unit
          const color = stage.accent ? ACCENT_COLOR : NEUTRAL_COLOR
          // Skinny segments drop to a single row so nothing clips.
          const compact = h < 34
          return (
            <div
              key={stage.label}
              style={{
                height: h,
                background: color.bg,
                color: color.fg,
                display: 'flex',
                flexDirection: compact ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: compact ? 6 : 2,
                padding: '0 12px',
                textAlign: 'center',
                lineHeight: 1.2,
                boxShadow: stage.accent ? 'inset 0 0 0 2px rgba(255, 255, 255, 0.3)' : undefined,
              }}
            >
              <div
                style={{
                  fontSize: compact ? 12 : stage.pct >= 20 ? 15 : 14,
                  fontWeight: stage.accent ? 700 : 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {stage.label}
              </div>
              <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 500 }}>{stage.pct}%</div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: accent ? 'rgb(217, 119, 87)' : 'rgb(20, 20, 19)',
        }}
      >
        {total}%
      </div>

      {note && (
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.45,
            color: accent ? 'rgb(217, 119, 87)' : 'rgb(115, 114, 108)',
            maxWidth: width + 40,
          }}
        >
          {note}
        </div>
      )}
    </div>
  )
}

function CollapseArrow() {
  return (
    <svg width={72} height={28} viewBox="0 0 72 28" fill="none">
      <path
        d="M2 14 H54 M44 4 L60 14 L44 24"
        stroke="rgb(217, 119, 87)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function getSlide(id: string): Slide | undefined {
  return SLIDES.find((s) => s.id === id)
}

/** Slides shown in sidebars, keyboard nav, and the presenter view.
 *  Slides marked `hidden: true` stay reachable by direct URL but are pruned
 *  from every discovery surface. */
export const VISIBLE_SLIDES: Slide[] = SLIDES.filter((s) => !s.hidden)
