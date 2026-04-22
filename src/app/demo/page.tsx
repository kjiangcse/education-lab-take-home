import { redirect } from 'next/navigation'
import { VISIBLE_SLIDES } from '@/lib/demo/slides'

// /demo entry — kick to the first visible slide, falling back to the live v1
// prototype when nothing is visible (the deck slides are currently hidden).
export default function DemoIndex() {
  const first = VISIBLE_SLIDES[0]?.id
  redirect(first ? `/demo/${first}` : '/demo/v1')
}
