import { redirect } from 'next/navigation'
import { VISIBLE_SLIDES } from '@/lib/demo/slides'

// /demo entry — kick to the first visible slide.
export default function DemoIndex() {
  const first = VISIBLE_SLIDES[0]?.id ?? '1'
  redirect(`/demo/${first}`)
}
