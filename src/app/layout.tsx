import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ChatProvider } from '@/lib/chat-store'
import { LessonProvider } from '@/lib/lesson-context'
import { AppShell } from './shell'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Claude Takehome',
  description: 'A Claude.ai-style chat shell',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <LessonProvider>
          <ChatProvider>
            <AppShell>{children}</AppShell>
          </ChatProvider>
        </LessonProvider>
      </body>
    </html>
  )
}
