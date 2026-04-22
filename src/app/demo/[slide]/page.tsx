import { redirect } from 'next/navigation'

/**
 * All `/demo/<slide>` URLs (including numeric slide indexes from the old deck)
 * redirect to `/new` — the single supported entry point. Slide-by-slide URLs
 * are intentionally closed off so the submission has one way in.
 */
export default function SlideRedirect() {
  redirect('/new')
}
