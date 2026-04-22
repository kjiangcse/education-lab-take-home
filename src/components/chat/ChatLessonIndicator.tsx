'use client'

import { BookOpen, FileText } from 'lucide-react'
import { useLesson } from '@/lib/lesson-context'

export function ChatLessonIndicator() {
  const { course, lesson, view } = useLesson()

  const isCourse = view === 'course'
  const label = isCourse ? course.name : lesson.name
  const Icon = isCourse ? BookOpen : FileText

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
      <div
        key={`${view}-${label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          backgroundColor: 'transparent',
          border: '1px solid rgba(31, 30, 29, 0.1)',
          fontSize: 11,
          color: 'rgb(61, 61, 58)',
          animation: 'indicatorFade 220ms ease-out',
        }}
      >
        <Icon size={11} style={{ color: 'rgb(115, 114, 108)' }} />
        <span style={{ color: 'rgb(115, 114, 108)' }}>Currently discussing:</span>
        <span style={{ fontWeight: 500 }}>{label}</span>
      </div>

      <style>{`
        @keyframes indicatorFade {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
