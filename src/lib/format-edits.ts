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

export function renderEditsInline(html: string, edits: TextEdit[]): string {
  let result = html
  for (const edit of edits) {
    const escaped = edit.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(
      new RegExp(escaped, 'i'),
      `<span style="text-decoration: line-through; color: ${EDIT_GREEN}; opacity: 0.55;">${edit.original}</span> <span style="color: ${EDIT_GREEN}; font-weight: 500;">${edit.replacement}</span>`,
    )
  }
  return result
}
