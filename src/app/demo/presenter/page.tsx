'use client'

import { useEffect, useRef, useState } from 'react'
import { VISIBLE_SLIDES } from '@/lib/demo/slides'
import { usePresenterChannel } from '@/lib/demo/presenter-channel'

export default function PresenterView() {
  const [activeId, setActiveId] = useState<string>(VISIBLE_SLIDES[0]?.id ?? '1')
  const [connected, setConnected] = useState(false)
  const activeRef = useRef<HTMLButtonElement>(null)

  const post = usePresenterChannel((msg) => {
    if (msg.type === 'active') {
      setActiveId(msg.slideId)
      setConnected(true)
    }
  })

  useEffect(() => {
    post({ type: 'request-active' })
  }, [post])

  // Tell the main window we're gone so its "Talk track" button reappears
  // immediately instead of waiting for the close-poll to notice.
  useEffect(() => {
    const onBeforeUnload = () => post({ type: 'bye' })
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [post])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeId])

  const activeIndex = VISIBLE_SLIDES.findIndex((s) => s.id === activeId)

  return (
    <main
      style={{
        height: '100dvh',
        background: 'rgb(250, 249, 245)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid rgba(31, 30, 29, 0.08)',
          background: 'rgb(250, 249, 245)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: 'rgb(217, 119, 87)',
            marginBottom: 4,
          }}
        >
          Presenter view
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgb(20, 20, 19)' }}>
            Talk track · click to jump
          </div>
          <div style={{ fontSize: 11, color: connected ? 'rgb(108, 143, 108)' : 'rgb(170, 169, 165)' }}>
            {connected ? `● live · ${activeIndex + 1}/${VISIBLE_SLIDES.length}` : '○ waiting for slides…'}
          </div>
        </div>
      </header>

      <div
        style={{
          flex: '1 1 0',
          minHeight: 0,
          overflowY: 'auto',
          scrollPaddingTop: 16,
          padding: '16px 0 64px',
        }}
      >
        {VISIBLE_SLIDES.map((slide, i) => (
          <TalkTrackRow
            key={slide.id}
            title={slide.title}
            talkTrack={slide.talkTrack}
            isActive={slide.id === activeId}
            isFirst={i === 0}
            index={i}
            refIfActive={slide.id === activeId ? activeRef : undefined}
            onJump={() => post({ type: 'navigate', slideId: slide.id })}
          />
        ))}
      </div>
    </main>
  )
}

function TalkTrackRow({
  title,
  talkTrack,
  isActive,
  isFirst,
  index,
  refIfActive,
  onJump,
}: {
  title: string
  talkTrack?: string
  isActive: boolean
  isFirst: boolean
  index: number
  refIfActive?: React.RefObject<HTMLButtonElement | null>
  onJump: () => void
}) {
  const paragraphs = (talkTrack ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <button
      type="button"
      onClick={onJump}
      ref={refIfActive}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: 'none',
        borderTop: isFirst ? 'none' : '1px solid rgba(31, 30, 29, 0.08)',
        borderLeft: isActive ? '2px solid rgb(217, 119, 87)' : '2px solid transparent',
        background: isActive ? 'rgba(217, 119, 87, 0.05)' : 'transparent',
        padding: '18px 22px 20px',
        scrollMarginTop: 16,
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'rgba(31, 30, 29, 0.035)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: paragraphs.length > 0 ? 10 : 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: isActive ? 'rgb(217, 119, 87)' : 'rgb(150, 149, 144)',
            minWidth: 48,
          }}
        >
          {isActive ? 'Now' : `Slide ${index + 1}`}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'rgb(20, 20, 19)' : 'rgb(61, 61, 58)',
          }}
        >
          {title}
        </span>
      </div>

      {paragraphs.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: 'rgb(150, 149, 144)',
            fontStyle: 'italic',
          }}
        >
          (no narration)
        </p>
      ) : (
        paragraphs.map((p, j) => (
          <p
            key={j}
            style={{
              margin: j === 0 ? 0 : '10px 0 0',
              fontSize: 13.5,
              lineHeight: 1.6,
              color: isActive ? 'rgb(40, 40, 38)' : 'rgb(115, 114, 108)',
              whiteSpace: 'pre-wrap',
              transition: 'color 0.2s ease',
            }}
          >
            {p}
          </p>
        ))
      )}
    </button>
  )
}
