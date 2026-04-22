'use client'

import { use, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { getSlide, VISIBLE_SLIDES } from '@/lib/demo/slides'
import { usePresenterChannel } from '@/lib/demo/presenter-channel'

export default function SlideView({ params }: { params: Promise<{ slide: string }> }) {
  const { slide } = use(params)
  const def = getSlide(slide)
  if (!def) notFound()

  const router = useRouter()

  // Presenter channel is still wired up so any externally-opened presenter
  // window can follow along and navigate this page. The launcher button has
  // been removed from the slide page itself.
  const post = usePresenterChannel((msg) => {
    if (msg.type === 'navigate') {
      router.push(`/demo/${msg.slideId}`)
    } else if (msg.type === 'request-active') {
      post({ type: 'active', slideId: slide })
    }
  })

  // Broadcast the current slide so any open presenter window follows along.
  useEffect(() => {
    post({ type: 'active', slideId: slide })
  }, [slide, post])

  // Keyboard navigation: arrow/page keys move between slides so the presenter
  // flow works without leaving the main window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target
      if (tgt instanceof HTMLElement) {
        if (tgt.isContentEditable) return
        if (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.tagName === 'SELECT') return
      }
      const idx = VISIBLE_SLIDES.findIndex((s) => s.id === slide)
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        const next = VISIBLE_SLIDES[idx + 1]
        if (next) {
          e.preventDefault()
          router.push(`/demo/${next.id}`)
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        const prev = VISIBLE_SLIDES[idx - 1]
        if (prev) {
          e.preventDefault()
          router.push(`/demo/${prev.id}`)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slide, router])

  return (
    <main
      style={{
        height: '100%',
        overflow: 'hidden',
        background: 'rgb(250, 249, 245)',
        position: 'relative',
      }}
    >
      {def.render()}
    </main>
  )
}
