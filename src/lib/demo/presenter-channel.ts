'use client'

import { useCallback, useEffect, useRef } from 'react'

const CHANNEL_NAME = 'cued-demo-presenter'

export type PresenterMessage =
  | { type: 'active'; slideId: string }
  | { type: 'navigate'; slideId: string }
  | { type: 'request-active' }
  | { type: 'bye' }

/**
 * Syncs slide state between the main demo window and the pop-out presenter view.
 * Returns a stable `post` function; the handler always sees its latest closure.
 */
export function usePresenterChannel(onMessage?: (msg: PresenterMessage) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null)
  const handlerRef = useRef(onMessage)
  handlerRef.current = onMessage

  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    const listener = (e: MessageEvent) => handlerRef.current?.(e.data as PresenterMessage)
    channel.addEventListener('message', listener)
    return () => {
      channel.removeEventListener('message', listener)
      channel.close()
      channelRef.current = null
    }
  }, [])

  return useCallback((msg: PresenterMessage) => {
    channelRef.current?.postMessage(msg)
  }, [])
}
