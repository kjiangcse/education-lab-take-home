/**
 * Writer personas for lesson review testing.
 *
 * Each persona represents a type of specialist with characteristic
 * blind spots. When paired with a lesson, the review system should
 * identify the specific faults that persona's writing produces.
 */

export type WriterPersona = {
  id: string
  name: string
  description: string
  /** What faults this writer's content typically has */
  expected_faults: string[]
  /** Which lesson best demonstrates this persona's problems */
  target_lesson_id: string
  /** How this persona behaves when receiving feedback */
  behavior: string
}

export const WRITER_PERSONAS: WriterPersona[] = [
  {
    id: 'knowledge-dumper',
    name: 'The Knowledge Dumper',
    description:
      'Deep product knowledge, writes everything they know. Organizes by topic not by learning progression. Produces information dumps, walls of text, and topic-as-objective patterns.',
    expected_faults: [
      'information_dump',
      'wall_of_text',
      'reference-doc structure',
      'topic-as-objective',
      'unobservable verb',
      'no_assessment',
    ],
    target_lesson_id: 'l1',
    behavior: 'You accept most feedback but get protective when asked to cut content. You spent time researching this material and it feels wasteful to remove it. You need to be shown that restructuring keeps the knowledge, it just changes the shape. Ask questions like "but wont learners miss that context?" when content is removed.',
  },
  {
    id: 'instructional-novice',
    name: 'The Instructional Design Novice',
    description:
      'Competent writer, clear prose. But doesn\'t think in Bloom\'s levels, writes vague objectives, and presents frameworks as lists instead of sequences.',
    expected_faults: [
      'stated_actual_mismatch',
      'abstraction_first',
      'flat_progression',
      'missing_practice',
    ],
    target_lesson_id: 'l2',
    behavior: 'You accept feedback readily because you know you lack instructional design training. You ask genuine clarifying questions about concepts you havent encountered, like "whats blooms taxonomy?" or "how do i know if something is apply vs understand?" You want to learn the framework, not just fix this lesson.',
  },
  {
    id: 'feature-describer',
    name: 'The Feature Describer',
    description:
      'Technical writer who documents features well. Writes quickstart guides not lessons. Leads with code, documents API params instead of teaching skills, all exercises are follow-along.',
    expected_faults: [
      'cold_open',
      'unframed_code',
      'follow-along trap',
      'format_mismatch',
      'missing_practice_ramp',
    ],
    target_lesson_id: 'l3',
    behavior: 'You accept structural feedback but push back when it feels like the code examples are being devalued. You genuinely believe seeing the API calls is essential. You need to understand that the code stays but moves. Its position changes, not its presence. Ask "but where do the code examples go then?"',
  },
  {
    id: 'over-scaffolder',
    name: 'The Over-Scaffolder',
    description:
      'Thorough and careful, adds extensive background for every concept. The lesson is accurate but padded, with dense Remember-tier content before every Apply section. Learners wade through definitions to reach the work.',
    expected_faults: [
      'stacked_scaffolding',
      'pacing_failure',
      'information_dump',
      'decorative_media',
    ],
    target_lesson_id: 'l1',
    behavior: 'You accept feedback but are anxious about cutting context. You worry learners will be confused without the background material. You need reassurance that cutting scaffolding doesnt mean cutting support, it means trusting the learner more. Ask "wont beginners struggle without that intro?"',
  },
  {
    id: 'component-stacker',
    name: 'The Component Stacker',
    description:
      'Loves interactive components like tabs, dropdowns, and galleries. Stacks them back-to-back without bridging text. Important content hidden in dropdowns. Sequential steps put in tabs where they should be visible sections.',
    expected_faults: [
      'component_stacking',
      'hidden_content',
      'wrong_container',
      'missing_context_bridge',
    ],
    target_lesson_id: 'l2',
    behavior: 'You accept feedback about component choices readily, since you know you tend to over-use interactive elements. Your learning edge is understanding when a dropdown hides vs when it organizes. Ask "how do i decide if something should be a dropdown or just visible on the page?"',
  },
]
