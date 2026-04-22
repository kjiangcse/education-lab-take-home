/**
 * Customer education writing guidelines adapted from CEAP research.
 * These are injected into the review system prompt so Claude evaluates
 * content against established standards, not just its own preferences.
 */

export function getWritingGuidelines(): string {
  return `
## Customer Education Writing Standards

### Voice & Tone
- Grade 7-9 reading level
- Friendly, informed, supportive
- Second person ("you") when addressing the learner
- No em dashes
- Oxford commas
- Clarity and simplicity over flourish
- Active voice, not passive
- Concise, scannable, actionable
- Sentence case in titles and headings
- Inclusive language — no idioms, metaphors, or culturally specific references

### Grammar & Formatting
- Correct heading hierarchy: H1 > H2 > H3
- Capitalize bullet points
- Periods only if bullets are full sentences
- Numerals for 10+, spell out 0-9
- No emojis in formal content
- Descriptive link text, not "click here"
- No gendered language

### Instructional Design Standards
- Every lesson must have Bloom's taxonomy-aligned learning objectives
- Use scaffolding: Understand → Apply → Evaluate
- Follow Tell, Show, Do methodology
- Provide context before introducing new concepts
- Include interactive elements and knowledge checks
- Use real-world examples and case studies
- End sections with clear takeaways or next steps
- Content must align with stated learning objectives

### Content Structure
- Logical progression from basic to advanced
- Clear connections between theory and practice
- Prerequisites stated before they're needed
- 3-6 items per list for readability
- HTML: use <p>, <ul>, <li>, <strong>, <em> properly

### Naming Conventions
- Explainer lessons: "Understand + [Topic]"
- Tutorial lessons: "Getting started with + [Tool]"
- Best Practice: "[Action Verb] + [Outcome]"
- Descriptions: action verb + outcome, under 170 characters

### Accessibility
- Alt text for images (<150 characters)
- Don't use color as the only meaning indicator
- Strong contrast (WebAIM standards)
- Plain language and descriptive links
- Scannable, accessible sentences

### Final Checklist
Before any content is complete:
- Learning objective is Bloom's-aligned
- Voice and tone meet style guidelines
- Grammar and formatting are correct
- Structure is scannable and global-first
- Layout and accessibility follow guidelines
`
}
