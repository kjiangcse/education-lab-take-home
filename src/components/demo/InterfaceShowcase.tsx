'use client'

/**
 * Slide 3 interactive showcase: toggles between the accessory pattern (CMS
 * editor with a chatbot rail) and our center-stage pattern (chat center with
 * a lesson viewer). Default is "accessory" so the presenter can show the
 * baseline first, then click through to the chosen direction.
 */

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type Mode = 'accessory' | 'main'

const MOCK_PALETTE = {
  barColor: 'rgba(31, 30, 29, 0.14)',
  fadedBar: 'rgba(31, 30, 29, 0.08)',
  accentBubble: 'rgba(217, 119, 87, 0.18)',
  accentStrong: 'rgba(217, 119, 87, 0.6)',
  accentSoft: 'rgba(217, 119, 87, 0.5)',
  panelBg: 'rgba(247, 246, 242, 0.7)',
  chrome: 'rgba(31, 30, 29, 0.04)',
  chromeDivider: 'rgba(31, 30, 29, 0.08)',
} as const

const MOCK_WIDTH = 1056
const GLYPH_INK_STRONG = 'rgba(31, 30, 29, 0.78)'

export function InterfaceShowcase() {
  const [mode, setMode] = useState<Mode>('main')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        marginTop: 28,
        width: '100%',
      }}
    >
      {mode === 'accessory' ? <AccessoryCMSMock /> : <CenterStageMockDetailed />}
      <InterfaceToggle mode={mode} onChange={setMode} />
    </div>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────

function InterfaceToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Interface pattern"
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: 4,
        borderRadius: 10,
        background: 'rgba(31, 30, 29, 0.05)',
        border: '1px solid rgba(31, 30, 29, 0.08)',
      }}
    >
      <ToggleButton
        label="Chat as main interface"
        selected={mode === 'main'}
        onClick={() => onChange('main')}
      />
      <ToggleButton
        label="Chat as accessory"
        selected={mode === 'accessory'}
        onClick={() => onChange('accessory')}
      />
    </div>
  )
}

function ToggleButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      style={{
        padding: '9px 18px',
        fontSize: 13,
        fontWeight: selected ? 600 : 500,
        borderRadius: 7,
        background: selected ? 'rgb(217, 119, 87)' : 'transparent',
        color: selected ? 'white' : 'rgba(31, 30, 29, 0.48)',
        boxShadow: selected ? '0 4px 10px rgba(217, 119, 87, 0.25)' : 'none',
        letterSpacing: '-0.005em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 120ms ease, color 120ms ease, box-shadow 120ms ease',
      }}
    >
      {selected && <span style={{ fontSize: 12, lineHeight: 1 }}>✓</span>}
      {label}
    </button>
  )
}

// ── Shared mock primitives ─────────────────────────────────────────────

function FadedBar({ w, h = 8 }: { w: number | string; h?: number }) {
  return <div style={{ height: h, width: w, borderRadius: 4, background: MOCK_PALETTE.fadedBar }} />
}

function WindowChrome({ tail }: { tail?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 14px',
        background: MOCK_PALETTE.chrome,
        borderBottom: `1px solid ${MOCK_PALETTE.chromeDivider}`,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(31, 30, 29, 0.18)' }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(31, 30, 29, 0.12)' }} />
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(31, 30, 29, 0.12)' }} />
      <div style={{ flex: 1 }} />
      {tail ?? <FadedBar w={60} h={10} />}
    </div>
  )
}

/** Shared window-chrome tail used by both mocks so the outer frame stays
 *  identical — the only thing that changes on toggle is the interior. */
function LessonChromeTail() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 999,
          background: 'rgba(31, 30, 29, 0.04)',
          border: '1px solid rgba(31, 30, 29, 0.08)',
        }}
      >
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: MOCK_PALETTE.accentStrong }} />
        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(31, 30, 29, 0.55)' }}>Lesson 1</div>
      </div>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(31, 30, 29, 0.15)' }} />
    </div>
  )
}

