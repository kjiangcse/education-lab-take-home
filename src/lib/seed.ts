import type { Chat, Config, Message } from './types/chat'
import { SAMPLE_LESSONS } from './data/sample-course'

export const DEFAULT_CONFIG: Config = {
  userName: 'Explorer',
  thinkingDelay: 900,
  streamSpeed: 8,
}

export const CANNED_RESPONSE =
  "This is a scaffolded response. The real Claude API isn't wired up yet — this text is just streaming in to demonstrate the thinking spark and the message flow.\n\nYou can replace this with a real API call, or edit the seeded chats in the source to prototype different conversation shapes."

// IDs that get the right-side Lesson Studio panel
export const LESSON_CHAT_IDS = new Set(['demo-artifacts', 'demo-restructure', 'demo-blooms'])

/** Chats whose right-panel should open to the course view by default — used
 *  by the closing slide to demo what course-level review looks like. */
export const COURSE_LEVEL_CHAT_IDS = new Set(['demo-closing'])

/**
 * Starter message used as the placeholder on /new. Clicking Send with an
 * empty textarea submits this as the first user message — giving the demo
 * a guided, one-click opener while Claude still responds organically
 * (not a pre-scripted thread).
 *
 * Names the lesson by title — not by id — so Claude has to locate it with
 * tool use (list_lessons → get_lesson) rather than reading the system
 * prompt's focused-lesson context. That way the live chat actually
 * exercises the tool loop instead of just answering from the attached
 * lesson, even when the right panel is on a different lesson.
 *
 * Targets Lesson 4 (Workflow Integration & Adoption) — the pretty-good
 * draft with intentional kickstart points (one unobservable objective,
 * one empty video placeholder, no knowledge check) so the live review has
 * obvious material to work with without being a dumpster fire.
 */
export const DEMO_STARTER = {
  message: "I want \"Workflow Integration & Adoption\" to land at Apply on Bloom's. Learners should actually be choosing surfaces and diagnosing adoption failures, not just reading about them. Can you audit where each section actually sits on the taxonomy and tell me if the lesson hits Apply?",
  lesson_id: 'l4',
}

// Map demo chat IDs to the lesson they review
export const DEMO_CHAT_LESSON_MAP: Record<string, string> = {
  'demo-artifacts': 'l2', // artifact showcase — l2 has all section types + feedback
  'demo-restructure': 'l1', // knowledge dump faults
  'demo-blooms': 'l3',    // feature-describer faults
}

/**
 * Freezes each assistant message in a demo chat to the lesson's seeded state
 * so inline `{{{card:...}}}` artifacts keep rendering the diff Claude was
 * referring to — even after the user clicks Apply in the right panel and
 * clears the pending feedback from the live lesson.
 */
function withLessonSnapshots(raw: Chat[]): Chat[] {
  return raw.map((c) => {
    const lessonId = DEMO_CHAT_LESSON_MAP[c.id]
    if (!lessonId) return c
    const snapshot = SAMPLE_LESSONS.find((l) => l.id === lessonId)
    if (!snapshot) return c
    return {
      ...c,
      messages: c.messages.map((m) =>
        m.role === 'assistant'
          ? { ...m, lessonId: m.lessonId ?? lessonId, lessonSnapshot: m.lessonSnapshot ?? snapshot }
          : m,
      ),
    }
  })
}

