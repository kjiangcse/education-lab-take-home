'use client'

import type { ReactNode } from 'react'

const STROKE = 'rgb(61, 61, 58)'
const MUTED = 'rgba(31, 30, 29, 0.25)'
const ACCENT = 'rgb(217, 119, 87)'
const PANEL = 'white'

function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '4 / 5',
      borderRadius: 8,
      backgroundColor: 'rgba(31, 30, 29, 0.03)',
      border: '1px solid rgba(31, 30, 29, 0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

// All SVGs use a 200×250 viewBox = 4:5 portrait.

// Step 1: Install & Configure — terminal window, portrait
function InstallIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        <rect x="8" y="30" width="184" height="190" rx="10" fill={PANEL} stroke={STROKE} strokeOpacity="0.18" />
        <rect x="8" y="30" width="184" height="24" rx="10" fill="rgba(31, 30, 29, 0.05)" />
        <path d="M8 54 L192 54" stroke={STROKE} strokeOpacity="0.1" />
        <circle cx="24" cy="42" r="4" fill={ACCENT} opacity="0.7" />
        <circle cx="38" cy="42" r="4" fill="rgb(220, 180, 60)" opacity="0.7" />
        <circle cx="52" cy="42" r="4" fill="rgb(120, 180, 110)" opacity="0.7" />
        <text x="22" y="80" fontFamily="ui-monospace, monospace" fontSize="10" fill={MUTED}>$</text>
        <text x="34" y="80" fontFamily="ui-monospace, monospace" fontSize="10" fill={STROKE}>npm install</text>
        <text x="22" y="98" fontFamily="ui-monospace, monospace" fontSize="10" fill={STROKE}>@anthropic-ai/sdk</text>
        <text x="22" y="128" fontFamily="ui-monospace, monospace" fontSize="10" fill={MUTED}>$</text>
        <text x="34" y="128" fontFamily="ui-monospace, monospace" fontSize="10" fill={STROKE}>export</text>
        <text x="22" y="146" fontFamily="ui-monospace, monospace" fontSize="10" fill={STROKE}>ANTHROPIC_API_KEY</text>
        <text x="22" y="178" fontFamily="ui-monospace, monospace" fontSize="10" fill={MUTED}>$</text>
        <rect x="36" y="170" width="8" height="12" fill={ACCENT} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
        </rect>
      </svg>
    </Frame>
  )
}

// Step 2: Write Your Prompt — document with pencil, portrait
function PromptIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        <rect x="28" y="26" width="128" height="180" rx="8" fill={PANEL} stroke={STROKE} strokeOpacity="0.2" />
        <rect x="44" y="48" width="70" height="8" rx="2" fill={STROKE} fillOpacity="0.55" />
        <rect x="44" y="72" width="96" height="5" rx="2" fill={STROKE} fillOpacity="0.22" />
        <rect x="44" y="84" width="88" height="5" rx="2" fill={STROKE} fillOpacity="0.22" />
        <rect x="44" y="96" width="96" height="5" rx="2" fill={STROKE} fillOpacity="0.22" />
        <rect x="44" y="108" width="74" height="5" rx="2" fill={STROKE} fillOpacity="0.22" />
        <rect x="44" y="134" width="60" height="6" rx="2" fill={ACCENT} fillOpacity="0.55" />
        <rect x="44" y="150" width="80" height="5" rx="2" fill={STROKE} fillOpacity="0.22" />
        <rect x="44" y="162" width="70" height="5" rx="2" fill={STROKE} fillOpacity="0.22" />
        <rect x="44" y="182" width="40" height="5" rx="2" fill={STROKE} fillOpacity="0.18" />
        {/* pencil */}
        <g transform="translate(146, 168) rotate(40)">
          <rect x="0" y="0" width="54" height="11" rx="2" fill={PANEL} stroke={STROKE} strokeOpacity="0.35" />
          <rect x="0" y="0" width="12" height="11" rx="2" fill={ACCENT} opacity="0.85" />
          <polygon points="54,0 63,5.5 54,11" fill={STROKE} fillOpacity="0.55" />
        </g>
      </svg>
    </Frame>
  )
}

