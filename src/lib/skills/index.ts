/**
 * Skills — modular instructional guidelines that Claude uses to evaluate
 * and coach specialists on specific content-creation competencies.
 *
 * Three skills, clean separation:
 * 1. Content Design — structure, scaffolding, format, pacing, components, accessibility
 * 2. Bloom's & Objectives — cognitive architecture and measurable outcomes
 * 3. Assessment — whether learning is verified
 */

export type SkillAction = {
  id: string
  name: string
  description: string
  panelEffect: 'edit_section' | 'add_section' | 'reorder' | 'highlight' | 'annotate' | 'replace_text'
}

export type Skill = {
  id: string
  name: string
  category: 'instructional' | 'design' | 'assessment'
  description: string
  criteria: string[]
  faults: string[]
  prompt: string
  actions: SkillAction[]
}

export { CONTENT_DESIGN } from './content-design'
export { BLOOMS_AND_OBJECTIVES } from './blooms-and-objectives'
export { ASSESSMENT_DESIGN } from './assessment-design'

import { CONTENT_DESIGN } from './content-design'
import { BLOOMS_AND_OBJECTIVES } from './blooms-and-objectives'
import { ASSESSMENT_DESIGN } from './assessment-design'

export const ALL_SKILLS: Skill[] = [
  CONTENT_DESIGN,
  BLOOMS_AND_OBJECTIVES,
  ASSESSMENT_DESIGN,
]

export const SKILLS_BY_ID: Record<string, Skill> = Object.fromEntries(
  ALL_SKILLS.map((s) => [s.id, s]),
)
