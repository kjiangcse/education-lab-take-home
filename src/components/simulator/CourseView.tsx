'use client'

import type { Course } from '@/lib/types/course'
import type { Lesson } from '@/lib/types/lesson'
import { formatBloomLabel, formatDuration } from '@/lib/types/course'

type Props = {
  course: Course
  lessons: Lesson[]
}

export function CourseView({ course, lessons }: Props) {
  return (
    <div style={{ padding: '24px 24px 96px' }}>
      {/* Course header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'rgb(20, 20, 19)', margin: '0 0 14px', lineHeight: 1.3 }}>
          {course.name}
        </h2>
        <div style={{ display: 'flex', gap: 24 }}>
          <Stat label="Lessons" value={`${lessons.length}`} />
          <Stat label="Duration" value={course.estimated_duration} />
          <Stat label="Level" value={course.target_level} />
        </div>
      </div>

      <Section label="About this course">
        <p style={paragraphStyle}>{course.about}</p>
      </Section>

      <Section label="Learning objectives">
        <p style={{ ...paragraphStyle, marginBottom: 6 }}>
          By the end of this course, you&apos;ll be able to:
        </p>
        <ul style={listStyle}>
          {course.learning_objectives.map((obj, i) => (
            <li key={i} style={listItemStyle}>{obj}</li>
          ))}
        </ul>
      </Section>

      <Section label="Prerequisites">
        <ul style={listStyle}>
          {course.prerequisites.map((p, i) => (
            <li key={i} style={listItemStyle}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section label="Who this course is for">
        <p style={paragraphStyle}>{course.audience}</p>
      </Section>

      {/* Lesson Structure — editorial display numeral */}
      <div style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
        color: 'rgb(115, 114, 108)',
        paddingBottom: 8,
        borderBottom: '1px solid rgba(31, 30, 29, 0.08)',
        marginBottom: 4,
        marginTop: 28,
      }}>
        Lesson Structure
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 6 }}>
        {lessons.map((lesson, i) => {
          const isLast = i === lessons.length - 1
          return (
            <div
              key={lesson.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr',
                columnGap: 18,
                padding: '18px 0',
                borderBottom: isLast ? 'none' : '1px solid rgba(31, 30, 29, 0.06)',
                alignItems: 'start',
              }}
            >
              <div style={{
                fontSize: 42, fontWeight: 300, lineHeight: 0.9,
                color: 'rgba(31, 30, 29, 0.25)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
                textAlign: 'right',
                paddingTop: 2,
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'rgb(20, 20, 19)', marginBottom: 4 }}>
                  {lesson.name}
                </div>
                <p style={{ fontSize: 12, color: 'rgb(100, 99, 95)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  {lesson.short_description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'rgb(115, 114, 108)' }}>{formatDuration(lesson.duration_minutes)}</span>
                  <span style={{ fontSize: 11, color: 'rgba(31, 30, 29, 0.2)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'rgb(115, 114, 108)' }}>{lesson.objectives.length} objectives</span>
                  <span style={{ fontSize: 11, color: 'rgba(31, 30, 29, 0.2)' }}>·</span>
                  <span style={{ fontSize: 11, color: 'rgb(115, 114, 108)' }}>{formatBloomLabel(lesson.blooms_profile)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'rgb(115, 114, 108)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgb(20, 20, 19)' }}>{value}</div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 13, fontWeight: 600, color: 'rgb(20, 20, 19)',
        margin: '0 0 8px', lineHeight: 1.3,
      }}>
        {label}
      </h3>
      {children}
    </div>
  )
}

const paragraphStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgb(61, 61, 58)',
  margin: 0,
  lineHeight: 1.6,
}

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  listStyleType: 'disc',
}

const listItemStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgb(61, 61, 58)',
  lineHeight: 1.6,
  marginBottom: 3,
}