// Step 3: Add Structure — JSON braces stacked with key-value rows, portrait
function StructureIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        <text x="38" y="60" fontFamily="ui-monospace, monospace" fontSize="38" fill={STROKE} fillOpacity="0.5">{'{'}</text>
        <g>
          <circle cx="76" cy="92" r="3.5" fill={ACCENT} />
          <rect x="88" y="88" width="38" height="7" rx="2" fill={STROKE} fillOpacity="0.45" />
          <rect x="132" y="88" width="30" height="7" rx="2" fill={STROKE} fillOpacity="0.18" />
        </g>
        <g>
          <circle cx="76" cy="120" r="3.5" fill={ACCENT} opacity="0.8" />
          <rect x="88" y="116" width="30" height="7" rx="2" fill={STROKE} fillOpacity="0.45" />
          <rect x="124" y="116" width="44" height="7" rx="2" fill={STROKE} fillOpacity="0.18" />
        </g>
        <g>
          <circle cx="76" cy="148" r="3.5" fill={ACCENT} opacity="0.6" />
          <rect x="88" y="144" width="46" height="7" rx="2" fill={STROKE} fillOpacity="0.45" />
          <rect x="140" y="144" width="26" height="7" rx="2" fill={STROKE} fillOpacity="0.18" />
        </g>
        <g>
          <circle cx="76" cy="176" r="3.5" fill={ACCENT} opacity="0.45" />
          <rect x="88" y="172" width="34" height="7" rx="2" fill={STROKE} fillOpacity="0.45" />
          <rect x="128" y="172" width="36" height="7" rx="2" fill={STROKE} fillOpacity="0.18" />
        </g>
        <text x="38" y="220" fontFamily="ui-monospace, monospace" fontSize="38" fill={STROKE} fillOpacity="0.5">{'}'}</text>
      </svg>
    </Frame>
  )
}

// Step 4: Deploy — cloud + up arrow + sparkles, portrait
function DeployIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        {/* sparkles (background) */}
        <g fill={ACCENT} opacity="0.55">
          <circle cx="38" cy="40" r="2.5" />
          <circle cx="168" cy="56" r="3" />
          <circle cx="30" cy="120" r="2" />
          <circle cx="174" cy="160" r="2.5" />
          <circle cx="58" cy="188" r="2" />
        </g>
        {/* cloud */}
        <path
          d="M48 150 a24 24 0 0 1 46 -6 a22 22 0 0 1 42 4 a20 20 0 0 1 -6 38 h-78 a26 26 0 0 1 -4 -36 z"
          fill={PANEL} stroke={STROKE} strokeOpacity="0.28" strokeWidth="1.8"
        />
        {/* up arrow rising into cloud */}
        <g transform="translate(100, 82)">
          <rect x="-4" y="0" width="8" height="52" fill={ACCENT} opacity="0.9" />
          <polygon points="-14,6 0,-12 14,6" fill={ACCENT} opacity="0.9" />
        </g>
      </svg>
    </Frame>
  )
}

// Before: planning card (calendar / schedule), portrait
function BeforeIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        <rect x="30" y="28" width="140" height="194" rx="10" fill={PANEL} stroke={STROKE} strokeOpacity="0.22" />
        <rect x="30" y="28" width="140" height="28" rx="10" fill="rgba(31, 30, 29, 0.05)" />
        <path d="M30 56 L170 56" stroke={STROKE} strokeOpacity="0.15" />
        <text x="44" y="48" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" fill={STROKE} fillOpacity="0.6">MON</text>
        <text x="92" y="48" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" fill={STROKE} fillOpacity="0.6">TUE</text>
        <text x="138" y="48" fontFamily="ui-sans-serif, system-ui" fontSize="11" fontWeight="600" fill={ACCENT} opacity="0.9">WED</text>
        {[72, 100, 128, 156, 184].map((y, i) => (
          <g key={i}>
            <rect x="44" y={y} width="60" height="6" rx="2" fill={STROKE} fillOpacity={i === 1 ? 0.5 : 0.2} />
            <rect x="108" y={y} width="48" height="6" rx="2" fill={STROKE} fillOpacity="0.18" />
          </g>
        ))}
        {/* highlighted session block */}
        <rect x="44" y="96" width="112" height="16" rx="4" fill={ACCENT} opacity="0.18" stroke={ACCENT} strokeOpacity="0.6" />
      </svg>
    </Frame>
  )
}

