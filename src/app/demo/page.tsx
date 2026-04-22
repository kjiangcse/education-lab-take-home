import { redirect } from 'next/navigation'

// /demo entry — funnel to the /new landing. Slides and scenario deep-links
// are intentionally closed off so the reviewer always lands on one surface.
export default function DemoIndex() {
  redirect('/new')
}
