'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { WRITER_PERSONAS, type WriterPersona } from '@/lib/eval/writer-personas'
import { SAMPLE_COURSE, SAMPLE_LESSONS } from '@/lib/data/sample-course'
import { parseEditsFromText, applyEditsToLesson, stripEditBlocks } from '@/lib/edit-parser'
import { FlaskConical, Play, Loader2, Download, Upload, CheckCircle2, ChevronDown, ChevronRight, History, Trash2 } from 'lucide-react'
import type { Lesson, TextEdit } from '@/lib/types/lesson'
import { AssistantBody } from '@/components/chat/AssistantBody'
import { UserMessage } from '@/components/chat/UserMessage'
import { ClaudeMessage } from '@/components/chat/ClaudeMessage'
import { EDIT_GREEN } from '@/lib/format-edits'

// ── Types ───────────────────────────────────────────────────────────────

type LessonEdit = { lesson_id: string; field: string; original: string; replacement: string; reason: string; skill_id: string }
type Pattern = { pattern: string; label: string; description: string; severity: string }
type Audit = { content_design: string; blooms_objectives: string; writing_quality: string; overall: string; strongest: string; weakest: string }

type TurnState = {
  phase: 'reviewing' | 'persona' | 'scoring' | 'auditing' | 'done'
  reviewer_message?: string
  persona_response?: string
  edits: LessonEdit[]
  patterns: Pattern[]
  audit?: Audit
  score: number
}

type PersonaState = {
  status: 'pending' | 'running' | 'done' | 'error'
  turns: TurnState[]
  initialPatterns: Pattern[]
  initialAudit?: Audit
  initialScore: number
  finalAudit?: Audit
  finalScore: number
  comparative?: string
}

type SavedRun = { id: string; timestamp: string; label: string; data: Record<string, PersonaState> }

const STORAGE_KEY = 'prompt-lab:runs'
const MAX_TURNS = 3

function calcScore(patterns: Pattern[]): number {
  return patterns.reduce((s, p) => s + (p.severity === 'blocking' ? 3 : p.severity === 'significant' ? 2 : 1), 0)
}

// ── Main ────────────────────────────────────────────────────────────────

