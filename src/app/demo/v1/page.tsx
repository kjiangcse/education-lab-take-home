import { redirect } from 'next/navigation'

// /demo/v1 previously hosted the live-chat landing. The sole landing route is
// now /new — any stray link into the old demo surface funnels back there.
export default function DemoV1Redirect() {
  redirect('/new')
}
