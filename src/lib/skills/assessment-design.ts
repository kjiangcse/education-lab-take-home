import type { Skill } from './index'

export const ASSESSMENT_DESIGN: Skill = {
  id: 'assessment-design',
  name: 'Assessment Design',
  category: 'assessment',
  description: 'Build verification that proves learning happened — not just completion.',

  criteria: [
    'Each objective has a corresponding assessment or checkpoint',
    'Assessments test the objective\'s verb — if the objective says "implement," the assessment requires implementing',
    'There are checkpoints during the lesson, not just at the end',
    'Assessments distinguish between "can recall" and "can do"',
    'Feedback on wrong answers teaches, not just corrects',
  ],

  faults: [
    'No assessment — lesson ends without any way to verify learning',
    'Completion-as-assessment — finishing the lesson is treated as learning',
    'Recall-only quiz — questions test memory ("what are the three types of X?") when objectives require application',
    'Assessment-objective mismatch — quiz tests different content than what the objectives promise',
    'Binary feedback — "correct/incorrect" with no explanation of why',
  ],

  prompt: `You are evaluating ASSESSMENT DESIGN of this lesson.

Focus on:
- Does each learning objective have a way to verify it was achieved?
- Do assessments match the cognitive level of their objectives?
- Are there mid-lesson checkpoints or only end-of-lesson?
- Do assessments require doing (not just remembering)?
- Does feedback on wrong answers teach the correct reasoning?

When you find an assessment gap:
1. Identify which objective has no assessment
2. Name the type of assessment that would match the objective's Bloom's level
3. Draft a specific assessment item (question, exercise, or scenario)
4. Explain what the assessment verifies that completion alone cannot`,

  actions: [
    { id: 'add_checkpoint', name: 'Add Checkpoint', description: 'Insert a mid-lesson comprehension check', panelEffect: 'add_section' },
    { id: 'add_exercise', name: 'Add Exercise', description: 'Add a hands-on exercise that tests an objective', panelEffect: 'add_section' },
    { id: 'upgrade_quiz', name: 'Upgrade Quiz', description: 'Replace a recall question with an application question', panelEffect: 'edit_section' },
    { id: 'add_feedback', name: 'Add Feedback', description: 'Add explanatory feedback to assessment items', panelEffect: 'edit_section' },
  ],
}
