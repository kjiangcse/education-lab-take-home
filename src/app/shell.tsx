'use client'

import {
  Sidebar,
  SidebarChatItem,
  SidebarNav,
  SidebarNavItem,
  SidebarSection,
  WelcomeDialog,
} from '@/components/chat'
import { useChatStore } from '@/lib/chat-store'
import { cn } from '@/lib/utils'
import { FlaskConical, Folder, Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

const COLLAPSED_KEY = 'education-labs:sidebar-collapsed'

/** Chats that live in the Demo section. Kept in one place so Recents can
 *  filter them out to avoid duplicate entries. */
const DEMO_ENTRIES: { label: string; href: string }[] = [
  { label: 'Artifact Library', href: '/chat/demo-artifacts' },
  { label: 'Scenario 1: Trim to learner tasks', href: '/chat/demo-structure' },
  { label: "Scenario 2: Lift to Apply on Bloom's", href: '/chat/demo-skills' },
  { label: 'Scenario 3: Course-level future state', href: '/chat/demo-closing' },
]

const DEMO_SECTION_CHAT_IDS = new Set(
  DEMO_ENTRIES
    .map((e) => e.href.match(/^\/chat\/(.+)$/)?.[1])
    .filter((id): id is string => Boolean(id)),
)

export function AppShell({ children }: { children: ReactNode }) {
  const { config, chats, deleteChat } = useChatStore()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1')
  }, [])

  // The presenter pop-out opens in its own window and shouldn't inherit the
  // app shell (sidebar, margins). Render children bare.
  if (pathname === '/demo/presenter') {
    return <>{children}</>
  }

  const toggleSidebar = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1')
      return !c
    })
  }

  const handleDelete = (chatId: string) => {
    deleteChat(chatId)
    if (pathname === `/chat/${chatId}`) router.push('/new')
  }

  const recents = chats.filter((c) => !DEMO_SECTION_CHAT_IDS.has(c.id))

  // Show the intro on the home route only. Dismissal is in-memory, so a
  // refresh brings it back — but navigating to a demo scenario doesn't
  // re-trigger it mid-presentation.
  const showWelcome = pathname === '/new'

  return (
    <div className="flex h-dvh">
      {showWelcome && <WelcomeDialog />}
      <Sidebar userName={config.userName} collapsed={collapsed} onToggle={toggleSidebar}>
        <SidebarNav>
          <SidebarNavItem href="/new" icon={Plus} label="New chat" />
          <SidebarNavItem href="/projects" icon={Folder} label="Projects" />
          <SidebarNavItem href="/prompt-lab" icon={FlaskConical} label="Prompt Lab" />
        </SidebarNav>

        <SidebarSection label="Demo" className="grow-0">
          {DEMO_ENTRIES.map((e) => (
            <SidebarChatItem key={e.href} href={e.href}>
              {e.label}
            </SidebarChatItem>
          ))}
        </SidebarSection>

        {recents.length > 0 && (
          <SidebarSection label="Recents">
            {recents.map((chat) => (
              <SidebarChatItem
                key={chat.id}
                href={`/chat/${chat.id}`}
                onDelete={() => handleDelete(chat.id)}
              >
                {chat.title}
              </SidebarChatItem>
            ))}
          </SidebarSection>
        )}
      </Sidebar>

      <div
        className={cn(
          'relative flex h-dvh flex-1 flex-col transition-[margin] duration-200',
          collapsed ? 'ml-[var(--sidebar-width-collapsed)]' : 'ml-[var(--sidebar-width)]',
        )}
      >
        {children}
      </div>
    </div>
  )
}
