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
    // Create the chat first, then seed ITS lesson state. `navigateToLesson`
    // mutates the currently-active chat; calling it before `createChat`
    // returns is a no-op (nothing is active yet), which would leave the new
    // chat on the course's default lesson — and any card the AI emits for a
    // block that only lives in the starter's lesson would render as
    // "Artifact unavailable". `openPanel` targets a specific chatId so the
    // new chat starts on the right lesson.
    const id = createChat(text)
    actions.openPanel({ chatId: id, lessonId: DEMO_STARTER.lesson_id })
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