// During: clipboard + pen taking notes, portrait (replaces the eye)
function DuringIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        {/* clipboard backing */}
        <rect x="36" y="36" width="128" height="184" rx="10" fill={PANEL} stroke={STROKE} strokeOpacity="0.22" />
        {/* clip at top */}
        <rect x="80" y="22" width="40" height="22" rx="5" fill="rgba(31, 30, 29, 0.08)" stroke={STROKE} strokeOpacity="0.3" />
        <rect x="88" y="18" width="24" height="10" rx="3" fill={STROKE} fillOpacity="0.35" />
        {/* observation lines */}
        {[70, 86, 102, 118, 134, 154, 170].map((y, i) => {
          const widths = [100, 84, 96, 70, 90, 80, 60]
          const opacity = i === 4 ? 0.55 : 0.22
          const color = i === 4 ? ACCENT : STROKE
          const fillOp = i === 4 ? 0.55 : 0.22
          return (
            <g key={i}>
              {/* tick mark */}
              <circle cx="52" cy={y + 3} r="2" fill={color} fillOpacity={i === 4 ? 1 : 0.4} />
              <rect x="60" y={y} width={widths[i]} height="5" rx="2" fill={color} fillOpacity={fillOp} opacity={opacity === 0.55 ? 1 : 1} />
            </g>
          )
        })}
        {/* pen lying on clipboard */}
        <g transform="translate(104, 176) rotate(24)">
          <rect x="0" y="0" width="56" height="9" rx="2" fill={PANEL} stroke={STROKE} strokeOpacity="0.35" />
          <rect x="0" y="0" width="12" height="9" rx="2" fill={ACCENT} opacity="0.85" />
          <polygon points="56,0 64,4.5 56,9" fill={STROKE} fillOpacity="0.55" />
        </g>
      </svg>
    </Frame>
  )
}

// After: ranked checklist, portrait
function AfterIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        {[
          { y: 58, w: 116, accent: true, ranked: '1' },
          { y: 102, w: 96, accent: false, ranked: '2' },
          { y: 146, w: 82, accent: false, ranked: '3' },
          { y: 190, w: 70, accent: false, ranked: '4', faded: true },
        ].map((row, i) => (
          <g key={i} opacity={row.faded ? 0.5 : 1}>
            {/* rank numeral */}
            <text x="32" y={row.y + 8} fontFamily="ui-sans-serif, system-ui" fontSize="18" fontWeight="600" fill={STROKE} fillOpacity={row.accent ? 0.7 : 0.35}>{row.ranked}</text>
            {/* checkbox */}
            <rect x="54" y={row.y - 6} width="20" height="20" rx="5" fill={PANEL} stroke={STROKE} strokeOpacity="0.28" />
            <path
              d={`M58 ${row.y + 3} L63 ${row.y + 8} L72 ${row.y - 2}`}
              stroke={row.accent ? ACCENT : STROKE}
              strokeOpacity={row.accent ? 1 : 0.55}
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* line */}
            <rect x="82" y={row.y + 1} width={row.w} height="6" rx="2" fill={STROKE} fillOpacity={row.accent ? 0.5 : 0.25} />
          </g>
        ))}
      </svg>
    </Frame>
  )
}

// Overview: four-quadrant methods summary, portrait
function OverviewIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        {/* outer card */}
        <rect x="24" y="34" width="152" height="182" rx="10" fill={PANEL} stroke={STROKE} strokeOpacity="0.22" />
        {/* divider cross */}
        <line x1="100" y1="52" x2="100" y2="198" stroke={STROKE} strokeOpacity="0.12" />
        <line x1="40" y1="125" x2="160" y2="125" stroke={STROKE} strokeOpacity="0.12" />
        {/* quadrant labels + mini bars */}
        {[
          { x: 42, y: 62, labelOpacity: 0.55, accent: true },
          { x: 108, y: 62, labelOpacity: 0.45 },
          { x: 42, y: 136, labelOpacity: 0.45 },
          { x: 108, y: 136, labelOpacity: 0.45 },
        ].map((q, i) => (
          <g key={i}>
            <rect x={q.x} y={q.y} width="20" height="3" rx="1.5" fill={q.accent ? ACCENT : STROKE} fillOpacity={q.labelOpacity} />
            <rect x={q.x} y={q.y + 12} width="50" height="4" rx="2" fill={STROKE} fillOpacity="0.22" />
            <rect x={q.x} y={q.y + 22} width="38" height="4" rx="2" fill={STROKE} fillOpacity="0.22" />
            <rect x={q.x} y={q.y + 32} width="44" height="4" rx="2" fill={STROKE} fillOpacity="0.22" />
          </g>
        ))}
      </svg>
    </Frame>
  )
}