export default function PromptLab() {
  const [personas, setPersonas] = useState<Record<string, PersonaState>>({})
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { try { setSavedRuns(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /* */ } }, [])

  const updatePersona = useCallback((id: string, patch: Partial<PersonaState>) => {
    setPersonas(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  const updateTurn = useCallback((personaId: string, turnIdx: number, patch: Partial<TurnState>) => {
    setPersonas(prev => {
      const p = prev[personaId]
      if (!p) return prev
      const turns = [...p.turns]
      if (!turns[turnIdx]) turns[turnIdx] = { phase: 'reviewing', edits: [], patterns: [], score: 0 }
      turns[turnIdx] = { ...turns[turnIdx], ...patch }
      return { ...prev, [personaId]: { ...p, turns } }
    })
  }, [])

  const callTurn = async (action: string, body: Record<string, unknown>) => {
    const res = await fetch('/api/eval/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    })
    return res.json()
  }

  const runPersona = useCallback(async (persona: WriterPersona) => {
    const lesson = SAMPLE_LESSONS.find(l => l.id === persona.target_lesson_id)
    if (!lesson) return

    const initial: PersonaState = { status: 'running', turns: [], initialPatterns: [], initialScore: 0, finalScore: 0 }
    updatePersona(persona.id, initial)

    let currentLesson: Lesson = lesson
    const history: { role: 'user' | 'assistant'; content: string }[] = []

    try {
      // Initial score + audit
      const [scoreRes, auditRes] = await Promise.all([
        callTurn('score', { lesson: currentLesson, course: SAMPLE_COURSE }),
        callTurn('audit', { lesson: currentLesson, course: SAMPLE_COURSE, context: `Original draft by "${persona.name}"` }),
      ])
      const initialScore = calcScore(scoreRes.patterns || [])
      updatePersona(persona.id, { initialPatterns: scoreRes.patterns || [], initialScore, initialAudit: auditRes })

      for (let t = 0; t < MAX_TURNS; t++) {
        const turnIdx = t

        // Add new turn — use functional update to avoid stale closure
        await new Promise<void>(resolve => {
          setPersonas(prev => {
            const p = prev[persona.id]
            const turns = [...(p?.turns || [])]
            turns[turnIdx] = { phase: 'reviewing', edits: [], patterns: [], score: 0 }
            setTimeout(resolve, 0) // let React render before continuing
            return { ...prev, [persona.id]: { ...p, turns } }
          })
        })

        // Step 1: Review
        const reviewRes = await callTurn('review', { lesson: currentLesson, course: SAMPLE_COURSE, history })
        const reviewMsg = reviewRes.message || ''
        history.push({ role: 'user', content: t === 0 ? 'Review this lesson.' : 'Continue reviewing.' })
        history.push({ role: 'assistant', content: reviewMsg })
        updateTurn(persona.id, turnIdx, { reviewer_message: reviewMsg })

        // Parse + apply edits
        const edits = parseEditsFromText(reviewMsg)
        if (edits.length > 0) {
          currentLesson = applyEditsToLesson(currentLesson, edits)
        }
        updateTurn(persona.id, turnIdx, { edits, phase: 'persona' })

        // Step 2: Persona response
        const personaRes = await callTurn('persona', { persona_description: persona.description, reviewer_message: reviewMsg, persona_behavior: persona.behavior })
        const personaMsg = personaRes.message || ''
        history.push({ role: 'user', content: personaMsg })
        updateTurn(persona.id, turnIdx, { persona_response: personaMsg, phase: 'scoring' })

        // Steps 3 & 4: Score + Audit — fire in background so the next turn's
        // conversation can start immediately. Score/audit don't feed into the
        // next turn's prompt, so blocking on them was pure UI drag.
        const lessonSnapshot = currentLesson
        const contextLabel = `After turn ${turnIdx + 1}`
        void Promise.all([
          callTurn('score', { lesson: lessonSnapshot, course: SAMPLE_COURSE }),
          callTurn('audit', { lesson: lessonSnapshot, course: SAMPLE_COURSE, context: contextLabel }),
        ])
          .then(([scoreRes2, auditRes2]) => {
            const turnScore = calcScore(scoreRes2.patterns || [])
            updateTurn(persona.id, turnIdx, {
              patterns: scoreRes2.patterns || [],
              score: turnScore,
              audit: auditRes2,
              phase: 'done',
            })
          })
          .catch(() => {
            // Mark done anyway so the UI doesn't hang on this turn's eval slot.
            updateTurn(persona.id, turnIdx, { phase: 'done' })
          })
      }

      // Final
      const [finalScoreRes, finalAuditRes] = await Promise.all([
        callTurn('score', { lesson: currentLesson, course: SAMPLE_COURSE }),
        callTurn('audit', { lesson: currentLesson, course: SAMPLE_COURSE, context: 'Final state' }),
      ])
      updatePersona(persona.id, {
        status: 'done',
        finalScore: calcScore(finalScoreRes.patterns || []),
        finalAudit: finalAuditRes,
      })
    } catch {
      updatePersona(persona.id, { status: 'error' })
    }
  }, [updatePersona, updateTurn])

  const runAll = useCallback(() => {
    setRunning(true)
    setPersonas({})
    Promise.allSettled(WRITER_PERSONAS.map(p => runPersona(p))).then(() => {
      setRunning(false)
      // Auto-save
      setTimeout(() => {
        setPersonas(current => {
          const run: SavedRun = { id: `run-${Date.now()}`, timestamp: new Date().toISOString(), label: `Run ${new Date().toLocaleString()}`, data: current }
          setSavedRuns(prev => { const next = [run, ...prev].slice(0, 20); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next })
          fetch('/api/eval/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timestamp: run.timestamp, results: current }) }).catch(() => {})
          return current
        })
      }, 500)
    })
  }, [runPersona])

  const download = () => {
    const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), results: personas }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sim-${new Date().toISOString().slice(0, 16)}.json`; a.click()
  }

  const upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target?.result as string); if (d.results) setPersonas(d.results) } catch {} }
    reader.readAsText(file); e.target.value = ''
  }

  const hasResults = Object.keys(personas).length > 0

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(31, 30, 29, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FlaskConical size={20} style={{ color: 'rgb(217, 119, 87)' }} />
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Prompt Lab</h1>
            <p style={{ fontSize: 12, color: 'rgb(115, 114, 108)', margin: 0 }}>Live multi-turn simulation</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input ref={fileInputRef} type="file" accept=".json" onChange={upload} style={{ display: 'none' }} />
          <Btn onClick={() => fileInputRef.current?.click()}><Upload size={13} /> Import</Btn>
          {savedRuns.length > 0 && <Btn onClick={() => setShowHistory(!showHistory)} active={showHistory}><History size={13} /> {savedRuns.length}</Btn>}
          {hasResults && <Btn onClick={download}><Download size={13} /> Export</Btn>}
          <button type="button" onClick={runAll} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: running ? 'rgb(200,199,195)' : 'rgb(217,119,87)', color: 'white', fontSize: 12, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer' }}>
            {running ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Running</> : <><Play size={13} /> Run All</>}
          </button>
        </div>
      </div>

      {/* History */}
      {showHistory && (
        <div style={{ padding: '10px 32px', borderBottom: '1px solid rgba(31,30,29,0.06)', background: 'rgba(31,30,29,0.015)', maxHeight: 160, overflowY: 'auto', flexShrink: 0 }}>
          {savedRuns.map(run => (
            <div key={run.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 5, marginBottom: 3, border: '1px solid rgba(31,30,29,0.05)', background: 'white' }}>
              <span style={{ fontSize: 12 }}>{run.label}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => { setPersonas(run.data); setShowHistory(false) }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(31,30,29,0.12)', background: 'white', cursor: 'pointer' }}>Load</button>
                <button type="button" onClick={() => setSavedRuns(p => { const n = p.filter(r => r.id !== run.id); localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n })} style={{ fontSize: 10, padding: '2px 4px', border: 'none', background: 'none', cursor: 'pointer', color: 'rgb(200,199,195)' }}><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rows */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 32px' }}>
        {!hasResults && !running ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', color: 'rgb(115,114,108)' }}>
            <FlaskConical size={36} style={{ opacity: 0.3, marginBottom: 14 }} />
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>Multi-Turn Simulation</p>
            <p style={{ fontSize: 12, marginBottom: 20, maxWidth: 400, textAlign: 'center' }}>Watch Claude review lessons, personas push back, edits applied live. Each turn scores and audits.</p>
            <button type="button" onClick={runAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'rgb(217,119,87)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Play size={15} /> Run All Personas</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {WRITER_PERSONAS.map(persona => {
              const p = personas[persona.id]
              const isExp = expanded === persona.id
              const lesson = SAMPLE_LESSONS.find(l => l.id === persona.target_lesson_id)

              return (
                <div key={persona.id} style={{ border: '1px solid rgba(31,30,29,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Row header — always visible */}
                  <div onClick={() => setExpanded(isExp ? null : persona.id)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExp ? 'rgba(31,30,29,0.02)' : 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusDot status={p?.status || 'pending'} />
                      {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{persona.name}</div>
                        <div style={{ fontSize: 11, color: 'rgb(115,114,108)' }}>{lesson?.name}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'rgb(115,114,108)' }}>
                      {p && p.turns.length > 0 && <span>{p.turns.filter(t => t.phase === 'done').length}/{MAX_TURNS} turns</span>}
                      {p && p.turns.length > 0 && <span>{p.turns.reduce((s, t) => s + t.edits.length, 0)} edits</span>}
                      {p?.status === 'done' && <span style={{ fontWeight: 600, color: p.finalScore < p.initialScore ? 'rgb(16,185,129)' : 'rgb(153,27,27)' }}>{p.initialScore}→{p.finalScore}</span>}
                      {p?.status === 'running' && <PhaseLabel turns={p.turns} />}
                    </div>
                  </div>

                  {/* Live turns — visible when expanded or running WITH content */}
                  {(isExp || p?.status === 'running') && p && (p.turns.length > 0 || p.initialAudit) && (
                    <div style={{ borderTop: '1px solid rgba(31,30,29,0.06)' }}>
                      {/* Audits side by side */}
                      {p.initialAudit && p.finalAudit && p.status === 'done' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(31,30,29,0.06)' }}>
                          <AuditBox label="Before" audit={p.initialAudit} score={p.initialScore} color="rgb(153,27,27)" />
                          <AuditBox label="After" audit={p.finalAudit} score={p.finalScore} color="rgb(21,128,61)" borderLeft />
                        </div>
                      )}

                      {/* Per-turn timeline — scrolls horizontally so the turns read left-to-right. */}
                      <div
                        style={{
                          padding: '10px 16px',
                          display: 'flex',
                          gap: 12,
                          overflowX: 'auto',
                          scrollSnapType: 'x proximity',
                          // Slight vertical padding keeps the card shadows from being clipped by the scrollbar lane.
                          paddingBottom: 14,
                        }}
                      >
                        {p.turns.map((turn, ti) => {
                          const preTurnLesson = lesson ? computePreTurnLesson(lesson, p.turns.slice(0, ti)) : undefined
                          return (
                            <div
                              key={ti}
                              style={{
                                flexShrink: 0,
                                width: 560,
                                scrollSnapAlign: 'start',
                                border: '1px solid rgba(31,30,29,0.06)',
                                borderRadius: 6,
                                overflow: 'hidden',
                                background: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                alignSelf: 'flex-start',
                              }}
                            >
                              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, background: turn.phase === 'done' ? 'white' : 'rgba(217,119,87,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {turn.phase === 'done' ? <CheckCircle2 size={12} style={{ color: 'rgb(16,185,129)' }} /> : <Loader2 size={12} style={{ color: 'rgb(217,119,87)', animation: 'spin 1s linear infinite' }} />}
                                  <span style={{ fontWeight: 600 }}>Turn {ti + 1}</span>
                                  <span style={{ fontSize: 10, color: 'rgb(115,114,108)', textTransform: 'uppercase' }}>{turn.phase}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'rgb(115,114,108)' }}>
                                  {turn.edits.length > 0 && <span>{turn.edits.length} edits</span>}
                                  {turn.patterns.length > 0 && <span>{turn.patterns.length} patterns</span>}
                                  {turn.phase === 'done' && <span>score: {turn.score}</span>}
                                </div>
                              </div>

                              {/* Turn body — chat-style bubbles + inline edit artifacts, then evaluation strip */}
                              {(turn.reviewer_message || turn.persona_response) && preTurnLesson && (
                                <div style={{ borderTop: '1px solid rgba(31,30,29,0.04)' }}>
                                  <TurnConversation turn={turn} preTurnLesson={preTurnLesson} />
                                  <TurnEvaluation turn={turn} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}

// ── Components ──────────────────────────────────────────────────────────

function Btn({ onClick, children, active }: { onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, border: `1px solid ${active ? 'rgb(217,119,87)' : 'rgba(31,30,29,0.12)'}`, background: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: active ? 'rgb(217,119,87)' : 'rgb(61,61,58)' }}>{children}</button>
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'done' ? 'rgb(16,185,129)' : status === 'running' ? 'rgb(217,119,87)' : status === 'error' ? 'rgb(153,27,27)' : 'rgb(200,199,195)'
  if (status === 'running') {
    return (
      <div style={{ position: 'relative', width: 14, height: 14, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(217,119,87,0.2)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: color, animation: 'spin 0.9s linear infinite' }} />
      </div>
    )
  }
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
}

function PhaseLabel({ turns }: { turns: TurnState[] }) {
  // Under the async eval flow, multiple turns can be in-flight at once
  // (turn 1 still scoring in the background while turn 2 is reviewing).
  // Prefer showing the latest turn's conversation phase (reviewing / persona)
  // since that's what the user is actively watching unfold.
  for (let i = turns.length - 1; i >= 0; i--) {
    const phase = turns[i].phase
    if (phase === 'reviewing' || phase === 'persona') {
      return <span style={{ fontSize: 10, color: 'rgb(217,119,87)', fontWeight: 500, textTransform: 'uppercase' }}>Turn {i + 1}: {phase}...</span>
    }
  }
  // No active conversation — surface pending background evaluations instead
  const pending = turns.filter(t => t.phase !== 'done').length
  if (pending > 0) return <span style={{ fontSize: 10, color: 'rgb(217,119,87)', fontWeight: 500, textTransform: 'uppercase' }}>Evaluating…</span>
  return null
}

function AuditBox({ label, audit, score, color, borderLeft }: { label: string; audit: Audit; score: number; color: string; borderLeft?: boolean }) {
  return (
    <div style={{ padding: '10px 16px', ...(borderLeft ? { borderLeft: '1px solid rgba(31,30,29,0.06)' } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
        <span style={{ fontSize: 11, color: 'rgb(115,114,108)' }}>Score: {score}</span>
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.5, color: 'rgb(41,41,38)' }}>
        <p style={{ margin: '0 0 4px' }}><strong>Overall:</strong> {audit.overall}</p>
        <p style={{ margin: '0 0 4px' }}><strong>Strongest:</strong> {audit.strongest}</p>
        <p style={{ margin: 0 }}><strong>Weakest:</strong> {audit.weakest}</p>
      </div>
    </div>
  )
}

// ── Turn rendering: chat-style bubbles + inline artifacts ──────────────

/**
 * Given a base lesson and the turns that came before this one, replay their
 * edits to get the lesson state AT THE START of this turn. Claude's edits in
 * the current turn are proposed against this snapshot.
 */
function computePreTurnLesson(baseLesson: Lesson, priorTurns: TurnState[]): Lesson {
  const priorEdits = priorTurns.flatMap(t => t.edits)
  return priorEdits.length > 0 ? applyEditsToLesson(baseLesson, priorEdits) : baseLesson
}

/**
 * Inject this turn's edits as `feedback.edits` on the block or item whose id
 * matches the edit path, so InlineCard renders them as diff artifacts inline
 * when the marker references that id.
 */
function injectEditsAsFeedback(lesson: Lesson, edits: LessonEdit[]): Lesson {
  if (edits.length === 0) return lesson
  const patched: Lesson = JSON.parse(JSON.stringify(lesson))
  for (const edit of edits) {
    const idMatch = edit.field.match(/^([a-z0-9-]+)\.(label|content|heading)$/)
    if (!idMatch) continue
    const id = idMatch[1]
    const textEdit: TextEdit = { original: edit.original, replacement: edit.replacement, reason: edit.reason }
    for (const block of patched.blocks) {
      if (block.kind === 'richtext' && block.id === id) {
        block.feedback = {
          edits: [...(block.feedback?.edits ?? []), textEdit],
          explanation: block.feedback?.explanation ?? '',
        }
        break
      }
      if (block.kind === 'dropdowns') {
        const item = block.items.find((d) => d.id === id)
        if (item) {
          item.feedback = {
            edits: [...(item.feedback?.edits ?? []), textEdit],
            explanation: item.feedback?.explanation ?? '',
          }
          break
        }
      }
      if (block.kind === 'tabs') {
        const item = block.items.find((t) => t.id === id)
        if (item) {
          item.feedback = {
            edits: [...(item.feedback?.edits ?? []), textEdit],
            explanation: item.feedback?.explanation ?? '',
          }
          break
        }
      }
    }
  }
  return patched
}

/**
 * Renders one turn as a chat-thread-style exchange:
 * reviewer message (Claude bubble + inline artifacts), edit cards, persona response (user bubble).
 * Any `{{{bloom:…}}}`, `{{{card:…}}}` markers in the reviewer message render as artifacts
 * against the injected-feedback snapshot so diffs show up visually.
 */
function TurnConversation({ turn, preTurnLesson }: { turn: TurnState; preTurnLesson: Lesson }) {
  const reviewerText = turn.reviewer_message ? stripEditBlocks(turn.reviewer_message) : ''
  const previewLesson = injectEditsAsFeedback(preTurnLesson, turn.edits)
  return (
    <div style={{ padding: '4px 12px 12px' }}>
      {reviewerText && (
        <ClaudeMessage>
          <AssistantBody text={reviewerText} lesson={previewLesson} />
        </ClaudeMessage>
      )}
      {turn.edits.length > 0 && (
        <div style={{ padding: '4px 16px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'rgb(19,115,82)', marginBottom: 6 }}>
            Edits applied ({turn.edits.length})
          </div>
          {turn.edits.map((e, i) => <EditCard key={i} edit={e} />)}
        </div>
      )}
      {turn.edits.length === 0 && turn.reviewer_message && turn.phase !== 'reviewing' && (
        <div style={{ padding: '0 16px', fontSize: 11, color: 'rgb(170,169,165)', fontStyle: 'italic' }}>
          No structured edits proposed this turn.
        </div>
      )}
      {turn.persona_response && (
        <UserMessage text={turn.persona_response} />
      )}
    </div>
  )
}

/** Compact diff card for a single LessonEdit — works for any field type
 *  (objectives, name, <id>.content, <id>.heading, etc.). Uses the
 *  same strikethrough-old + green-new visual as the lesson studio feedback overlay. */
function EditCard({ edit }: { edit: LessonEdit }) {
  return (
    <div style={{
      margin: '6px 0',
      padding: '10px 12px',
      borderRadius: 8,
      border: '1px solid rgba(19, 115, 82, 0.18)',
      background: 'rgba(19, 115, 82, 0.03)',
      fontSize: 12.5,
      lineHeight: 1.5,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px',
        color: 'rgb(19,115,82)', marginBottom: 6,
        fontFamily: 'var(--font-geist-mono), monospace',
      }}>
        {edit.field}
      </div>
      <div style={{ color: 'rgb(41,41,38)' }}>
        <span style={{ textDecoration: 'line-through', color: EDIT_GREEN, opacity: 0.55 }}>{edit.original}</span>
        {' '}
        <span style={{ color: EDIT_GREEN, fontWeight: 500 }}>{edit.replacement}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgb(115,114,108)', marginTop: 6 }}>
        {edit.reason} <span style={{ opacity: 0.65 }}>({edit.skill_id})</span>
      </div>
    </div>
  )
}

/** Evaluation strip rendered below a turn's conversation — patterns + audit. */
function TurnEvaluation({ turn }: { turn: TurnState }) {
  const hasAnything = turn.patterns.length > 0 || turn.audit || turn.phase !== 'done'
  if (!hasAnything) return null
  return (
    <div style={{ padding: '10px 16px', background: 'rgba(31,30,29,0.015)', borderTop: '1px solid rgba(31,30,29,0.04)', fontSize: 11, lineHeight: 1.5 }}>
      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'rgb(115,114,108)', marginBottom: 6 }}>Evaluation</div>
      {turn.patterns.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: 'rgb(61,61,58)', marginBottom: 4 }}>Patterns found ({turn.patterns.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {turn.patterns.map((pat, pi) => (
              <div key={pi} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: pat.severity === 'blocking' ? 'rgb(153,27,27)' : pat.severity === 'significant' ? 'rgb(217,119,87)' : 'rgb(115,114,108)', flexShrink: 0, width: 55 }}>{pat.severity}</span>
                <span><strong>{pat.label}</strong> — {pat.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {turn.audit && (
        <div>
          <div style={{ fontWeight: 600, color: 'rgb(61,61,58)', marginBottom: 4 }}>Audit (score: {turn.score})</div>
          <div style={{ color: 'rgb(61,61,58)' }}>
            <p style={{ margin: '0 0 3px' }}><strong>Overall:</strong> {turn.audit.overall}</p>
            <p style={{ margin: '0 0 3px' }}><strong>Content design:</strong> {turn.audit.content_design}</p>
            <p style={{ margin: '0 0 3px' }}><strong>Bloom&apos;s:</strong> {turn.audit.blooms_objectives}</p>
            <p style={{ margin: '0 0 3px' }}><strong>Writing:</strong> {turn.audit.writing_quality}</p>
            <p style={{ margin: '0 0 3px' }}><strong>Strongest:</strong> {turn.audit.strongest}</p>
            <p style={{ margin: 0 }}><strong>Weakest:</strong> {turn.audit.weakest}</p>
          </div>
        </div>
      )}
      {!turn.audit && turn.phase !== 'done' && (
        <div style={{ color: 'rgb(170,169,165)', fontStyle: 'italic' }}>Awaiting audit…</div>
      )}
    </div>
  )
}
