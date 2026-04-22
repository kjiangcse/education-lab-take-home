'use client'

import { useRouter } from 'next/navigation'
import { Greeting, InputBar } from '@/components/chat'
import { useChatStore } from '@/lib/chat-store'
import { useLesson } from '@/lib/lesson-context'
import { DEMO_STARTER } from '@/lib/seed'

export default function NewChat() {
  const { config, models, model, setModel, createChat } = useChatStore()
  const { actions } = useLesson()
  const router = useRouter()

  const handleSend = (text: string) => {
    // Point the lesson studio at the starter's lesson so the right panel
    // lands on the content the demo is about — regardless of whether the
    // user used the starter verbatim or typed their own variation.
    actions.navigateToLesson(DEMO_STARTER.lesson_id)
    const id = createChat(text)
    router.push(`/chat/${id}`)
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
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
