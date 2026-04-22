/**
 * Per-chat Bloom's distribution configs for the `{{{bloom-coverage}}}`
 * inline marker. Keyed by demo chat id — when a seeded assistant message
 * embeds the marker, AssistantBody looks up the right config here so the
 * widget renders inline with the surrounding prose instead of being pinned
 * to the bottom of the chat.
 */

import type { BloomArtifactData } from '@/lib/types/blooms'

export const BLOOM_COVERAGE_BY_CHAT: Record<string, BloomArtifactData> = {
  'demo-skills': {
    title: 'Lesson 3: Custom Claude Tools — From Prompt to Product',
    level: 'remember',
    notes: {
      remember: 'Every section names specific API methods, install commands, and config fields. Strong foundation.',
      understand: 'System prompts, structured outputs, and tool use each get a paragraph of explanation.',
      apply: 'Four follow-along steps. Learners reproduce the tool but never design one.',
      analyze: 'Missing. Objectives promise decision-making but no section asks learners to compare or decompose.',
      evaluate: 'Missing. No criteria for learners to judge whether their tool actually solved the problem.',
      create: 'Not required by stated objectives.',
    },
    summary:
      'PATTERN: Feature tour masquerading as a lesson. Content plateaus at Remember and Understand; the objectives call for Apply-tier decision-making that the content never scaffolds.',
    defaultView: 'coverage',
  },
  // Post-edit variant — rendered by {{{bloom-coverage:after}}} in turn 3.
  // The distribution is computed live from the lesson snapshot attached to
  // the message, so after sections 1–3 flip to Apply, the bars reflect the
  // new shape without a hardcoded copy here.
  'demo-skills:after': {
    title: 'Lesson 3: Custom Claude Tools — From Prompt to Product',
    level: 'apply',
    notes: {
      remember: 'Step tabs and the references section still recall steps. They\'re the next target.',
      understand: 'Build Flow still explains the sequence without asking the learner to make choices.',
      apply: 'Opener, system prompt, and structured outputs each now force a design decision before code.',
      analyze: 'Not yet — would need sections asking the learner to compare prompt drafts or output shapes.',
      evaluate: 'Not yet — a judgment rubric for whether the tool actually solves the problem would land here.',
      create: 'Not required by the stated objectives.',
    },
    summary:
      'The spine of the lesson — opener, system prompt, structured outputs — has moved to Apply. Step tabs and references still sit at Remember; that\'s the right next pass.',
    defaultView: 'coverage',
  },
}
