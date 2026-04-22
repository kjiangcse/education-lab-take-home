'use client'

interface LandingSectionProps {
  title?: string
  paragraph?: string
}

export function LandingSection({
  title = 'Getting Started',
  paragraph = '',
}: LandingSectionProps) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'rgb(35, 36, 38)' }}>
      <div style={{ position: 'relative', zIndex: 1, padding: '48px 32px 56px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: 'white', lineHeight: 1.2, marginBottom: 12, margin: 0 }}>
          {title}
        </h1>
        {paragraph && (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: '12px 0 0' }}>
            {paragraph}
          </p>
        )}
      </div>
    </div>
  )
}
