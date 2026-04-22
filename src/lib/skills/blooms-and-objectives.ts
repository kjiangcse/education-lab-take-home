import type { Skill } from './index'

export const BLOOMS_AND_OBJECTIVES: Skill = {
  id: 'blooms-and-objectives',
  name: "Bloom's & Objectives",
  category: 'instructional',
  description: 'Learning objectives are observable and measurable, and lesson activities match their stated cognitive level.',

  criteria: [
    // Objective quality
    'Each objective uses an observable verb (implement, compare, design — not "understand" or "learn")',
    'Objectives specify what the learner will DO, not what the lesson will COVER',
    'Each objective is testable — you could watch someone demonstrate it',
    'Objectives are scoped to one behavior each, not compound ("do X and Y and Z")',
    'The set of objectives covers the lesson\'s full scope without gaps or overlaps',
    // Bloom's alignment
    'Each learning objective specifies a Bloom\'s level through its verb',
    'Section content matches the cognitive level of its corresponding objective',
    'Activities ask learners to DO things at the target level, not just READ about them',
    'The lesson progresses up Bloom\'s levels — not random jumps',
    'No objectives promise Evaluate/Create when all content is Remember/Understand',
  ],

  faults: [
    // Objective faults
    'Topic-as-objective — "Understand empathy mapping" (that\'s a topic, not an outcome)',
    'Unobservable verb — "Learn about," "Be familiar with," "Know the difference"',
    'Compound objective — "Design, build, and deploy a tool" (that\'s three objectives)',
    'Coverage gap — lesson content teaches things not covered by any objective',
    'Aspiration objective — "Master the fundamentals" (unmeasurable)',
    // Bloom's faults
    'Objectives-activity mismatch — objective says "implement" but content only "explains"',
    'Bloom\'s ceiling — all content stays at Remember/Understand regardless of objectives',
    'Level inflation — activities labeled Analyze that are actually Remember (listing parts ≠ analyzing)',
    'Missing practice — Apply-level objectives with no hands-on exercises',
    'Flat progression — all sections at the same cognitive level with no escalation',
  ],

  prompt: `You are evaluating BLOOM'S ALIGNMENT & OBJECTIVES of this lesson.

Focus on objectives:
- Does each objective use an observable, measurable verb?
- Could someone watch a learner and verify they've achieved each objective?
- Are objectives about what the LEARNER will do, not what the LESSON will cover?
- Is each objective scoped to one behavior?
- Do the objectives cover the lesson's full scope?

Focus on Bloom's alignment:
- Do learning objectives use verbs that specify a clear Bloom's level?
- Does each section's content match the cognitive level it claims?
- Are there activities that let learners practice at the target level?
- Does the lesson progress through Bloom's levels or stay flat?
- Are any sections labeled at a higher level than their actual content?

When you find a misalignment:
1. Quote the exact objective or name the specific section
2. Name the fault (unobservable verb, stated/actual mismatch, ghost tier, etc.)
3. For objectives: provide a rewritten version that passes the observability test
4. For Bloom's: suggest a specific activity that would reach the target level
5. Explain what the fix changes about how the lesson should be structured`,

  actions: [
    { id: 'rewrite_objective', name: 'Rewrite Objective', description: 'Replace a vague objective with an observable one', panelEffect: 'replace_text' },
    { id: 'split_objective', name: 'Split Objective', description: 'Break a compound objective into separate outcomes', panelEffect: 'edit_section' },
    { id: 'add_objective', name: 'Add Objective', description: 'Add a missing objective for uncovered content', panelEffect: 'add_section' },
    { id: 'flag_gap', name: 'Flag Gap', description: 'Highlight content not covered by any objective', panelEffect: 'highlight' },
    { id: 'show_blooms', name: 'Show Distribution', description: 'Display Bloom\'s taxonomy coverage artifact', panelEffect: 'annotate' },
    { id: 'tag_level', name: 'Tag Level', description: 'Annotate a section with its actual Bloom\'s level', panelEffect: 'annotate' },
    { id: 'suggest_activity', name: 'Suggest Activity', description: 'Add a practice activity at the target cognitive level', panelEffect: 'add_section' },
    { id: 'elevate_section', name: 'Elevate Section', description: 'Rewrite a section to reach a higher Bloom\'s level', panelEffect: 'edit_section' },
  ],
}
