import type { Skill } from './index'

export const CONTENT_DESIGN: Skill = {
  id: 'content-design',
  name: 'Content Design',
  category: 'design',
  description: 'Structure, scaffolding, format, pacing, accessibility, and component quality — everything about how content is shaped for the learner.',

  criteria: [
    // Structure
    'Content is sequenced from simple to complex, not presented all at once',
    'Each section builds on the previous one — removing a section would break the flow',
    'No section tries to cover more than one core concept',
    'Transitions between sections are explicit ("Now that you can X, let\'s use it to Y")',
    // Scaffolding
    'New concepts are introduced one at a time with practice between each',
    'Prerequisites are either taught or explicitly stated before they\'re needed',
    'Examples come before rules — learners see the pattern before they name it',
    'Complexity increases in steps, not jumps',
    // Format
    'The right format is used for each learning moment (text for concepts, video for demos, exercises for practice)',
    'Headers, callouts, and whitespace create clear visual hierarchy',
    'Content is scannable in 10 seconds — a learner can identify sections and flow at a glance',
    'Code examples are framed by context (what it does, why) not just presented',
    // Pacing
    'Pacing alternates between concept, example, and practice — no three-in-a-row of any type',
    'Multimedia elements have purpose, not decoration',
    // Component quality
    'Components (dropdowns, tabs, video) are the right container for their content',
    'Important content is not hidden behind clicks — dropdowns are for supplementary material, not core content',
    'Tabs group parallel content (e.g. steps, options) not sequential content that should be visible together',
    'Video placeholders have clear purpose — what the video teaches that text cannot',
    // Component spacing
    'Design components (gallery, tabs, video, dropdowns) are separated by at least one rich text section — never stacked directly against each other',
    'Rich text between components provides context: why the next component matters, what the learner should look for, or how it connects to what they just saw',
    // Accessibility
    'Text is readable — appropriate size, contrast, line length',
    'Visual structure works without color — hierarchy is communicated through size, weight, and spacing, not just color',
    'Content has a logical reading order that works for screen readers',
  ],

  faults: [
    // Structure faults
    'Information dump — everything presented in one block with no sequencing',
    'Orphan sections — content that doesn\'t connect to what comes before or after',
    'Reference-doc structure — organized by topic instead of by learning progression',
    // Scaffolding faults
    'Cold open — lesson starts with the hardest concept instead of building to it',
    'Prerequisite gap — uses terms or concepts not yet introduced',
    'Abstraction first — starts with theory before showing a concrete example',
    'Complexity cliff — jumps from "here\'s how it works" to "now build the whole thing"',
    'Missing practice ramp — no intermediate exercises between learning and application',
    // Format faults
    'Wall of text — no visual breaks, headers, or callouts',
    'Format mismatch — using text to explain a process that should be a video walkthrough',
    'Unframed code — code examples presented without explaining the design decision',
    'Missing scannability — learner has to read every word to understand the structure',
    // Pacing faults
    'Pacing failure — three concepts in a row without examples or practice',
    'Decorative media — images or videos that don\'t teach anything',
    'Follow-along trap — every exercise is "do what I did" with no decision-making',
    // Component faults
    'Hidden content — important information buried in a dropdown that should be visible',
    'Wrong container — tabs used for sequential content that should be visible sections',
    'Empty video — video placeholder with no clear purpose or script direction',
    // Component spacing faults
    'Component stacking — two design components (tabs, video, dropdowns, gallery) placed directly adjacent with no text between them',
    'Missing context bridge — a component appears without text explaining what it is, why it matters, or how to use it',
    // Accessibility faults
    'Color-only hierarchy — structure communicated through color alone',
    'Broken reading order — content doesn\'t flow logically when read linearly',
  ],

  prompt: `You are evaluating CONTENT DESIGN of this lesson — structure, scaffolding, format, pacing, component quality, and accessibility.

Structure & scaffolding:
- Is content sequenced from simple to complex?
- Does each section build on the previous one?
- Are there information dumps? Walls of text? Orphan sections?
- Are prerequisites in place before they're needed?
- Do examples come before rules?

Format & pacing:
- Is the right format used for each learning moment?
- Does pacing alternate between concept, example, and practice?
- Can a learner scan the lesson in 10 seconds?
- Are code examples framed by context?

Component quality & spacing:
- Are dropdowns, tabs, and video the right containers for their content?
- Is important content hidden behind clicks when it should be visible?
- Do tabs group parallel content or hide sequential content?
- Are design components (tabs, video, dropdowns, gallery) separated by rich text, or stacked directly against each other? Components should never touch — there should always be a text section between them providing context.

Accessibility:
- Does the visual hierarchy work without color?
- Is the reading order logical for someone using a screen reader?

When you find an issue:
1. Name the specific fault
2. Point to the exact field path
3. Suggest a design fix — restructure, reformat, or recontainer
4. Explain the learning impact`,

  actions: [
    { id: 'split_section', name: 'Split Section', description: 'Break a section into smaller sequential pieces', panelEffect: 'edit_section' },
    { id: 'add_transition', name: 'Add Transition', description: 'Insert a transition sentence between sections', panelEffect: 'edit_section' },
    { id: 'reorder_content', name: 'Reorder', description: 'Rearrange sections for better progression', panelEffect: 'reorder' },
    { id: 'add_prerequisite', name: 'Add Prerequisite', description: 'Insert a primer before a concept that assumes prior knowledge', panelEffect: 'add_section' },
    { id: 'add_example', name: 'Add Example', description: 'Insert a concrete example before an abstract explanation', panelEffect: 'add_section' },
    { id: 'insert_practice', name: 'Insert Practice', description: 'Add an exercise between concept and application', panelEffect: 'add_section' },
    { id: 'add_header', name: 'Add Header', description: 'Break a wall of text with a descriptive header', panelEffect: 'edit_section' },
    { id: 'suggest_format', name: 'Change Format', description: 'Recommend changing a section\'s format (text→video, text→exercise)', panelEffect: 'annotate' },
    { id: 'promote_content', name: 'Promote Content', description: 'Move important content from a dropdown to a visible section', panelEffect: 'reorder' },
    { id: 'frame_code', name: 'Frame Code', description: 'Add context around a code example', panelEffect: 'edit_section' },
    { id: 'highlight_issue', name: 'Highlight Issue', description: 'Mark a specific design issue for the specialist', panelEffect: 'highlight' },
  ],
}
