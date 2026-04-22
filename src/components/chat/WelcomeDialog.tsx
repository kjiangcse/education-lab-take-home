'use client'

import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'cued-learner:welcome-dismissed'

/**
 * Landing-page welcome + prototype disclaimer. Dismissed state is persisted
 * in sessionStorage so it stays closed for the rest of the tab — navigating
 * back to the home route doesn't re-trigger it. Fresh tabs show it again.
 */
export function WelcomeDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) !== '1') setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1')
    } catch {}
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(31, 30, 29, 0.42)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        cursor: 'pointer',
        animation: 'welcome-fade-in 220ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 560,
          width: '100%',
          background: 'rgb(255, 254, 252)',
          borderRadius: 14,
          border: '1px solid rgba(31, 30, 29, 0.08)',
          boxShadow:
            '0 24px 64px -12px rgba(31, 30, 29, 0.24), 0 0 0 0.5px rgba(31, 30, 29, 0.1)',
          padding: '28px 30px 24px',
          cursor: 'default',
          animation: 'welcome-card-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: 'rgb(217, 119, 87)',
            marginBottom: 10,
          }}
        >
          Cued Learner · Prototype
        </div>

        <h1
          id="welcome-title"
          style={{
            fontSize: 22,
            lineHeight: 1.25,
            fontWeight: 600,
            color: 'rgb(20, 20, 19)',
            margin: 0,
            marginBottom: 12,
            letterSpacing: '-0.01em',
          }}
        >
          Welcome. A quick note before you dive in.
        </h1>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'rgb(61, 61, 58)',
            margin: 0,
            marginBottom: 14,
          }}
        >
          This is a <strong style={{ fontWeight: 600, color: 'rgb(20, 20, 19)' }}>design prototype</strong>,
          not a production release. The system prompt has not been tuned with instructional-design
          subject-matter experts, so live model responses may be less reliable or less
          pedagogically precise than a shipped version would be.
        </p>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'rgb(61, 61, 58)',
            margin: 0,
            marginBottom: 18,
          }}
        >
          The intent on display is an{' '}
          <strong style={{ fontWeight: 600, color: 'rgb(20, 20, 19)' }}>
            engagement pattern
          </strong>{' '}
          that turns the work itself into a learning opportunity. Reviewing a lesson with
          Claude isn&apos;t just a quality check — the writer leaves each interaction a little
          sharper at instructional design, so the act of authoring the course becomes the
          path to getting better at authoring courses.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingTop: 14,
            borderTop: '1px solid rgba(31, 30, 29, 0.06)',
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: 'rgb(150, 149, 144)',
              letterSpacing: '0.2px',
            }}
          >
            Scripted scenarios show the intended experience; live chat shows the current
            model behavior.
          </span>
          <button
            type="button"
            onClick={dismiss}
            style={{
              appearance: 'none',
              border: 'none',
              background: 'rgb(20, 20, 19)',
              color: 'rgb(250, 249, 245)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.2px',
              padding: '8px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Got it
          </button>
        </div>
      </div>

      <style>{`
        @keyframes welcome-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes welcome-card-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
