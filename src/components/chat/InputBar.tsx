'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { ModelPicker } from './ModelPicker'
import { ArrowUp, Plus, Square } from 'lucide-react'
import type { Model } from '@/lib/api'
import { useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'

type InputBarProps = Omit<ComponentProps<'div'>, 'onChange'> & {
  placeholder?: string
  /**
   * If set, empty-textarea sends submit this text instead of being blocked.
   * The placeholder is set to this value so the user sees exactly what will
   * be sent. Typing their own message overrides the starter.
   */
  starterMessage?: string
  models: Model[]
  model: Model
  onModelChange: (model: Model) => void
  isStreaming?: boolean
  onSend?: (text: string) => void
  onStop?: () => void
  onAttachmentClick?: () => void
}

export function InputBar({
  className,
  placeholder = 'How can I help you today?',
  starterMessage,
  models,
  model,
  onModelChange,
  isStreaming = false,
  onSend,
  onStop,
  onAttachmentClick,
  ...props
}: InputBarProps) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()
  const effectiveText = trimmed.length > 0 ? trimmed : (starterMessage ?? '')
  const canSend = effectiveText.length > 0 && !isStreaming
  const effectivePlaceholder = starterMessage ?? placeholder

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-size the textarea to its content. When empty, size to fit the
  // wrapped placeholder — HTML textareas don't count placeholder text in
  // scrollHeight, so we briefly mirror it into the DOM value, measure, and
  // restore. This keeps long starter messages fully readable on load.
  useLayoutEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    if (ta.value) {
      ta.style.height = ta.scrollHeight + 'px'
      return
    }
    if (effectivePlaceholder) {
      ta.value = effectivePlaceholder
      const measured = ta.scrollHeight
      ta.value = ''
      ta.style.height = measured + 'px'
    }
  }, [value, effectivePlaceholder])

  const handleSend = () => {
    if (!canSend) return
    onSend?.(effectiveText)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn('bg-surface shadow-input flex w-full flex-col rounded-xl', className)}
      {...props}
    >
      <div className="m-3.5 flex flex-col gap-3">
        <div className="max-h-96 min-h-12 overflow-y-auto pl-1.5 pt-1.5">
          <textarea
            ref={textareaRef}
            placeholder={effectivePlaceholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            className="font-text text-text-primary placeholder:text-text-tertiary block w-full resize-none border-none bg-transparent p-0 font-sans text-base leading-[1.4] outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex grow items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onAttachmentClick}
              aria-label="Add attachment"
              className="ml-0.5"
            >
              <Plus className="size-5" />
            </Button>
          </div>

          <ModelPicker models={models} value={model} onChange={onModelChange} />

          {isStreaming ? (
            <Button size="icon" variant="primary" onClick={onStop} aria-label="Stop generating">
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="primary"
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
