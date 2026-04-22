import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { ChevronDown, Download, FileText } from 'lucide-react'
import type { ComponentProps } from 'react'

type ChatHeaderProps = ComponentProps<'header'> & {
  title: string
  onShare?: () => void
  /** Omit to hide the lesson-studio toggle entirely (used on non-lesson chats). */
  onTogglePanel?: () => void
  panelOpen?: boolean
  /** Omit to hide the download button. Fires with the current chat + lesson state. */
  onDownload?: () => void
}

export function ChatHeader({ className, title, onShare, onTogglePanel, panelOpen, onDownload, ...props }: ChatHeaderProps) {
  return (
    <header
      className={cn(
        'bg-page sticky top-0 z-20 flex h-[var(--header-height)] items-center justify-between px-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-1">
        <Button variant="ghost" className="text-text-primary gap-1 px-2 font-semibold">
          <span className="max-w-[300px] truncate">{title}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            title="Download chat + lesson state"
            aria-label="Download chat and lesson state"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
              borderRadius: 8,
              border: '1px solid rgba(31, 30, 29, 0.12)',
              background: 'transparent',
              color: 'rgb(61, 61, 58)',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(115, 114, 108, 0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <Download size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onShare}>
          Share
        </Button>
        {onTogglePanel && (
          <button
            type="button"
            onClick={onTogglePanel}
            title={panelOpen ? 'Close lesson studio' : 'Open lesson studio'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
              borderRadius: 8,
              border: '1px solid rgba(31, 30, 29, 0.12)',
              background: 'transparent',
              color: 'rgb(61, 61, 58)',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(115, 114, 108, 0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <FileText size={14} />
          </button>
        )}
      </div>
    </header>
  )
}