// Resources: stack of books with bookmarks, portrait
function ResourcesIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        {[
          { y: 60, color: 'rgba(217, 119, 87, 0.22)', stroke: ACCENT, accent: true },
          { y: 100, color: 'rgba(31, 30, 29, 0.06)', stroke: STROKE, accent: false },
          { y: 140, color: 'rgba(31, 30, 29, 0.06)', stroke: STROKE, accent: false },
        ].map((book, i) => (
          <g key={i}>
            {/* book body */}
            <rect x="38" y={book.y} width="124" height="30" rx="5" fill={PANEL} stroke={book.stroke} strokeOpacity={book.accent ? 0.6 : 0.2} />
            {/* colored spine */}
            <rect x="38" y={book.y} width="10" height="30" rx="5" fill={book.color} />
            {/* title bar */}
            <rect x="58" y={book.y + 8} width="80" height="5" rx="2" fill={STROKE} fillOpacity={book.accent ? 0.55 : 0.4} />
            {/* author bar */}
            <rect x="58" y={book.y + 18} width="50" height="4" rx="2" fill={STROKE} fillOpacity="0.2" />
            {/* bookmark */}
            {book.accent && (
              <polygon points={`152,${book.y - 2} 158,${book.y - 2} 158,${book.y + 16} 155,${book.y + 12} 152,${book.y + 16}`} fill={ACCENT} opacity="0.85" />
            )}
          </g>
        ))}
        {/* article link below */}
        <g>
          <circle cx="46" cy="198" r="3" fill={STROKE} fillOpacity="0.25" />
          <rect x="56" y="194" width="106" height="5" rx="2" fill={STROKE} fillOpacity="0.3" />
          <rect x="56" y="204" width="72" height="4" rx="2" fill={STROKE} fillOpacity="0.18" />
        </g>
      </svg>
    </Frame>
  )
}

// Generic fallback: document with content rows, portrait
function GenericIllustration() {
  return (
    <Frame>
      <svg viewBox="0 0 200 250" width="88%" height="88%" preserveAspectRatio="xMidYMid meet" fill="none">
        <rect x="40" y="30" width="120" height="180" rx="8" fill={PANEL} stroke={STROKE} strokeOpacity="0.22" />
        {/* folded corner */}
        <polygon points="148,30 160,30 160,42" fill="rgba(31, 30, 29, 0.08)" stroke={STROKE} strokeOpacity="0.22" />
        <rect x="56" y="54" width="56" height="6" rx="2" fill={ACCENT} fillOpacity="0.6" />
        {[78, 94, 110, 126, 150, 166, 182].map((y, i) => (
          <rect key={i} x="56" y={y} width={[88, 74, 86, 64, 84, 70, 54][i]} height="4" rx="2" fill={STROKE} fillOpacity="0.22" />
        ))}
      </svg>
    </Frame>
  )
}

const ILLUSTRATIONS: Record<string, () => ReactNode> = {
  'Step 1': InstallIllustration,
  'Step 2': PromptIllustration,
  'Step 3': StructureIllustration,
  'Step 4': DeployIllustration,
  'Before': BeforeIllustration,
  'During': DuringIllustration,
  'After': AfterIllustration,
  'Overview': OverviewIllustration,
  'Resources': ResourcesIllustration,
}

export function StepIllustration({ heading }: { heading: string }) {
  const Component = ILLUSTRATIONS[heading.trim()] ?? GenericIllustration
  return <Component />
}