const RAW_SEED_CHATS: Chat[] = [
  // ── Showcase: every inline artifact Claude can render in a reply ──────
  {
    id: 'demo-artifacts',
    title: 'Inline Artifact Showcase',
    messages: [
      {
        role: 'user',
        text: "quick one, im trying to visualize everything we can drop into a claude reply as an inline artifact. can you run through them on lesson 2 so i can see each component rendered in a response",
      },
      {
        role: 'assistant',
        text: "Here's every artifact the chat can render inline, grounded in **Lesson 2**. Each artifact reuses the same component the right panel uses, so chat-side previews stay visually consistent with the live lesson.\n\n### 1. Rich text section\n\nAddressed by id — same `RichTextViewer` the lesson studio renders.\n\n{{{card:section-1}}}\n\n### 2. Dropdown (clean)\n\nOne dropdown item by id. Same `ExpandableDropdown` component the right panel uses.\n\n{{{card:dropdown-1}}}\n\n### 3. Dropdown (with proposed edits)\n\nWhen a dropdown has `feedback.edits`, heading and content render with strikethrough-old + green-new inline. The surrounding content stays visible but **fades out** toward the edges so the edit sits in the visual spotlight.\n\n{{{card:dropdown-2}}}\n\n### 4. Dropdown group (mixed edits)\n\nA single marker can render the whole group — all items, or a subset by item id. Each one renders clean or edited based on its own `feedback`.\n\n{{{card:dropdowns-1}}}\n\n### 5. Tabbed gallery (with edits)\n\nTabs with `feedback.edits` get an **UPDATED** pill so changes are scannable without clicking through. When a tab title has an edit, the button shows strikethrough-old stacked above new-title. Content renders inline strikeout/replacement when the active tab has edits.\n\n{{{card:tabs-1}}}\n\n### 6. Bloom's pyramid (single tier)\n\nFlags the cognitive level of a piece of content. Click a tier to preview, auto-resets after 5s.\n\n{{{bloom:apply}}}\n\n### 7. Section edit preview (spotlight)\n\n`card:diff:ID` renders the whole section with edits inline. Paragraphs above the first edit and below the last edit fade toward the outer edge — context stays readable but the edited span holds focus. If the edit is at the start or end of the section, that side stays solid (nothing to fade into).\n\n{{{card:diff:section-1}}}\n\nAnd a two-edit case from the framework section:\n\n{{{card:diff:section-2}}}\n\n### 8. Learner journey (course-level)\n\nRenders a course-wide workflow rail: each stage a learner moves through, mapped to the lesson(s) that address it. Stages without a lesson render as dashed **Gap** pills so coverage holes are visible at a glance. Unlike the Bloom's pyramid (cognitive-tier coverage) or section cards (content), this artifact shows *workflow* coverage — does every phase of the journey from noticing friction to shipping a tool have a lesson behind it.\n\n{{{journey}}}\n\nBuilt for course-level review. Default rendering uses the five-lesson arc from this course; props are set up so later work can feed in any stage list.\n\n### 9. Objective / content alignment matrix\n\nRenders the constructive-alignment view practitioners actually reach for: one row per objective, with the tier the objective's verb *implies* next to the tier the matching content *delivers*. A gap marker (↓, ✓, — for no matching activity) makes the misalignment scannable without interpreting bars or percentages.\n\n{{{alignment}}}\n\nThis is the working-tool cousin of the Bloom's pyramid — the pyramid is the iconic image, the matrix is what an ID actually audits against. Use it when the lesson has real objectives to compare against; use the pyramid when you just need a single-tier ornament.\n\n---\n\nThat's the full marker inventory. The feedback overlay, Bloom's coverage bars, and undo stack are still panel-only affordances (not yet marker-driven).",
      },
    ],
  },

  // ── Scenario 1: Structural Faults & Knowledge Dumps (Lesson 1) ────────
  // Empty by default — Demo button in ChatHeader plays the script from
  // SCRIPTED_DEMO_MESSAGES['demo-restructure'] below, one turn at a time.
  {
    id: 'demo-restructure',
    title: 'Scenario 1',
    messages: [],
  },

  // ── Scenario 2: Bloom's Iteration (Lesson 3) ──────────────────────────
  // Empty by default — Demo button in ChatHeader plays the script from
  // SCRIPTED_DEMO_MESSAGES['demo-blooms'] below, one turn at a time.
  {
    id: 'demo-blooms',
    title: 'Scenario 2',
    messages: [],
  },

  // ── Scenario 3: Course-Level Review (Closing slide) ───────────────────
  // Empty by default — the inline "Start demo" button plays the script from
  // SCRIPTED_DEMO_MESSAGES['demo-closing'] below, one turn at a time. The
  // right panel opens to the course view (COURSE_LEVEL_CHAT_IDS).
  {
    id: 'demo-closing',
    title: 'Scenario 3: Course review',
    messages: [],
  },

]

export const SEED_CHATS: Chat[] = withLessonSnapshots(RAW_SEED_CHATS)

/**
 * Scripted demo content, replayed one turn at a time by the ChatHeader Demo
 * button. These chats seed with `messages: []` so the chat opens blank — each
 * click of Demo appends the next user+assistant pair from this map. Lesson
 * snapshots are baked in so `{{{card:...}}}` markers resolve to the seeded
 * lesson even after the user applies edits in the right panel.
 */