function MockWindow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: MOCK_WIDTH,
        aspectRatio: '16 / 9',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(31, 30, 29, 0.08), 0 2px 6px rgba(31, 30, 29, 0.06)',
        border: '1px solid rgba(31, 30, 29, 0.1)',
        background: 'white',
      }}
    >
      {children}
    </div>
  )
}

function NavTile({ active, children }: { active?: boolean; children?: ReactNode }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
        background: active ? 'rgba(217, 119, 87, 0.14)' : 'rgba(31, 30, 29, 0.06)',
        border: active ? '1px solid rgba(217, 119, 87, 0.4)' : '1px solid rgba(31, 30, 29, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  )
}

function ToolbarButton({ label, bold }: { label: string; bold?: boolean }) {
  return (
    <div
      style={{
        minWidth: 20,
        height: 20,
        padding: '0 5px',
        borderRadius: 4,
        background: 'rgba(31, 30, 29, 0.05)',
        border: '1px solid rgba(31, 30, 29, 0.08)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: bold ? 700 : 600,
        color: 'rgba(31, 30, 29, 0.72)',
        letterSpacing: '-0.02em',
      }}
    >
      {label}
    </div>
  )
}

// ── Accessory mock — CMS editor + chat rail ────────────────────────────

function AccessoryCMSMock() {
  const ink = 'rgba(31, 30, 29, 0.55)'
  const inkStrong = 'rgba(31, 30, 29, 0.82)'
  const mutedBubble = 'rgba(31, 30, 29, 0.07)'
  const mutedInk = 'rgba(31, 30, 29, 0.3)'

  return (
    <MockWindow>
      <WindowChrome tail={<LessonChromeTail />} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', flex: 1, minHeight: 0 }}>
        {/* CMS editor — the active work surface (~80%) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
            borderRight: `1px solid ${MOCK_PALETTE.chromeDivider}`,
          }}
        >
          {/* Title strip */}
          <div
            style={{
              padding: '12px 22px',
              borderBottom: `1px solid ${MOCK_PALETTE.chromeDivider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ width: 3, height: 18, borderRadius: 2, background: MOCK_PALETTE.accentStrong }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: inkStrong, letterSpacing: '-0.01em' }}>
              Understanding the People You Build For
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                padding: '2px 9px',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'rgba(31, 30, 29, 0.55)',
                background: 'rgba(31, 30, 29, 0.06)',
                borderRadius: 999,
              }}
            >
              Draft
            </div>
          </div>
          {/* Formatting toolbar */}
          <div
            style={{
              padding: '8px 18px',
              borderBottom: `1px solid ${MOCK_PALETTE.chromeDivider}`,
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
          >
            <ToolbarButton label="B" bold />
            <ToolbarButton label="I" />
            <ToolbarButton label="U" />
            <div style={{ width: 1, height: 14, background: MOCK_PALETTE.chromeDivider, margin: '0 4px' }} />
            <ToolbarButton label="H1" bold />
            <ToolbarButton label="H2" bold />
            <ToolbarButton label="¶" />
            <div style={{ width: 1, height: 14, background: MOCK_PALETTE.chromeDivider, margin: '0 4px' }} />
            <ToolbarButton label="•" />
            <ToolbarButton label="1." />
            <ToolbarButton label="⌘" />
            <div style={{ flex: 1 }} />
            <ToolbarButton label="↺" />
            <ToolbarButton label="↻" />
          </div>
          {/* Body */}
          <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: inkStrong,
                letterSpacing: '-0.015em',
              }}
            >
              Why user research matters
            </div>
            <div style={{ fontSize: 10, lineHeight: 1.55, color: ink, letterSpacing: '-0.005em' }}>
              Every successful product starts with the same insight: the people you&apos;re
              building for know things you don&apos;t. Good user research turns that truth into
              design decisions — not guesses dressed up as strategy.
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: inkStrong,
                letterSpacing: '-0.01em',
                marginTop: 4,
              }}
            >
              Research methods
            </div>
            <div style={{ fontSize: 10, lineHeight: 1.55, color: ink, letterSpacing: '-0.005em' }}>
              Four core methods drive most product decisions: user interviews, empathy mapping,
              shadowing sessions, and contextual inquiry. Each reveals a different slice of how
              your users actually work.
            </div>
            {/* Image block — naturally narrower than body text, like a real inline figure */}
            <div
              style={{
                width: '55%',
                height: 72,
                borderRadius: 6,
                background: 'rgba(31, 30, 29, 0.04)',
                border: `1px dashed ${MOCK_PALETTE.chromeDivider}`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(31, 30, 29, 0.3)',
                letterSpacing: '1.5px',
                marginTop: 2,
              }}
            >
              IMAGE
              {[
                { top: 5, left: 5 },
                { top: 5, right: 5 },
                { bottom: 5, left: 5 },
                { bottom: 5, right: 5 },
              ].map((pos, i) => (
                <div
                  key={i}
                  style={{ position: 'absolute', width: 6, height: 6, border: '1px solid rgba(31, 30, 29, 0.35)', ...pos }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, lineHeight: 1.55, color: ink, letterSpacing: '-0.005em' }}>
              The goal isn&apos;t to run every method on every project — it&apos;s to pick the
              one that answers the specific question you&apos;re trying to resolve.
            </div>
          </div>
        </div>

        {/* Chat rail — muted, passive; the agent is a side accessory */}
        <div
          style={{
            padding: '12px 10px',
            background: MOCK_PALETTE.panelBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'rgba(31, 30, 29, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 8,
                fontWeight: 700,
              }}
            >
              AI
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(31, 30, 29, 0.7)', letterSpacing: '-0.01em' }}>
              Assistant
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgb(21, 128, 61)' }} />
          </div>
          {/* Assistant message */}
          <div
            style={{
              padding: '7px 9px',
              borderRadius: 6,
              background: mutedBubble,
              fontSize: 9,
              lineHeight: 1.5,
              color: mutedInk,
              letterSpacing: '-0.005em',
            }}
          >
            Drafted an intro based on your notes. Paste it in whenever you&apos;re ready.
          </div>
          {/* User message */}
          <div
            style={{
              alignSelf: 'flex-end',
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(31, 30, 29, 0.1)',
              fontSize: 9,
              lineHeight: 1.5,
              color: mutedInk,
              letterSpacing: '-0.005em',
            }}
          >
            Make it shorter.
          </div>
          {/* Assistant thinking */}
          <div
            style={{
              padding: '7px 9px',
              borderRadius: 6,
              background: mutedBubble,
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: mutedInk }} />
            ))}
          </div>
          <div style={{ flex: 1 }} />
          {/* Input */}
          <div
            style={{
              height: 28,
              borderRadius: 6,
              background: 'white',
              border: `1px solid ${MOCK_PALETTE.chromeDivider}`,
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <div style={{ fontSize: 9, color: 'rgba(31, 30, 29, 0.32)', letterSpacing: '-0.005em' }}>Ask AI…</div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: 'rgba(31, 30, 29, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                <path d="M4 1 L4 7 M2 3 L4 1 L6 3" stroke="rgba(31, 30, 29, 0.55)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  )
}

// ── Center-stage mock — chat center + lesson preview ───────────────────

function CenterStageMockDetailed() {
  const accent = MOCK_PALETTE.accentStrong
  const proseInk = 'rgba(31, 30, 29, 0.78)'

  const userBubble: CSSProperties = {
    alignSelf: 'flex-end',
    maxWidth: '84%',
    padding: '8px 11px',
    borderRadius: 12,
    background: MOCK_PALETTE.accentBubble,
    border: '1px solid rgba(217, 119, 87, 0.25)',
    fontSize: 10,
    lineHeight: 1.5,
    color: 'rgba(164, 78, 52, 0.95)',
    letterSpacing: '-0.005em',
  }

  const claudeProse: CSSProperties = {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    fontSize: 10,
    lineHeight: 1.55,
    color: proseInk,
    letterSpacing: '-0.005em',
  }

  return (
    <MockWindow>
      <WindowChrome tail={<LessonChromeTail />} />
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 380px', flex: 1, minHeight: 0 }}>
        {/* Left nav */}
        <div
          style={{
            padding: '10px 0',
            background: MOCK_PALETTE.panelBg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 7,
            borderRight: `1px solid ${MOCK_PALETTE.chromeDivider}`,
          }}
        >
          <NavTile>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path d="M5 1 L1 4 V9 H9 V4 Z" fill="none" stroke={GLYPH_INK_STRONG} strokeWidth="1" />
            </svg>
          </NavTile>
          <NavTile active>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <rect x="2" y="1.5" width="6" height="7" rx="0.8" fill="none" stroke="rgb(217, 119, 87)" strokeWidth="1" />
              <line x1="3.5" y1="4" x2="6.5" y2="4" stroke="rgb(217, 119, 87)" strokeWidth="0.8" />
              <line x1="3.5" y1="5.5" x2="6.5" y2="5.5" stroke="rgb(217, 119, 87)" strokeWidth="0.8" />
            </svg>
          </NavTile>
          <NavTile>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path d="M5 1 L6.2 3.6 L9 4 L7 6 L7.5 9 L5 7.6 L2.5 9 L3 6 L1 4 L3.8 3.6 Z" fill="none" stroke={GLYPH_INK_STRONG} strokeWidth="0.9" />
            </svg>
          </NavTile>
          <NavTile>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <circle cx="5" cy="5" r="1.3" fill="none" stroke={GLYPH_INK_STRONG} strokeWidth="0.9" />
              <circle cx="5" cy="5" r="3.2" fill="none" stroke={GLYPH_INK_STRONG} strokeWidth="0.9" />
            </svg>
          </NavTile>
          <div style={{ flex: 1 }} />
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: MOCK_PALETTE.accentStrong,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            K
          </div>
        </div>

        {/* Chat column */}
        <div
          style={{
            padding: '12px 14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            borderRight: `1px solid ${MOCK_PALETTE.chromeDivider}`,
            background: 'linear-gradient(to bottom, rgba(217, 119, 87, 0.045), rgba(217, 119, 87, 0.012))',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(217, 119, 87, 0.85)',
              letterSpacing: '-0.005em',
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
            Scenario 1 · Empathy mapping review
          </div>

          {/* Scrollable message history — overflow stays inside the mock instead
              of pushing the input off-screen. */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
              paddingRight: 2,
            }}
          >
            <div style={userBubble}>
              Quick sanity check — is my empathy mapping section reading too dense? I&apos;m worried
              it&apos;s drifted into a textbook definition.
            </div>

            <div style={claudeProse}>
              Yes. The opening paragraph is doing four jobs at once — defining empathy maps,
              listing the quadrants, describing the process, and mentioning tools. Here&apos;s
              the first sentence swapped for something learners can act on:
            </div>

            {/* Inline diff card */}
            <div
              style={{
                borderRadius: 8,
                border: '1px solid rgba(217, 119, 87, 0.32)',
                background: 'white',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                boxShadow: '0 1px 3px rgba(31, 30, 29, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                  <circle cx="4" cy="4" r="1.6" fill="none" stroke={accent} strokeWidth="1" />
                  <line x1="4" y1="5.6" x2="4" y2="7.2" stroke={accent} strokeWidth="1" />
                </svg>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(31, 30, 29, 0.65)', letterSpacing: '-0.01em' }}>
                  Empathy Mapping · section-2
                </div>
                <div style={{ flex: 1 }} />
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                  <path d="M2 8 L8 2 M5 2 H8 V5" stroke={accent} strokeWidth="1" fill="none" strokeLinecap="round" />
                </svg>
              </div>
              <div
                style={{
                  fontSize: 9,
                  lineHeight: 1.45,
                  color: 'rgba(31, 30, 29, 0.65)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(220, 38, 38, 0.75)',
                  textDecorationThickness: '1px',
                }}
              >
                An empathy map is a collaborative visualization used to articulate what we know about a particular type of user.
              </div>
              <div style={{ fontSize: 9, lineHeight: 1.45, color: 'rgb(21, 128, 61)', fontWeight: 500 }}>
                An empathy map is a 2×2 grid — Says, Thinks, Does, Feels — filled in by observing a real person.
              </div>
            </div>

            <div style={userBubble}>
              Got it — but I don&apos;t want to lose the thinking-vs-saying nuance. Beginners
              need that context before they try their first map.
            </div>

            <div style={claudeProse}>
              Keep it. Fold it into beat three as a short aside: <em>&ldquo;Watch the gap between what
              people say and what they do — that&apos;s where the insight lives.&rdquo;</em> The worked
              example does the real teaching, so you don&apos;t need a formal definition.
            </div>

            {/* Inline tabs artifact — sits as the closing beat of the chat,
                illustrating the third kind of Claude-rendered artifact. */}
            <MockTabsArtifact accent={accent} />
          </div>

          {/* Input */}
          <div
            style={{
              height: 30,
              borderRadius: 10,
              background: 'white',
              border: '1px solid rgba(31, 30, 29, 0.14)',
              padding: '0 6px 0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(31, 30, 29, 0.04)',
            }}
          >
            <div style={{ fontSize: 9, color: 'rgba(31, 30, 29, 0.35)', letterSpacing: '-0.005em' }}>Reply to Claude…</div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden>
                <path d="M4.5 1 L4.5 8 M2 3.3 L4.5 1 L7 3.3" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Preview panel — a hand-rolled static mock that visually mirrors the
            real LessonPreview without pulling in live lesson state. The
            illustration doesn't need real data; this keeps the slide hermetic. */}
        <MockLessonPreview />
      </div>
    </MockWindow>
  )
}

// ── Inline tabs artifact ───────────────────────────────────────────────

/** Static gallery artifact — mirrors the lesson's "tabs" component pattern:
 *  a short title, a row of non-clickable tab headers, and a content area
 *  split between body text on the left and a mock image block on the right.
 *  Scaled down to fit in the chat column; the first tab is visually active
 *  and its content is the only one rendered (no toggle — this is an
 *  illustration, not an interactive widget). */
function MockTabsArtifact({ accent }: { accent: string }) {
  const tabs = ['Beat 1 · Define', 'Beat 2 · Example', 'Beat 3 · Practice']
  const inkStrong = 'rgba(31, 30, 29, 0.82)'
  const ink = 'rgba(31, 30, 29, 0.65)'
  const dividerLine = 'rgba(31, 30, 29, 0.08)'

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${dividerLine}`,
        background: 'white',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(31, 30, 29, 0.04)',
      }}
    >
      {/* Tab row (non-interactive) */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${dividerLine}`, background: 'rgba(31, 30, 29, 0.02)' }}>
        {tabs.map((label, i) => {
          const selected = i === 0
          return (
            <div
              key={label}
              style={{
                flex: 1,
                padding: '6px 8px',
                textAlign: 'center',
                fontSize: 9,
                fontWeight: selected ? 700 : 500,
                color: selected ? inkStrong : 'rgba(31, 30, 29, 0.45)',
                background: selected ? 'white' : 'transparent',
                borderBottom: selected ? `2px solid ${accent}` : '2px solid transparent',
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {label}
            </div>
          )
        })}
      </div>

      {/* Active tab content: body text on the left, mock image on the right
          (image occupies 45% of the row width). Extra padding + min-height give
          the artifact more visual weight inside the chat column. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '55% 45%',
          gap: 12,
          padding: '12px 12px 14px',
          minHeight: 140,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: inkStrong, letterSpacing: '-0.01em' }}>
            Define the concept first
          </div>
          <div style={{ fontSize: 9, lineHeight: 1.5, color: ink, letterSpacing: '-0.005em' }}>
            Two sentences. What an empathy map is, how it gets filled. Just enough scaffolding
            before the learner sees a real one.
          </div>
        </div>
        <MockImagePlaceholder />
      </div>
    </div>
  )
}

/** Tiny "image" block — dashed frame, corner crop marks, a faint label line.
 *  Reads as "an image goes here" without pulling in a real asset. Sized to a
 *  4:5 portrait aspect ratio so the illustration feels like a vertical image. */
function MockImagePlaceholder() {
  const frame = 'rgba(31, 30, 29, 0.12)'
  const barFaint = 'rgba(31, 30, 29, 0.08)'
  const accent = MOCK_PALETTE.accentStrong
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '4 / 5',
        borderRadius: 5,
        border: `1px solid ${frame}`,
        background: 'rgba(31, 30, 29, 0.03)',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      <div style={{ height: 2, width: 18, borderRadius: 1, background: accent }} />
      <div style={{ height: 2, width: '70%', borderRadius: 1, background: barFaint }} />
      <div style={{ height: 2, width: '55%', borderRadius: 1, background: barFaint }} />
      <div style={{ flex: 1 }} />
      <div style={{ height: 2, width: '60%', borderRadius: 1, background: barFaint }} />
      <div style={{ height: 2, width: '40%', borderRadius: 1, background: barFaint }} />
    </div>
  )
}

// ── Static lesson preview mock ─────────────────────────────────────────

/** Hand-rolled static preview that visually mirrors the real LessonPreview
 *  panel without binding to live lesson state. Used only by the slide-3
 *  illustration so the demo renders deterministically regardless of what the
 *  user has done to lesson-1 elsewhere in the app. */
function MockLessonPreview() {
  const ink = 'rgba(31, 30, 29, 0.82)'
  const mutedInk = 'rgba(31, 30, 29, 0.55)'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgb(250, 249, 245)',
        borderLeft: `1px solid ${MOCK_PALETTE.chromeDivider}`,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Breadcrumb / toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderBottom: `1px solid ${MOCK_PALETTE.chromeDivider}`,
          fontSize: 9,
          color: mutedInk,
          letterSpacing: '-0.005em',
        }}
      >
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
          <rect x="1.5" y="2" width="7" height="6" rx="0.8" fill="none" stroke={MOCK_PALETTE.accentStrong} strokeWidth="0.9" />
        </svg>
        <span style={{ color: MOCK_PALETTE.accentStrong, fontWeight: 600 }}>Course</span>
        <span>›</span>
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
          <path d="M2 1.5 H7 L8 2.5 V8.5 H2 Z" fill="none" stroke={mutedInk} strokeWidth="0.8" />
        </svg>
        <span style={{ fontWeight: 600, color: ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          Understanding the People…
        </span>
        <span style={{ fontSize: 11, color: mutedInk }}>↺</span>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 7px',
            borderRadius: 5,
            border: `1px solid ${MOCK_PALETTE.chromeDivider}`,
            background: 'white',
            fontSize: 9,
            fontWeight: 600,
            color: ink,
          }}
        >
          <span>◎</span> Pre…
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          margin: '10px 10px 0',
          padding: '14px 14px',
          borderRadius: 8,
          background: 'rgb(31, 30, 29)',
          color: 'white',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.015em' }}>
          Understanding the People You Build For
        </div>
        <div style={{ marginTop: 6, fontSize: 9, lineHeight: 1.55, color: 'rgba(255, 255, 255, 0.72)', letterSpacing: '-0.005em' }}>
          Empathy mapping for internal users. How to interview coworkers about their workflows without
          leading them.
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: ink, letterSpacing: '-0.01em' }}>
          Learning Objectives
        </div>
        <ul style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[
            'Understand empathy mapping',
            'Learn about user interviews',
            'Know the difference between pain points and habits',
            'Be familiar with workflow observation techniques',
          ].map((t) => (
            <li key={t} style={{ fontSize: 9, lineHeight: 1.5, color: ink, letterSpacing: '-0.005em' }}>
              {t}
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: 6,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: mutedInk,
          }}
        >
          Introduction
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: ink, letterSpacing: '-0.01em' }}>
          User Research for Internal Tools
        </div>
        <div style={{ fontSize: 9, lineHeight: 1.55, color: 'rgba(31, 30, 29, 0.7)', letterSpacing: '-0.005em' }}>
          Before you design an empathy map, you need to know what you&apos;re looking for. The first
          lesson anchors the rest — if the research is generic, every artifact after it inherits the
          same thinness.
        </div>
      </div>
    </div>
  )
}
