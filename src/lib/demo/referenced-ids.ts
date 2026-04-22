/**
 * Extracts the set of block and item ids a Claude message is bringing into
 * focus, by scanning for `{{{card:...}}}` and `{{{card:diff:...}}}` markers.
 *
 * Used to scope the right-panel's feedback overlay to just the blocks the
 * presenter has already walked through in a scripted demo — so edits on
 * sections Claude hasn't mentioned yet stay hidden until their turn plays.
 *
 * Collected forms:
 *   {{{card:diff:ID}}}              → ID
 *   {{{card:ID}}}                   → ID
 *   {{{card:GROUP:ITEM,ITEM}}}      → GROUP + each ITEM
 */
export function collectReferencedIds(text: string): string[] {
  const out: string[] = []

  for (const m of text.matchAll(/\{\{\{card:diff:([a-z0-9-]+)\}\}\}/g)) {
    out.push(m[1])
  }

  for (const m of text.matchAll(/\{\{\{card:([a-z0-9-]+)(?::([a-z0-9,\-\s]+))?\}\}\}/g)) {
    // The diff-specific form is handled by the first pattern; skip here to
    // avoid misreading "diff" as a block id.
    if (m[1] === 'diff') continue
    out.push(m[1])
    if (m[2]) {
      m[2]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((id) => out.push(id))
    }
  }

  return out
}
