/**
 * Named failure patterns for lesson and course-level diagnosis.
 *
 * These are reliably wrong across almost every context — unlike ideal
 * distributions, which vary by lesson. The approach: eliminate what we
 * know is broken, don't prescribe what "ideal" looks like.
 *
 * Pedagogically, anti-patterns teach faster than positive examples.
 * A specialist who learns "this pattern means all telling and no
 * practice" acquires a durable diagnostic skill. A specialist who
 * learns "aim for 45% Apply" acquires a number they'll forget.
 */

// ── Lesson-level patterns ───────────────────────────────────────────────

export const LESSON_PATTERNS = {
  ground_floor: {
    id: 'ground_floor',
    label: 'Ground-Floor Lesson',
    description: 'Distribution clusters at Remember and Understand (60%+ combined), under 20% at Apply+. The lesson teaches what a thing is without teaching how to use it.',
    diagnostic: 'Check the objectives. If they include "implement," "apply," "build," "configure" — the lesson isn\'t serving them. The specialist probably wrote the content before committing to the objective.',
  },
  stated_actual_mismatch: {
    id: 'stated_actual_mismatch',
    label: 'Stated/Actual Mismatch',
    description: 'Stated objective asks for one tier; content delivers at a lower tier. The objective promises something the content doesn\'t build.',
    diagnostic: 'Look at the Apply-tier sections specifically. Is the learner doing something, or being shown something? "Here\'s how it works, notice these patterns" is Understand. "Given this app, configure it" is Apply.',
  },
  plateau: {
    id: 'plateau',
    label: 'Plateau',
    description: 'Significant coverage at one tier, then an abrupt drop to 0% above. The lesson builds scaffolding up to a level, then stops without taking the learner through the door.',
    diagnostic: 'Does the lesson actually end or just stop? A lesson ending at Understand should explicitly transition: "In the next lesson, you\'ll apply this." A lesson that just stops is abandoned.',
  },
  stacked_scaffolding: {
    id: 'stacked_scaffolding',
    label: 'Stacked Scaffolding',
    description: 'High percentages at Remember AND Understand AND Apply. Looks thorough but the specialist kept all the scaffolding in place when Apply-tier content needs less Remember, not more.',
    diagnostic: 'Can any Remember or Understand sections move to a reference sidebar or glossary? Dense foundational content in an Apply lesson is usually padding.',
  },
  over_reach: {
    id: 'over_reach',
    label: 'Over-Reach',
    description: 'Content at tiers above the stated objective. An Understand-tier lesson with Evaluate tasks embedded without scaffolding.',
    diagnostic: 'Does the higher-tier content have its own scaffolding? An embedded Evaluate task needs Analyze work to lean on. If it doesn\'t, learners will do the task badly or skip it.',
  },
  ghost_tier: {
    id: 'ghost_tier',
    label: 'Ghost Tier',
    description: 'A tier appears in the content but is never practiced. The tier is demonstrated (passive) rather than exercised (active). Demonstration is Understand regardless of complexity.',
    diagnostic: 'Is each tier\'s coverage active (learner does) or passive (learner watches)? Recount with passive content redistributed to Understand.',
  },
  information_dump: {
    id: 'information_dump',
    label: 'Information Dump',
    description: 'Everything the learner needs is presented at once with no sequencing. The lesson reads like a reference doc.',
    diagnostic: 'Is the content organized by topic or by learning progression? A lesson that lists six methods when only two are relevant is cataloging, not teaching.',
  },
  wall_of_text: {
    id: 'wall_of_text',
    label: 'Wall of Text',
    description: 'Structurally correct content in one unbroken block. No headers, no callouts, no breathing room.',
    diagnostic: 'Can the learner scan this section in 5 seconds and know what it covers? If not, it needs structural breaks.',
  },
  no_assessment: {
    id: 'no_assessment',
    label: 'No Assessment Hook',
    description: 'The lesson ends without any way for the learner or content team to know whether learning happened.',
    diagnostic: 'Could you tell whether a learner who "completed" this lesson can actually do the thing? If completion is the only signal, learning is unmeasured.',
  },
} as const

// ── Course-level patterns ───────────────────────────────────────────────

export const COURSE_PATTERNS = {
  flat_course: {
    id: 'flat_course',
    label: 'Flat Course',
    description: 'Every lesson plateaus at the same tier. Learners finish familiar with a wider set of concepts but no more capable than after lesson one.',
    diagnostic: 'Can the course articulate what learners can DO at the end that they couldn\'t at the beginning? If the answer is "know more," the course is flat.',
  },
  collapsed_arc: {
    id: 'collapsed_arc',
    label: 'Collapsed Arc',
    description: 'The course starts at the right tier but never climbs. Each lesson was written in isolation without mapping to course-level progression.',
    diagnostic: 'Look at the tier labels across lessons. If they\'re all the same, the course has no arc even if individual lessons are fine.',
  },
  late_spike: {
    id: 'late_spike',
    label: 'Late Spike',
    description: 'The course plods along at Understand/Apply, then the last lesson jumps to Evaluate or Create without preparation.',
    diagnostic: 'Is the final lesson\'s higher-tier work supported by earlier lessons? Or does it assume skills the course never built?',
  },
  missing_transfer: {
    id: 'missing_transfer',
    label: 'Missing Transfer',
    description: 'Every lesson hits Apply within its own topic but no lesson requires applying skills across topics.',
    diagnostic: 'Does any lesson ask the learner to use a technique from a prior lesson in a new situation? If not, the course is a set of silos.',
  },
} as const

export type LessonPatternId = keyof typeof LESSON_PATTERNS
export type CoursePatternId = keyof typeof COURSE_PATTERNS
