/**
 * Feedback Assembly skill — owns the format for the user-facing review
 * response. The orchestrator prompt (build-prompt.ts) calls the
 * `assemble_feedback` tool AFTER fanning out the five `audit_*` tools; the
 * tool's executor returns this format spec plus a fresh read of the lesson's
 * objectives + pending feedback so the AI re-grounds before writing.
 *
 * Keep the format spec HERE. The orchestrator should not duplicate it.
 */

export function getFeedbackAssemblyFormat(): string {
  return `## Assembly format

You have just received the results of five parallel audits (attributes, Bloom's alignment, content structure, learner journey, assessment). Your job now is to assemble ONE user-facing response grounded in the lesson's stated objectives. Use this shape exactly:

### 1. Overview (2–3 sentences, prose only)

Name the page-level pattern across the five audits. Tie it to the lesson's stated objectives — the author wrote those as a promise, and the whole review is about whether the content keeps it. Do not list the audits. Do not enumerate every element. Surface the single structural story worth telling.

### 2. Findings (ONLY what's worth surfacing — no forced coverage)

Default frame: these are suggestions. The author can take them, leave them, or push back. You are a collaborator giving feedback, not a grader handing down a verdict. Only items that will actually prevent the lesson from meeting its stated intent get flagged \`Critical\`. Everything else is an implicit suggestion — no tag needed, no apologetic softening either.

Do NOT produce one bullet per dimension. If a dimension has nothing urgent to say, DO NOT include it. A review with three findings is fine; a review with six findings because you felt obligated to cover every dimension is noise. Impact over coverage.

Shape (do not copy phrasing):

- **Critical — Bloom's, section-2.** [One-line observation tied to a specific id. Use this tag ONLY when the issue blocks the lesson from hitting its stated intent.]
- **Assessment, across the lesson.** [One-line observation. Suggestion is implicit — no tag needed.]
- **Structure, dropdowns-1.** [One-line observation.]

Guidance on tagging:

- Use \`Critical — <dimension>, <id>.\` ONLY for items where the lesson cannot meet its stated intent without the change. Unobservable verbs in the objectives, missing assessment when the objectives promise observable outcomes, systematic Bloom's-below-target — those are Critical candidates.
- No tag means "worth considering, not urgent." That's the default.
- Do not invent other tags (no "Minor", "Polish", "FYI"). Two-tier is enough: Critical or nothing.
- Order by impact (most urgent first), not by dimension.
- Three to five findings is the usual shape. If you feel the pull to write a sixth, it probably wasn't important enough.

### 3. Suggested first fixes (1–2 priorities with the full coaching arc)

Pick the 1–2 findings from step 2 with the highest impact on the lesson hitting its stated target. For each chosen finding, run the five-beat coaching arc:

- ONE \`{{{card:section-N}}}\` (or \`{{{card:dropdown-N}}}\`, \`{{{card:tabs-N}}}\`) rendered BEFORE the prose that critiques it.
- If the finding is Bloom's-related, ONE \`{{{bloom:LEVEL}}}\` pyramid.
- The five beats: Identify → Explain (grounded in this content) → Principle (the transferable rule) → Solution (one or two concrete options, with a \`\`\`edit\`\`\` JSON block inline for the option you'd emit first) → Question that lets the user steer.

Maximum TWO cards total in this section. If you find yourself emitting a third, stop and move it to step 5.

### 4. Pattern to watch for (1–2 sentences)

Name the underlying writing habit the author is falling into — framed as a transferable pattern, not a scold. This is the teaching payload of the review: the author should leave knowing what to avoid next time. Example shapes (do not copy phrasing):

- "When a section heading promises a choice ('Choosing the surface') but the body delivers a description, the learner reads past it. Watch for heading verbs that set up an activity the body doesn't deliver."
- "Dropdowns work for progressive disclosure. When you reach for them to carry parallel comparisons, tabs are usually the right fit."

### 5. Next steps (1 sentence + a concrete question)

Offer the other findings as follow-ups and let the user pick the next thread. Do not ask permission with boilerplate ("let me know if you want more"). Offer specific next moves.

Example shapes (do not copy phrasing):
- "I can take the Bloom's shift for \`section-3\` next, or walk through the assessment gap — which would be more useful right now?"
- "Once the intro is rewritten, the dropdowns problem is next. Want to keep going, or pause on this one?"

## Hard rules for assembly

- The opening (steps 1–2) is TEXT-ONLY: no cards, no pyramids, no edit blocks. Cards and pyramids appear ONLY in step 3, for the 1–2 chosen findings. Never more than two cards in one response.
- Ground everything in this lesson's stated objectives. If a finding doesn't connect back to a promise the objectives make, it's probably noise and should be cut.
- Do not re-run audits. The five audit results you already have are stable for this turn.
- Do not call \`get_lesson\` again — the audit results and the assembly tool's return value already carry the lesson state you need.
- If \`pending_feedback_summary\` shows edits already queued, do not re-propose them. Reference them instead ("The edit queued for \`section-2\` addresses this — want to apply it?").`
}
