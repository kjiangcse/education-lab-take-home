/**
 * Per-chat alignment-matrix configs for the `{{{alignment}}}` inline marker.
 * Keyed by chat id — when a seeded assistant message embeds the marker,
 * AssistantBody resolves the right config here.
 *
 * Rows mirror the objective list on the lesson being reviewed; `stated` is the
 * tier the objective's verb implies, `achieved` is the tier the matching
 * content actually demands (omit when no matching activity exists).
 */

import type { AlignmentRow } from '@/components/chat/AlignmentMatrix'

export type AlignmentConfig = {
  title?: string
  rows: AlignmentRow[]
  summary?: string
}

export const ALIGNMENT_BY_CHAT: Record<string, AlignmentConfig> = {
  'demo-artifacts': {
    title: 'Lesson 2 — Objective / content alignment',
    rows: [
      {
        objective: 'Identify the symptoms of a requirements-doc-driven tool',
        stated: 'remember',
        achieved: 'remember',
      },
      {
        objective: 'Apply the shadow / frame / prototype framework to a real workflow',
        stated: 'apply',
        achieved: 'understand',
      },
      {
        objective: 'Analyze which step of the framework most changes for a different team',
        stated: 'analyze',
        achieved: 'remember',
      },
      {
        objective: 'Evaluate which prototype is worth pursuing against your riskiest assumption',
        stated: 'evaluate',
      },
    ],
    summary:
      'Two objectives under-deliver and one has no matching activity. The framework section explains the steps but never asks the learner to apply, compare, or decide — the gap this lesson needs to close.',
  },
  // Scenario 2 (demo-skills, Lesson 3). The alignment matrix is a stronger
  // opener than bloom-coverage here because the narrative is literally
  // objective-vs-content: the objectives promise Apply-tier verbs (write,
  // use, implement, deploy) while the spine reads like Remember-tier
  // documentation. One row per stated objective surfaces that mismatch
  // per-item, which the coverage widget can only hint at in aggregate.
  'demo-skills': {
    title: 'Lesson 3 — Objective / content alignment',
    rows: [
      {
        objective: 'Set up a Claude API project with authentication',
        stated: 'remember',
        achieved: 'remember',
      },
      {
        objective: 'Write a system prompt for a custom tool',
        stated: 'apply',
        achieved: 'understand',
      },
      {
        objective: 'Use structured outputs to get JSON from Claude',
        stated: 'apply',
        achieved: 'remember',
      },
      {
        objective: 'Implement tool use to let Claude call external functions',
        stated: 'apply',
        achieved: 'remember',
      },
      {
        objective: 'Deploy a basic Claude-powered tool',
        stated: 'apply',
        achieved: 'remember',
      },
    ],
    summary:
      'Four of five objectives promise Apply-tier work (write, use, implement, deploy) but the content lands at Remember — step-by-step recipes, not design decisions. Only the setup objective, which is genuinely Remember-tier, lines up.',
  },
}
