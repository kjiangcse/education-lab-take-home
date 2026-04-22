'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Catch-all for any unknown URL — funnels to the /new landing so the app has
// one canonical entry point and stray links never dead-end. Client-side
// redirect avoids a Next.js 16 performance-measure error that fires when
// not-found throws a server-side redirect().
export default function NotFound() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/new')
  }, [router])
  return null
}