const RAW_SCRIPTED_DEMO_MESSAGES: Record<string, Message[]> = {
  'demo-restructure': [
    {
      role: 'user',
      text: "I'm currently working on \"Understanding the People You Build For\" and I just finished the first complete draft. I tried to be pretty thorough on the research methods. Could you take a look and tell me if it's ready to go or if I missed anything important?",
    },
    {
      role: 'assistant',
      text: "## Review summary\n\nWalking the draft against the skill framework, here's what I found in Content Design:\n\n- Wall of text in the Empathy Mapping section\n- Hidden content: the interview question bank is buried in a dropdown\n- Components stacked: the tab gallery sits flush against the dropdown group\n- No knowledge check anywhere. Two methods taught, zero verification\n\nEach of these is worth fixing. The wall of text will pay back fastest because it's the shape that decides how the whole lesson teaches. Let's start there.\n\n### 1. Wall of text in Empathy Mapping\n\n{{{card:section-2}}}\n\n**Why it reads this way.** When you want to be thorough, it's natural to pack every angle into the first paragraph — the definition, the four quadrants, the fill-in process, and the tools all in one block. On a reference page, that reads as complete. In a lesson, it reads as a wall. Completeness and clarity pull in opposite directions: the learner needs things sequenced, not consolidated. Worth naming because once you see the pattern, you can catch it in the next section before it becomes another edit.\n\n**What that does to the learner.** Durable concepts form when learners see *concept → example → practice* as three distinct beats, not four overlapping ideas in one block. Right now the section delivers concept (buried), half the process (generic), no example, no practice — so the reader is doing the sequencing work that the section should have done.\n\n**Two fixes, in genuinely different directions.**\n\n#### Option A. Three beats, same content rearranged\n\nKeep everything currently in the paragraph, but split it into sub-sections. Nothing is cut; the learner encounters one thing at a time.\n\n- **Beat 1, definition.** Two sentences. What an empathy map is, how it gets filled.\n- **Beat 2, worked example.** A filled-in empathy map for a support rep, annotated so the learner sees what \"good\" looks like.\n- **Beat 3, your turn.** A 15-minute observation exercise. Pick a coworker, watch them work, fill in the grid.\n\nHere's what Beat 1 looks like applied to the current section:\n\n{{{card:diff:section-2}}}\n\n#### Option B. Cut the tooling, expand the example\n\nDrop the Miro, FigJam, and whiteboard mentions (those are a one-search-away answer, not lesson content). Use the reclaimed space for two filled-in empathy maps side by side: a thin one that misses what matters, and a rich one that surfaces real tensions. Learners pick up the pattern by contrast. Tighter, more opinionated, roughly 30% fewer words.\n\nWhich shape fits your voice? If you'd rather start on the hidden dropdown content first, say the word and I'll pull those up.",
    },
    {
      role: 'user',
      text: "quick detour before the empathy mapping stuff — what about the two dropdowns at the bottom? the question bank description feels long and i wasn't sure if the empathy template was pulling its weight either.",
    },
    {
      role: 'assistant',
      text: "## Dropdowns, quick pass\n\nGood call — and it's the same instinct behind the wall of text upstream. Completeness creeping into a container that's meant to point somewhere, not re-teach the concept. A dropdown inherits prose it was never built for when every surface gets treated as teaching real estate. Once you name the pattern, both of these are cheap to reshape.\n\n### Interview Question Bank\n\n{{{card:dropdown-1}}}\n\nThe heading promises a bank. The body re-explains every category before showing a single question. Two trims stack in the preview above: collapse the per-category descriptions into a single \"pick one from each\" line, and tighten the \"menu, not a script\" caveat.\n\n### Empathy Map Template\n\n{{{card:dropdown-2}}}\n\nCurrently describes formats, metadata fields, and two optional structural extensions. The learner never sees what a good filled-in map looks like. The edit swaps the optional-extensions paragraph for a worked-example note so the template stops being a blank container and starts being a teaching tool.\n\n### Next move\n\nBoth are text-level trims, ready to apply. There's also a separate structural move on the table: **promoting the question bank out of the dropdown entirely** so learners don't have to click to see core content. That one rearranges the block list, so better to tackle after we've landed the empathy mapping reshape.\n\nWant to apply these two trims now, or hold them until we've worked through the wall of text first?",
    },
    {
      role: 'user',
      text: "i get the wall of text thing but i spent a lot of time on the empathy mapping section making sure it was complete. do i really need to cut stuff out?",
    },
    {
      role: 'assistant',
      text: "## Option A, applied\n\nYou don't need to cut anything to make this work. A paragraph isn't the knowledge; it's one shape the knowledge can take. The four facts currently in Empathy Mapping live more cleanly across three beats than in one block.\n\n### Beat 1, drafted\n\n{{{card:diff:section-2}}}\n\nThe textbook definition crosses out. A two-sentence instruction-style opener takes its place. Click the arrow to land in the section in context.\n\n### Beats 2 and 3 (new material)\n\nThese are additions, not edits. Neither exists in the lesson yet.\n\n- **Beat 2, worked example.** A filled-in empathy map for Priya, a support lead at a mid-market SaaS company. Real quotes, real behaviors, real frustrations from a 20-minute shadow session. The learner sees what \"good\" looks like before they try to make one.\n- **Beat 3, your turn.** A 15-minute observation exercise. The learner picks a coworker, watches them work, fills in the grid based on what they saw (not what they assumed), and brings it to the next review.\n\n### The same pattern applies to User Interviews\n\nBefore finalizing, worth naming that the next section has the same fault:\n\n{{{card:section-3}}}\n\nAlso one paragraph, also doing multiple jobs: enumerates three interview types, prescribes eight do's and four don'ts, then lists three follow-up steps. The three-beat reshape works here too:\n\n- **Beat 1.** A two-sentence framing of *why semi-structured interviews*, not three types.\n- **Beat 2.** One worked transcript showing a good follow-up in action.\n- **Beat 3.** A short exercise where the learner rewrites a leading question into a neutral one.\n\nThe Miro and FigJam mentions from Empathy Mapping would also move cleanly into a \"Tools\" dropdown beneath Beat 3, where optional reference material belongs.\n\n### Where would you like to land?\n\nThree concrete next moves, pick one:\n\n1. **Draft Beat 2 and Beat 3** for Empathy Mapping so you can see the full three-beat shape end to end.\n2. **Apply the same reshape to User Interviews** so both sections move together.\n3. **Pivot to the objectives.** Those unobservable verbs are the ceiling on what either section can actually teach.",
    },
  ],
  'demo-blooms': [
    {
      role: 'user',
      text: "i'm auditing my draft of \"Custom Claude Tools — From Prompt to Product\" before publishing. can you do a Bloom's pass on it? i have a feeling the objectives say Apply but the sections aren't actually doing Apply work.",
    },
    {
      role: 'assistant',
      text: "## Bloom's pass\n\nYou're right. The objectives promise Apply. The sections are executing Remember. The whole review is about closing that gap — and it's most legible row by row:\n\n{{{alignment}}}\n\nFour of your five objectives use Apply-tier verbs (*write, use, implement, deploy*) but land at Remember or Understand in the content. The only row that lines up is the setup objective, which is legitimately Remember-tier. Every other row is the same shape: a design decision on paper, a step-by-step recipe in the content.\n\n**Why it reads this way.** When you're deep in a new API surface, it's natural to start by describing what's in the box — the install command, the `system` parameter, the JSON format. That's a feature tour. It's the writing stance of someone who wants to be complete about what the tool does. The stance a learner needs is closer to *\"here's the decision you'll have to make, and here's how Claude helps you make it.\"* Same facts, different verb. Once you see the pattern, every section that reads like documentation is a candidate for the same reshape.\n\nI've turned the Bloom's overlay on in the right panel — each section is tagged so the plateau shape is legible at a glance: spine sections at Remember, step tabs inheriting it, dropdowns all reference material. Two edits are ready now, both on the spine of the lesson.\n\n### 1. The opener tells instead of asks\n\n{{{card:diff:section-1}}}\n\nRight now Section 1 opens with \"First, install the Anthropic SDK.\" That's a Remember instruction. The edit reframes it as a design checkpoint: name the user, name the job, name what good output looks like, write those at the top of the file, *then* install. Install still happens — but every later decision gets judged against the three answers. Same install command, Apply-tier framing around it.\n\n### 2. System prompts are documented, not taught\n\n{{{card:diff:section-2}}}\n\n\"Make your system prompt as detailed as you want\" tells the learner nothing actionable. The replacement gives a three-component rubric (who the user is, what they're trying to accomplish, what a good response looks like) and asks the learner to draft against it. A read-it-out-loud check closes the loop. Now the learner ends the section with their own system prompt, not just an understanding of where the parameter goes.\n\n---\n\nClick through to turn 2 and I'll apply both edits, then pull the structured-outputs section — it's the same pattern.",
    },
    {
      role: 'user',
      text: "both those land. what about the structured outputs section — feels like the same problem to me.",
    },
    {
      role: 'assistant',
      text: "Same feature-tour stance — the section documents the `response_format` parameter instead of teaching output design. One edit.\n\n{{{card:diff:section-3}}}\n\nThe original tells the learner to ask for JSON but never says how to pick the shape. The replacement reframes output format as a design decision driven by downstream use: if your code renders a card, the shape is the card's fields; if it triggers a workflow, the shape is the workflow's inputs. Decide the shape first, then prompt Claude for exactly it.\n\nThe four step-tabs have the same fault but I'll hold that one. Easier to reassess the whole lesson once the section spine is Apply-level. Click through to turn 3 and I'll apply this edit, then re-run the Bloom's pass.",
    },
    {
      role: 'user',
      text: "nice. re-run the Bloom's pass now that all three are in?",
    },
    {
      role: 'assistant',
      text: "## Post-edit Bloom's pass\n\n{{{bloom-coverage:after}}}\n\nSections 1, 2, and 3 have moved to Apply. Each one now forces a decision before code runs: name the user and the job before install, draft a system prompt against a three-component rubric, decide the output shape from the consuming code before asking for JSON. The verb on the spine now matches the verb on the objectives.\n\n### What's still unresolved\n\n{{{card:tabs-1}}}\n\nThe step tabs haven't moved. All four are still \"do what I did\" — the verb is Remember even though the surrounding sections are now Apply. Cheapest lift: convert Step 2 from **\"Write Your Prompt\"** (follow the template) to **\"Design Your Prompt\"** (make a call about your own tool). Single-word change, Apply-level payoff, keeps the code where it is.\n\nWant me to draft that edit, or call it done for this pass?",
    },
  ],
  'demo-closing': [
    {
      role: 'user',
      text: "I've got first drafts of all five lessons done. Can you do a course-level pass? I want to make sure the lessons actually reinforce each other and hit the course objectives — not just the per-lesson ones.",
    },
    {
      role: 'assistant',
      text: "## Course-level pass\n\nZooming out from per-lesson review, three patterns surface that no single lesson can tell you about. The first one only shows up when you map the lessons to the workflow a learner actually walks through.\n\n### 1. The arc has a front-end gap\n\n{{{journey}}}\n\nFive of six stages are covered, one lesson per stage — clean arc. The gap is at **Notice**. The course assumes learners arrive with a candidate problem already in hand. For an opt-in learner that might be fine. For a CS specialist whose manager said *\"do this training,\"* the assumption is invisible — they hit Lesson 1 ready to research users for a tool that doesn't exist yet, and bounce.\n\nThis isn't a missing lesson. It's a missing 90 seconds in the Lesson 1 intro: *\"Before you research, you need a candidate problem. Here are three ways to surface one.\"* Same arc, closed front door.\n\n### 2. Objective 2 is orphaned to a single lesson\n\n*Apply a compressed design-thinking process to scope a tool before building it* lives almost entirely in Lesson 2. Lessons 3–5 don't reference it. By the time a learner hits the build in Lesson 3, the design-thinking scaffolding isn't in the room anymore.\n\nIt needs a callback — one decision point in each subsequent lesson that says *\"pause, what would the design-thinking frame say about this choice?\"* Same objective, reinforced across the arc.\n\n### 3. Cognitive coverage plateaus at Apply\n\nAt the course level, Bloom's isn't about *which tier a single section sits on* — it's about **how the whole course is distributed**. Aggregated across all five lessons your course is heavy at Remember, solid at Understand, and softens at Apply. Analyze and Evaluate each live in one lesson; Create is essentially absent.\n\nThat's a mismatch with the stated objectives. Three of the five are Apply-tier (*interview coworkers*, *apply design thinking*, *build custom tools*), one is Evaluate-tier (*measure adoption, decide to keep or sunset*). A learner finishing as drafted will be able to **describe** the practices, not **make decisions** about them.\n\n---\n\nWhere do you want to start? The Notice gap is cheapest (intro addition, no restructure). The orphaned objective is the biggest lift on outcomes. The Bloom's plateau is the deepest change but resets the ceiling on everything above it.",
    },
    {
      role: 'user',
      text: "the notice gap is interesting — i figured if someone signs up they already have something in mind. walk me through why that's actually a problem.",
    },
    {
      role: 'assistant',
      text: "Fair read for opt-in learners. For mandated ones it falls apart.\n\nThe Notice stage on the arc isn't *having a problem* — it's **seeing** friction as a candidate for tooling. Those are different moves. A senior CS rep who's patched the same Zendesk workflow with sticky notes for three years has plenty of problems. They don't see them as tool-shaped — they see them as *\"the job.\"* They arrive at Lesson 1 not with a candidate but with resignation.\n\n### What this does to the rest of the arc\n\n- **Lesson 1** asks them to *understand the people they build for*. With no candidate tool in mind, they don't know which coworkers' workflows are relevant. They interview broadly, surface everything, build no intuition.\n- **Lesson 2** asks them to *frame the problem*. You can't frame nothing. They either invent a toy problem (wrong user) or abandon the lesson.\n- **Lessons 3–5** compound from there.\n\nEvery lesson after 1 assumes a concrete problem. If the learner never lands one at Notice, the arc never starts.\n\n### Lightweight fix, fits in the Lesson 1 intro\n\nThree prompts before any instruction:\n\n1. **Friction you've noticed.** Something you've patched around more than once.\n2. **Friction coworkers vent about.** Watercooler complaints that always come back.\n3. **Friction leadership has flagged.** A metric or anecdote from all-hands or QBRs.\n\nPick one. Write two sentences. That's your candidate problem. Every exercise across the remaining four lessons lands on *this specific problem,* not a hypothetical.\n\nThat turns the course from a tour through techniques into one compounding project. Want me to draft the intro section, then come back to the Bloom's plateau?",
    },
    {
      role: 'user',
      text: "yes draft it. then come back to the plateau — i want to see which sections would need to lift.",
    },
    {
      role: 'assistant',
      text: "## Draft: Lesson 1 \"Before you begin\"\n\nSitting above the current \"Understanding the People You Build For\" opener:\n\n> **Before you begin — pick a candidate problem.**\n>\n> This course works best when every exercise points at one real tool you might build. So before anything else, name what that tool might be.\n>\n> Three places to look:\n>\n> 1. **Something you've patched around.** A workflow where you've built a spreadsheet, saved reply, or ritual to compensate for a system that doesn't quite work.\n> 2. **Something coworkers vent about.** A complaint that comes back week after week.\n> 3. **Something leadership has flagged.** A metric or anecdote from all-hands or QBRs.\n>\n> Pick one. Write two sentences at the top of a notes doc: *\"Who has this friction. What does it cost them.\"* That's your candidate. You'll sharpen it through Lessons 1–2, build for it in Lessons 3–5, and ship it to whoever has the friction by the end.\n\n130 words, sits before the learning objectives, and gives the rest of the course something to grip.\n\n---\n\n## Bloom's plateau — where the lift goes\n\nCoverage widget is rendered below. Three sections carry most of the Remember weight across the course:\n\n- **Lesson 1, Empathy Mapping & User Interviews** — methods described, not practiced. Fixed by the three-beat reshape we've already walked through.\n- **Lesson 3, Sections 1 and 2** — feature tour of the SDK and system prompts. Already reshaped into Apply-tier framing.\n- **Lesson 5, Measuring Adoption** — lists the metrics to watch but never asks the learner to *decide* from them. Right now it's Evaluate-adjacent. One worked decision (*\"here's a two-week usage curve; keep, iterate, or sunset?\"*) moves it to Evaluate proper.\n\nLand those three and the coverage map reshapes on its own — Apply becomes the spine, Evaluate gets a real home, and the course objectives stop outrunning the content.",
    },
  ],
}

function attachLessonSnapshotToMessages(chatId: string, msgs: Message[]): Message[] {
  const lessonId = DEMO_CHAT_LESSON_MAP[chatId]
  if (!lessonId) return msgs
  const snapshot = SAMPLE_LESSONS.find((l) => l.id === lessonId)
  if (!snapshot) return msgs
  return msgs.map((m) =>
    m.role === 'assistant'
      ? { ...m, lessonId: m.lessonId ?? lessonId, lessonSnapshot: m.lessonSnapshot ?? snapshot }
      : m,
  )
}

export const SCRIPTED_DEMO_MESSAGES: Record<string, Message[]> = Object.fromEntries(
  Object.entries(RAW_SCRIPTED_DEMO_MESSAGES).map(([id, msgs]) => [
    id,
    attachLessonSnapshotToMessages(id, msgs),
  ]),
)

/** Chats that seed empty and populate via the Demo button. The
 *  ChatView auto-open-panel-on-load effect skips these so the panel
 *  doesn't appear until the first scripted assistant reply commits. */
export const SCRIPTED_DEMO_CHAT_IDS = new Set(Object.keys(RAW_SCRIPTED_DEMO_MESSAGES))
