'use client'

import {
  Sidebar,
  SidebarChatItem,
  SidebarNav,
  SidebarNavItem,
  SidebarSection,
} from '@/components/chat'
import { useChatStore } from '@/lib/chat-store'
import { VISIBLE_SLIDES } from '@/lib/demo/slides'
import { cn } from '@/lib/utils'
import { FlaskConical, Folder, Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

const COLLAPSED_KEY = 'education-labs:sidebar-collapsed'

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

  const inDemoMode = pathname?.startsWith('/demo') ?? false

  return (
    <div className="flex h-dvh">
      <Sidebar userName={config.userName} collapsed={collapsed} onToggle={toggleSidebar}>
        {inDemoMode ? (
          // Presentation mode — hide app nav + recents, show the Prototype
          // entries (primary) and any visible slides below.
          <>
            <SidebarSection label="Prototype" className="grow-0">
              <SidebarChatItem href="/demo/v1">
                <span style={{ color: 'rgb(170, 169, 165)', marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>
                  v1.0
                </span>
                Live chat
              </SidebarChatItem>
              <SidebarChatItem href="/demo/4">
                <span style={{ color: 'rgb(170, 169, 165)', marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>
                  01
                </span>
                Demo Scenario 1
              </SidebarChatItem>
              <SidebarChatItem href="/demo/5">
                <span style={{ color: 'rgb(170, 169, 165)', marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>
                  02
                </span>
                Demo Scenario 2
              </SidebarChatItem>
            </SidebarSection>
            {VISIBLE_SLIDES.length > 0 && (
              <SidebarSection label="Slides" className="grow-0">
                {VISIBLE_SLIDES.map((s, i) => (
                  <SidebarChatItem key={s.id} href={`/demo/${s.id}`}>
                    <span style={{ color: 'rgb(170, 169, 165)', marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.title}
                  </SidebarChatItem>
                ))}
              </SidebarSection>
            )}
          </>
        ) : (
          <>
            <SidebarNav>
              <SidebarNavItem href="/new" icon={Plus} label="New chat" />
              <SidebarNavItem href="/projects" icon={Folder} label="Projects" />
              <SidebarNavItem href="/prompt-lab" icon={FlaskConical} label="Prompt Lab" />
            </SidebarNav>

            {chats.length > 0 && (
              <SidebarSection label="Recents">
                {chats.map((chat) => (
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
          </>
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
