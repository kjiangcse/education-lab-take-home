import type { TextEdit } from '@/lib/types/lesson'

/**
 * Returns the HTML with each edit rendered as a strikethrough-old + green-new
 * pair, so the original + proposed revision are visible side by side inline.
 * Used by the feedback overlay in the preview panel and by the inline chat
 * diff artifact so the visual stays consistent. The card-level height cap
 * + prompt-level length discipline handle long content instead of a spotlight
 * fade.
 */
export const EDIT_GREEN = 'rgb(21, 128, 61)'

/** Build a regex that matches `original` inside HTML content even when structural
 *  tags (`<p>`, `<strong>`, etc.) sit between tokens. The AI sends plain-text
 *  originals because the lesson serializer strips HTML, so a literal match
 *  against the tagged content almost never succeeds. We tokenize on whitespace
 *  and allow zero or more HTML tags (or whitespace) between tokens. */
function buildTagAwarePattern(original: string): RegExp {
  const tokens = original.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return /$^/
  const escapedTokens = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = escapedTokens.join('(?:<[^>]*>|\\s|&nbsp;)+')
  return new RegExp(pattern, 'i')
}

export function renderEditsInline(html: string, edits: TextEdit[]): string {
  let result = html
  for (const edit of edits) {
    const strike = `<span style="text-decoration: line-through; color: ${EDIT_GREEN}; opacity: 0.55;">$&</span>`
    const green = `<span style="color: ${EDIT_GREEN}; font-weight: 500;">${edit.replacement}</span>`
    // Match both directly (no HTML between tokens) and tag-aware (tags/whitespace
    // between tokens). The direct pattern is stricter, so it wins when present.
    const escapedDirect = edit.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const directRe = new RegExp(escapedDirect, 'i')
    if (directRe.test(result)) {
      result = result.replace(directRe, `${strike} ${green}`)
      continue
    }
    const tagAwareRe = buildTagAwarePattern(edit.original)
    if (tagAwareRe.test(result)) {
      result = result.replace(tagAwareRe, `${strike} ${green}`)
    }
  }
  return result
}

/** Apply edits to a plain string or HTML by replacing each `original` with its
 *  `replacement`. Uses the same tag-aware fallback as `renderEditsInline` so
 *  Accept actually mutates HTML content even when the AI's `original` is plain
 *  text. Returns the input unchanged for edits whose `original` can't be found. */
export function applyEditsToHtml(html: string, edits: TextEdit[]): string {
  let result = html
  for (const edit of edits) {
    const escapedDirect = edit.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const directRe = new RegExp(escapedDirect, 'i')
    if (directRe.test(result)) {
      result = result.replace(directRe, edit.replacement)
      continue
    }
    const tagAwareRe = buildTagAwarePattern(edit.original)
    if (tagAwareRe.test(result)) {
      result = result.replace(tagAwareRe, edit.replacement)
    }
  }
  return result
}
