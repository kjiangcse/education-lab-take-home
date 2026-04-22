'use client'

import { useState } from 'react'
import { Greeting, InputBar } from '@/components/chat'
import { ChatView } from '@/components/chat/ChatView'
import { useChatStore } from '@/lib/chat-store'
import { useLesson } from '@/lib/lesson-context'
import { DEMO_STARTER } from '@/lib/seed'

/**
 * Demo sidebar entry "Prototype / v1.0 — Live chat".
 *
 * Starts at the greeting + input landing. On submit we create a real chat and
 * swap to <ChatView> in-place (no route change) so the demo sidebar stays
 * visible and the presenter never loses context. The new chat is a real
 * persistent thread — the user can return to it from the regular app recents.
 *
 * Panel auto-open: handled by chat-store's `get_lesson` tool-call hook, which
 * calls actions.openPanel({chatId, lessonId}) the moment Claude fetches a
 * lesson — so no extra wiring needed here for the right panel to appear.
 */
export default function DemoV1LiveChat() {
  const { config, models, model, setModel, createChat } = useChatStore()
  const { actions } = useLesson()
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  const handleSend = (text: string) => {
    // Point the lesson studio at the starter's lesson so the right panel
    // lands on the content the demo is about.
    actions.navigateToLesson(DEMO_STARTER.lesson_id)
    const id = createChat(text)
    setActiveChatId(id)
  }

  if (activeChatId) {
    return <ChatView chatId={activeChatId} redirectOnMissing={false} />
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-8 h-full">
      <Greeting name={config.userName} />
      <div className="w-full max-w-[var(--input-max-width)]">
        <InputBar
          starterMessage={DEMO_STARTER.message}
          models={models}
          model={model}
          onModelChange={setModel}
          onSend={handleSend}
        />
      </div>
    </main>
  )
}
