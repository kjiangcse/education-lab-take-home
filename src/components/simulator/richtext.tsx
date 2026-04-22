'use client'

interface RichTextViewerProps {
  htmlContent?: string
  label?: string
}

export function RichTextViewer({
  htmlContent = '',
  label,
}: RichTextViewerProps) {
  const isHtmlEmpty = (html?: string) => {
    if (!html) return true
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0
  }

  if (isHtmlEmpty(htmlContent)) return null

  return (
    <div>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 500, color: 'rgb(115, 114, 108)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          {label}
        </div>
      )}
      <div
        className="sim-rich-text"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}
