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
export const LESSON_CHAT_IDS = new Set(['demo-artifacts', 'demo-blooms', 'demo-structure', 'demo-skills'])

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
  message: "Can you review my draft of \"Workflow Integration & Adoption\"? Just wrapped the first pass and I think it's close, but a couple of things feel loose — the last objective and the video section in particular. Want to see where you'd push back before I ship it.",
  lesson_id: 'l4',
}

// Map demo chat IDs to the lesson they review
export const DEMO_CHAT_LESSON_MAP: Record<string, string> = {
  'demo-artifacts': 'l2', // artifact showcase — l2 has all section types + feedback
  'demo-structure': 'l1', // knowledge dump faults
  'demo-blooms': 'l2',    // instructional design faults
  'demo-skills': 'l3',    // feature-describer faults
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
        text: "Here's every artifact the chat can render inline, grounded in **Lesson 2**. Each artifact reuses the same component the right panel uses, so chat-side previews stay visually consistent with the live lesson.\n\n### 1. Rich text section\n\nAddressed by id — same `RichTextViewer` the lesson studio renders.\n\n{{{card:section-1}}}\n\n### 2. Dropdown (clean)\n\nOne dropdown item by id. Same `ExpandableDropdown` component the right panel uses.\n\n{{{card:dropdown-1}}}\n\n### 3. Dropdown (with proposed edits)\n\nWhen a dropdown has `feedback.edits`, heading and content render with strikethrough-old + green-new inline. The surrounding content stays visible but **fades out** toward the edges so the edit sits in the visual spotlight.\n\n{{{card:dropdown-2}}}\n\n### 4. Dropdown group (mixed edits)\n\nA single marker can render the whole group — all items, or a subset by item id. Each one renders clean or edited based on its own `feedback`.\n\n{{{card:dropdowns-1}}}\n\n### 5. Tabbed gallery (with edits)\n\nTabs with `feedback.edits` get an **UPDATED** pill so changes are scannable without clicking through. When a tab title has an edit, the button shows strikethrough-old stacked above new-title. Content renders inline strikeout/replacement when the active tab has edits.\n\n{{{card:tabs-1}}}\n\n### 6. Bloom's pyramid (single tier)\n\nFlags the cognitive level of a piece of content. Click a tier to preview, auto-resets after 5s.\n\n{{{bloom:apply}}}\n\n### 7. Section edit preview (spotlight)\n\n`card:diff:ID` renders the whole section with edits inline. Paragraphs above the first edit and below the last edit fade toward the outer edge — context stays readable but the edited span holds focus. If the edit is at the start or end of the section, that side stays solid (nothing to fade into).\n\n{{{card:diff:section-1}}}\n\nAnd a two-edit case from the framework section:\n\n{{{card:diff:section-2}}}\n\n### 8. Learner journey (course-level)\n\n`{{{journey}}}` renders a course-wide workflow rail: each stage a learner moves through, mapped to the lesson(s) that address it. Stages without a lesson render as dashed **Gap** pills so coverage holes are visible at a glance. Unlike the Bloom's pyramid (cognitive-tier coverage) or section cards (content), this artifact shows *workflow* coverage — does every phase of the journey from noticing friction to shipping a tool have a lesson behind it.\n\n{{{journey}}}\n\nBuilt for course-level review. Default rendering uses the five-lesson arc from this course; props are set up so later work can feed in any stage list.\n\n---\n\nThat's the full marker inventory. The feedback overlay, Bloom's coverage bars, and undo stack are still panel-only affordances (not yet marker-driven).",
      },
    ],
  },

  // ── Demo: Bloom's Alignment & Instructional Design (Lesson 2) ─────────
  {
    id: 'demo-blooms',
    title: "Demo: Bloom's Alignment & Objectives",
    messages: [
      {
        role: 'user',
        text: "I'm currently working on \"Design Thinking for Internal Tools\" and I just finished the intro and the framework section. Something feels off but I can't quite figure out what. Could you take a look and tell me if it's ready or if it still needs work?",
      },
      {
        role: 'assistant',
        text: "## Lesson Review: Introduction & Core Framework\n\n### What's working\n\n- **Strong opening claim.** \"Internal tools fail because they're built from requirements documents instead of observed behavior\" names the failure mode before introducing the framework. That earns the reader's attention.\n- **Specific framework.** The compressed design thinking approach — shadow, frame as a verb, prototype the riskiest assumption — is actionable, not abstract.\n\n### What needs attention\n\n**The introduction uses \"requirements documents\"** which is abstract. The learner who's never written a requirements doc won't feel the tension. Ground it in something they've experienced — a ticket, a Slack request, a meeting where someone said *\"we need a dashboard.\"*\n\n**The core framework presents three techniques as a list, not a sequence.** It's currently at the **Apply** level on Bloom's taxonomy, which matches your objectives. But a learner finishes reading and knows *what* to do — not *when* to do each step or *how they connect*.\n\n> **Suggested fix:** Add a brief worked example — a single workflow problem taken through all three steps — to move from \"here are three techniques\" to \"here's how they compose into a process.\"\n\n{{{bloom:apply}}}\n\nTo push toward **Analyze**: after the worked example, ask learners to identify which step would change most if the internal tool were for a different team.",
      },
      {
        role: 'user',
        text: "ok that makes sense, ill ground the intro in something more real like a slack message. what about the dropdowns though, are those good? the shadow template and the problem framing one and the prototype checklist",
      },
      {
        role: 'assistant',
        text: "## Dropdown Analysis\n\nThe dropdowns are well-structured but doing different cognitive work than their labels suggest. That's an opportunity.\n\n### Shadow Session Template → Apply ✓ (could bridge to Analyze)\n\nCorrectly labeled — it's a procedural guide. But it could do more. Add a **\"what to do with what you observed\"** section at the end:\n\n1. What workaround did you see most often?\n2. What did the person do *manually* that could be automated?\n3. What's the gap between what they *said* the problem was and what you *observed*?\n\nThose three questions bridge from following a template to *interpreting observations*.\n\n### Problem Framing Exercise → Analyze ✓\n\nYour strongest dropdown. Taking a noun-framed request and reframing it as a verb genuinely requires decomposition. The three worked examples will be critical — learners need to see the reframing done before they try it.\n\n### Prototype Scoping Checklist → Evaluate ⚠\n\n\"Identify your riskiest assumption\" is genuinely Evaluate-level — it requires weighing multiple factors against criteria. But the current description is thin:\n\n> *\"decide in under a day whether to proceed or pivot\"*\n\nNeeds more scaffolding: **What criteria should they use to decide?** What does \"pivot\" actually look like for an internal tool? A two-sentence addition on decision criteria would make this genuinely Evaluate-level rather than aspirationally so.",
      },
    ],
  },

  // ── Scenario 1: Structural Faults & Knowledge Dumps (Lesson 1) ────────
  // Empty by default — Demo button in ChatHeader plays the script from
  // SCRIPTED_DEMO_MESSAGES['demo-structure'] below, one turn at a time.
  {
    id: 'demo-structure',
    title: 'Scenario 1',
    messages: [],
  },

  // ── Scenario 2: Bloom's Iteration (Lesson 3) ──────────────────────────
  // Empty by default — Demo button in ChatHeader plays the script from
  // SCRIPTED_DEMO_MESSAGES['demo-skills'] below, one turn at a time.
  {
    id: 'demo-skills',
    title: 'Scenario 2',
    messages: [],
  },

  // ── Demo: Course-Level Review (Closing slide) ─────────────────────────
  {
    id: 'demo-closing',
    title: 'Scenario 3: Course review',
    messages: [
      {
        role: 'user',
        text: "I've got first drafts of all five lessons done. Can you do a course-level pass? I want to make sure the lessons actually reinforce each other and hit the course objectives — not just the per-lesson ones.",
      },
      {
        role: 'assistant',
        text: "## Course-level review\n\nZooming out from the per-lesson view, three patterns surface that no single lesson can tell you about.\n\n### 1. Cognitive coverage plateaus at Apply\n\nAt the course level, Bloom's isn't about *which tier a single section sits at* — it's about **how the whole course is distributed** across tiers. Aggregated across all five lessons, your course is heavy at **Remember**, solid at **Understand**, and softens at **Apply**. **Analyze** and **Evaluate** live in a single lesson each; **Create** is essentially absent. The coverage map is below.\n\nThat's a mismatch with the course-level objectives. Three of the five are Apply-tier (*interview coworkers*, *apply a compressed design-thinking process*, *build custom tools on top of Claude*) and one is Evaluate-tier (*measure adoption and decide when to iterate, pivot, or sunset*). A learner finishing the course in its current shape will be able to **describe** the practices, not **make decisions** about them.\n\n### 2. Objective 2 is orphaned to a single lesson\n\n*Apply a compressed design-thinking process to scope a tool before building it* lives almost entirely in Lesson 2. Lessons 3–5 don't reference it. By the time a learner builds their custom tool in Lesson 3, the design-thinking scaffolding from Lesson 2 isn't in the room anymore.\n\nIt needs a callback: one decision point in each subsequent lesson that says *\"pause — what would the design-thinking frame say about this choice?\"* Same objective, reinforced across the arc.\n\n### 3. The wall-of-text pattern repeats across lessons\n\nLesson 1's empathy-mapping section and Lesson 3's system-prompt section share the same structural problem — one dense paragraph doing four jobs. You already fixed it in Lesson 1 with the three-beat reshape (*concept, example, practice*). Lesson 3 hasn't been reshaped yet. Same pattern, same fix.\n\n---\n\nThe per-lesson reviews caught per-lesson issues. The course-level view catches the **shape** of the whole course — which objectives pull weight, where cognitive levels cluster, which patterns repeat so consistently that fixing them one lesson at a time would be slow.\n\nWant to start with the orphaned objective (biggest lift on learner outcomes) or the Lesson 3 reshape (quickest to ship)?",
      },
    ],
  },

  // ── Non-demo seed chats ───────────────────────────────────────────────
  {
    id: 'c1',
    title: 'Naming my sourdough starter',
    messages: [
      {
        role: 'user',
        text: "I need a name for my sourdough starter. It's very bubbly and slightly judgmental.",
      },
      {
        role: 'assistant',
        text: "A judgmental starter deserves a name with gravitas. Some options:\n\n**The Classics**\nBread Pitt. Clint Yeastwood. Dough Malone.\n\n**The Aristocrats**\nLord Crumbsworth. The Dowager Loafess. Sir Rises-a-Lot.\n\n**The Unhinged**\nGluten Tag. The Thing in the Jar. Kevin.\n\nGiven the bubbly-yet-judgmental energy, I'd lean toward **The Dowager Loafess**. She's seen things. She has opinions about your feeding schedule. She will outlive you.",
      },
    ],
  },
  {
    id: 'c2',
    title: 'Convince my cat to respect me',
    messages: [
      {
        role: 'user',
        text: 'How do I convince my cat that I am, in fact, the one in charge here?',
      },
      {
        role: 'assistant',
        text: 'I admire the ambition, but I should be honest with you: you are not going to win this one.\n\n**What you can try**\nControl the food. Be the sole dispenser of treats. Establish a routine so ironclad that the cat associates your presence with reliable comfort rather than chaos.\n\n**What will actually happen**\nThe cat will accept the food, interpret the routine as the bare minimum expected of a servant, and continue to knock things off tables while maintaining direct eye contact.\n\n**The healthy reframe**\nYou are not in charge. You are a beloved and well-compensated employee. The benefits are excellent (warmth, purring, the occasional dead moth as a bonus). Lean into it.',
      },
    ],
  },
  {
    id: 'c3',
    title: 'Time travel etiquette',
    messages: [
      {
        role: 'user',
        text: "If I invented a time machine, what's the first thing I should NOT do?",
      },
      {
        role: 'assistant',
        text: "Excellent instinct to ask about the don'ts first. In rough order of catastrophe:\n\n**Do not meet yourself.** Best case: deeply awkward. Worst case: the universe folds itself into a paradox and files a complaint.\n\n**Do not bring back a snack.** You will introduce a 14th-century bacterium to a population with no immunity and become history's most confusing villain.\n\n**Do not try to fix anything.** Every time traveler thinks they'll just nudge one small thing. Three nudges later, the Library of Alexandria is a water park.\n\n**Do not tell anyone.** Not because of timeline integrity — because everyone will immediately ask you to go back and buy Bitcoin, and you'll never hear the end of it.\n\nSafest first trip: go twenty minutes into the future, confirm the machine has a return function, come straight back. Boring, but you'll still exist.",
      },
    ],
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
  'demo-structure': [
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
  'demo-skills': [
    {
      role: 'user',
      text: "i'm auditing my draft of \"Custom Claude Tools — From Prompt to Product\" before publishing. can you do a Bloom's pass on it? i have a feeling the objectives say Apply but the sections aren't actually doing Apply work.",
    },
    {
      role: 'assistant',
      text: "## Bloom's pass\n\nYou're right. The objectives promise Apply. The sections are executing Remember. The whole review is about closing that gap.\n\n{{{bloom-coverage}}}\n\n**Why it reads this way.** When you're deep in a new API surface, it's natural to start by describing what's in the box — the install command, the `system` parameter, the JSON format. That's a feature tour. It's the writing stance of someone who wants to be complete about what the tool does. The stance a learner needs is closer to *\"here's the decision you'll have to make, and here's how Claude helps you make it.\"* Same facts, different verb. Once you see the pattern, every section that reads like documentation is a candidate for the same reshape.\n\nI've turned the Bloom's overlay on in the right panel — each section is tagged so the plateau shape is legible at a glance: spine sections at Remember, step tabs inheriting it, dropdowns all reference material. Two edits are ready now, both on the spine of the lesson.\n\n### 1. The opener tells instead of asks\n\n{{{card:diff:section-1}}}\n\nRight now Section 1 opens with \"First, install the Anthropic SDK.\" That's a Remember instruction. The edit reframes it as a design checkpoint: name the user, name the job, name what good output looks like, write those at the top of the file, *then* install. Install still happens — but every later decision gets judged against the three answers. Same install command, Apply-tier framing around it.\n\n### 2. System prompts are documented, not taught\n\n{{{card:diff:section-2}}}\n\n\"Make your system prompt as detailed as you want\" tells the learner nothing actionable. The replacement gives a three-component rubric (who the user is, what they're trying to accomplish, what a good response looks like) and asks the learner to draft against it. A read-it-out-loud check closes the loop. Now the learner ends the section with their own system prompt, not just an understanding of where the parameter goes.\n\n---\n\nClick through to turn 2 and I'll apply both edits, then pull the structured-outputs section — it's the same pattern.",
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
