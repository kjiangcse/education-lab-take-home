import type { Course, BloomLevel } from '@/lib/types/course'
import type { Lesson } from '@/lib/types/lesson'

const COURSE_ID = 'course-internal-tools'

function comingSoonLesson(args: {
  id: string
  name: string
  short_description: string
  blooms_profile: BloomLevel
  duration_minutes: number
  objective_count: number
}): Lesson {
  const { id, name, short_description, blooms_profile, duration_minutes, objective_count } = args
  return {
    id,
    course_id: COURSE_ID,
    name,
    short_description,
    duration_minutes,
    blooms_profile,
    objectives: Array.from({ length: objective_count }, (_, i) => `Objective ${i + 1} — coming soon.`),
    blocks: [
      {
        kind: 'richtext',
        id: 'section-1',
        content:
          '<div style="text-align: center; padding: 60px 20px;">' +
          '<p style="font-size: 15px; color: rgb(115, 114, 108); margin-bottom: 8px;">Coming Soon</p>' +
          '<p style="font-size: 13px; color: rgb(170, 169, 165);">This lesson is under development.</p>' +
          '</div>',
      },
    ],
  }
}

export const SAMPLE_COURSE: Course = {
  id: COURSE_ID,
  name: 'Building Better Internal Tools with Claude',
  short_description:
    'A hands-on course for coworkers building custom internal tooling — from understanding user needs to designing, prototyping, and shipping tools that actually get adopted.',
  about:
    "This course walks engineers and ops-adjacent teammates through building internal tools that actually get used. It covers how to identify the real workflow problems behind feature requests, how to design tools that fit into how people already work, and how to use Claude as a building block — from prompts, to structured outputs, to full workflow integrations. The goal is fewer shelved dashboards and more tools coworkers reach for.",
  learning_objectives: [
    'Interview coworkers about their workflows without leading them toward a preferred solution',
    'Apply a compressed design-thinking process to scope a tool before building it',
    'Build custom tools on top of Claude using system prompts, structured outputs, and tool use',
    'Integrate AI-powered tools into existing workflows (Slack, Notion, internal APIs)',
    'Measure adoption and decide when to iterate, pivot, or sunset an internal tool',
  ],
  prerequisites: [
    'Basic familiarity with APIs and command-line tools',
    'Access to a Claude API key or Claude Code',
    'At least one internal workflow you find frustrating',
  ],
  audience:
    'Coworkers across engineering, ops, and support who want to build tools for their teammates — not to replace a product team, but to solve small internal problems faster than a full product cycle would allow.',
  estimated_duration: '3 hours',
  target_level: 'Beginner → Intermediate',
  default_lesson_id: 'l2',
}

// ── Lesson 2: Design Thinking (the showcase lesson) ────────────────────
// Richtext → Richtext → bridging prose → Tabs gallery → bridging prose →
// Dropdowns group. Every component sits next to at least a sentence or two
// of framing; nothing stacks flush against another component.

const DESIGN_THINKING_LESSON: Lesson = {
  id: 'l2',
  course_id: COURSE_ID,
  name: 'Design Thinking for Internal Tools',
  short_description:
    'Apply design thinking to internal workflows. Learn why internal tools fail when built from requirements alone, and how to build ones that actually get used.',
  duration_minutes: 30,
  blooms_profile: 'apply',
  objectives: [
    'Apply the design thinking framework to an internal workflow problem',
    'Distinguish between stated requirements and actual user needs',
    'Build a rapid prototype that tests your riskiest assumption first',
    'Evaluate whether a tool solves the right problem before investing in polish',
  ],
  blocks: [
    {
      kind: 'richtext',
      id: 'section-1',
      label: 'Introduction',
      content:
        '<h3>Why Most Internal Tools Fail</h3><p>Internal tools fail for a specific reason: they\'re built from requirements documents instead of observed behavior. A manager says "we need a dashboard for X" and someone builds a dashboard for X. Six months later nobody uses it because the actual problem was never the absence of a dashboard.</p><p>Design thinking gives you a framework for figuring out what the actual problem is before you build anything.</p>',
      blooms_level: 'understand',
      blooms_note: 'Strong problem framing — names the failure mode before introducing the framework.',
      feedback: {
        edits: [
          {
            original: "they're built from requirements documents instead of observed behavior",
            replacement:
              'they solve the problem as described in a ticket rather than the problem as experienced by the person doing the work',
            reason:
              'Makes the gap concrete — "ticket vs. lived experience" is more actionable than "requirements vs. behavior."',
          },
        ],
        explanation:
          'Good framing but slightly abstract. Grounding the "requirements vs. behavior" gap in a specific artifact (the ticket) makes the lesson\'s central tension immediately recognizable.',
      },
    },
    {
      kind: 'richtext',
      id: 'section-2',
      label: 'The Framework',
      content:
        '<h3>Design Thinking in 30 Minutes, Not 3 Months</h3><p>The full design thinking process — empathize, define, ideate, prototype, test — was designed for product teams with months of runway. Internal tools don\'t have that luxury. Here\'s the compressed version:</p><p><strong>Shadow, don\'t interview.</strong> Sit with the person doing the work for 20 minutes. Watch what they actually do, not what they say they do. Note the workarounds — those are your feature list.</p><p><strong>Frame the problem as a verb, not a noun.</strong> "We need a reporting tool" is a noun. "Sales reps spend 40 minutes every Monday manually pulling numbers from three sources" is a verb. Build for the verb.</p><p><strong>Prototype the riskiest assumption.</strong> Don\'t build the whole tool. Build the one piece that, if it doesn\'t work, means the whole tool is pointless. Test that first.</p>',
      blooms_level: 'apply',
      blooms_note: 'Actionable framework with specific techniques. Good Apply-level content.',
      feedback: {
        edits: [
          {
            original: 'was designed for product teams with months of runway',
            replacement:
              'assumes you have weeks for research and iteration. Internal tool builders usually have days',
            reason: 'Quantifying the time constraint makes the compression feel earned rather than lazy.',
          },
          {
            original: 'those are your feature list',
            replacement:
              'each workaround is a feature candidate, ranked by how often it happens and how much it costs',
            reason: 'Adds a prioritization lens — not all workarounds are worth automating.',
          },
        ],
        explanation:
          'The framework section is strong. The two edits add specificity: quantifying the time constraint and introducing prioritization.',
      },
    },
    {
      kind: 'richtext',
      id: 'section-3',
      label: 'Running a Shadow Session',
      content:
        '<h3>Putting the Framework to Work</h3><p>The three techniques above only pay off when you actually go sit with someone. The tabs below walk through what to do <em>before</em>, <em>during</em>, and <em>after</em> a 20-minute shadow session — the same arc you\'ll use every time you investigate a new workflow.</p>',
      blooms_level: 'apply',
    },
    {
      kind: 'tabs',
      id: 'tabs-1',
      items: [
        {
          id: 'tab-1',
          heading: 'Before',
          content: '<h4>Before the Session</h4><p>Identify one workflow that feels painful to the people doing it. Schedule 20 minutes to shadow someone through it. Bring a notebook, not a requirements doc.</p>',
          blooms_level: 'apply',
          feedback: {
            edits: [
              {
                original: 'Identify one workflow that feels painful to the people doing it.',
                replacement: 'Pick one workflow where you\'ve heard a coworker sigh, swear, or say "I just deal with it."',
                reason: 'Concrete behavioral signals beat an abstract "feels painful" test — learners know what to look for.',
              },
            ],
            explanation: 'Strong setup step. Sharpening the detection criteria makes this actionable on Monday morning.',
          },
        },
        {
          id: 'tab-2',
          heading: 'During',
          content: '<h4>During the Shadow</h4><p>Watch without suggesting solutions. Note every manual step, every copy-paste, every "I just have to do this part by hand." Ask "why" only when they pause naturally.</p>',
          blooms_level: 'apply',
        },
        {
          id: 'tab-3',
          heading: 'After',
          content: '<h4>After the Session</h4><p>List the workarounds you observed. Rank them by frequency × impact. Pick the top one. Frame it as a verb. Sketch a prototype that addresses only that verb — nothing else.</p>',
          blooms_level: 'evaluate',
          feedback: {
            edits: [
              {
                original: 'List the workarounds you observed. Rank them by frequency × impact.',
                replacement: 'List every workaround you saw. Rank them by how often they happen and how much time they cost each time.',
                reason: 'Spelling out what "frequency × impact" means removes a math-y abstraction for a concrete prompt learners can actually apply.',
              },
            ],
            explanation: 'The activity shape is solid — the one lever worth pulling is the ranking instruction. Swap the formula shorthand for plain-language criteria so learners know what "rank" actually means without decoding the notation.',
          },
        },
      ],
    },
    {
      kind: 'richtext',
      id: 'section-4',
      label: 'Working Resources',
      content:
        '<h3>Templates and Checklists</h3><p>Each supporting resource below deepens one step from the framework: a shadow-session template for the first 20 minutes, a reframing exercise for the problem statement, and a prototype-scoping checklist for the build decision. Open whichever one matches what you\'re stuck on.</p>',
      blooms_level: 'apply',
    },
    {
      kind: 'dropdowns',
      id: 'dropdowns-1',
      items: [
        {
          id: 'dropdown-1',
          heading: 'Shadow Session Template',
          content: '<p>A 20-minute observation guide: what to watch for, how to take notes without disrupting workflow, and how to debrief with the person afterward.</p>',
          blooms_level: 'apply',
          blooms_note: 'Practical tool — Apply level.',
        },
        {
          id: 'dropdown-2',
          heading: 'Problem Framing Exercise',
          content: '<p>Take a noun-framed request ("we need a dashboard") and reframe it as a verb ("the team spends X hours doing Y because Z"). Three examples with worked solutions.</p>',
          blooms_level: 'analyze',
          blooms_note: 'Reframing requires decomposition — Analyze level.',
          feedback: {
            edits: [
              {
                original: 'Problem Framing Exercise',
                replacement: 'Reframe the Ask: Noun to Verb',
                reason: 'Name tells learners what they\'ll actually do, not just the topic.',
              },
              {
                original: 'Three examples with worked solutions.',
                replacement: 'Three worked examples, each showing the reframe and why it changes what you build.',
                reason: 'Previews the pedagogical payoff — not just the count of examples.',
              },
            ],
            explanation: 'Good activity. The heading reads as a topic ("Exercise") rather than an action. Renaming it to the verb the learner performs makes the dropdown self-describing.',
          },
        },
        {
          id: 'dropdown-3',
          heading: 'Prototype Scoping Checklist',
          content: '<p>How to identify your riskiest assumption, scope a prototype that tests it, and decide in under a day whether to proceed or pivot.</p>',
          blooms_level: 'evaluate',
          blooms_note: 'Decision-making against criteria — Evaluate level.',
        },
      ],
    },
  ],
}

// ── Lesson 1: Written by a "knowledge dumper" ──────────────────────────
// Richtext (intro) → Richtext (empathy) → Richtext (interviews) →
// Bridging richtext → Tabs → Bridging richtext → Dropdowns. Intentionally
// still flawed pedagogically — that's the critique — but no longer stacks
// components back-to-back with no prose in between.

const UNDERSTANDING_PEOPLE_LESSON: Lesson = {
  id: 'l1',
  course_id: COURSE_ID,
  name: 'Understanding the People You Build For',
  short_description:
    'Empathy mapping for internal users. How to interview coworkers about their workflows without leading them.',
  duration_minutes: 25,
  blooms_profile: 'understand',
  objectives: [
    'Understand empathy mapping',
    'Learn about user interviews',
    'Know the difference between pain points and habits',
    'Be familiar with workflow observation techniques',
  ],
  blocks: [
    {
      kind: 'richtext',
      id: 'section-1',
      label: 'Introduction',
      content:
        '<h3>User Research for Internal Tools</h3><p>User research is an important part of building internal tools. When you understand your users, you can build better tools. There are many methods for understanding users including empathy mapping, contextual inquiry, user interviews, surveys, diary studies, and card sorting. In this lesson we will cover empathy mapping and interviews because they are the most relevant for internal tool development. Empathy mapping was developed by Dave Gray and is used by design teams at companies like IDEO, Google, and Microsoft. User interviews are a qualitative research method that involves asking users questions about their experiences, workflows, and pain points. Both methods help you understand what users need, think, feel, and do.</p>',
      blooms_level: 'remember',
      blooms_note: 'Information dump — lists methods without teaching any of them. Classic knowledge-dumper pattern.',
      feedback: {
        edits: [
          {
            original: 'User research is an important part of building internal tools. When you understand your users, you can build better tools.',
            replacement: 'The fastest way to build an internal tool nobody uses is to skip talking to the people who\'d use it.',
            reason: 'Opens with stakes instead of a truism. The original tells learners something they already believe.',
          },
          {
            original: 'There are many methods for understanding users including empathy mapping, contextual inquiry, user interviews, surveys, diary studies, and card sorting.',
            replacement: 'We\'re going to focus on two methods — empathy mapping and lightweight interviews — because they work in a single afternoon without any special training.',
            reason: 'The list of six methods is a reference-doc habit. A lesson should narrow, not enumerate.',
          },
        ],
        explanation: 'This introduction reads like the first paragraph of a Wikipedia article. It tells the learner that user research exists and names six methods without teaching any of them. The fix: cut the catalog, open with a concrete consequence of skipping research, and promise something actionable.',
      },
    },
    {
      kind: 'richtext',
      id: 'section-2',
      label: 'Empathy Mapping',
      content:
        '<h3>What is Empathy Mapping?</h3><p>An empathy map is a collaborative visualization used to articulate what we know about a particular type of user. It externalizes knowledge about users in order to create a shared understanding of user needs and aid in decision making. An empathy map consists of four quadrants: Says, Thinks, Does, and Feels. The Says quadrant contains direct quotes from the user. The Thinks quadrant contains what the user might be thinking but not saying. The Does quadrant contains the actions and behaviors you observe. The Feels quadrant contains the emotional state of the user. To create an empathy map, you should gather your team, select a user persona, fill in each quadrant based on your research data, and then discuss patterns across the quadrants. Empathy maps can be created using sticky notes on a whiteboard, digital tools like Miro or FigJam, or even a simple document with four sections. The key is to focus on real observations rather than assumptions.</p>',
      blooms_level: 'remember',
      blooms_note: 'Wall of text. Defines everything but teaches nothing — learner cannot create an empathy map after reading this.',
      feedback: {
        edits: [
          {
            original: 'An empathy map is a collaborative visualization used to articulate what we know about a particular type of user. It externalizes knowledge about users in order to create a shared understanding of user needs and aid in decision making.',
            replacement: 'An empathy map is a 2x2 grid: Says, Thinks, Does, Feels. You fill it in by observing a real person doing real work — not by guessing in a conference room.',
            reason: 'The original is a textbook definition. The revision is an instruction you can act on.',
          },
        ],
        explanation: 'This section has the classic knowledge-dump structure: define the concept, list its parts, describe the process, mention the tools. A learner finishes knowing what an empathy map *is* but not how to *make one that\'s useful*. Break the wall of text into a worked example.',
      },
    },
    {
      kind: 'richtext',
      id: 'section-3',
      label: 'User Interviews',
      content:
        '<h3>Conducting User Interviews</h3><p>User interviews are a fundamental qualitative research method. There are several types of interviews: structured interviews use a fixed set of questions, semi-structured interviews follow a guide but allow exploration, and unstructured interviews are free-flowing conversations. For internal tool development, semi-structured interviews are most appropriate because they balance consistency with flexibility. When conducting interviews, it\'s important to prepare an interview guide, recruit participants, create a comfortable environment, ask open-ended questions, listen actively, take detailed notes, avoid leading questions, and follow up on interesting responses. Common mistakes include asking yes/no questions, suggesting answers, interviewing in groups where social dynamics influence responses, and not recording the session for later analysis. After the interview, you should transcribe your notes, identify themes, and share findings with your team.</p>',
      blooms_level: 'remember',
      blooms_note: 'Another information dump — eight things to do, four mistakes to avoid, three follow-up steps. No prioritization, no examples.',
      feedback: {
        edits: [
          {
            original: 'There are several types of interviews: structured interviews use a fixed set of questions, semi-structured interviews follow a guide but allow exploration, and unstructured interviews are free-flowing conversations.',
            replacement: 'Use semi-structured interviews. The other types exist but don\'t matter for your use case.',
            reason: 'Listing three types when only one is recommended wastes the learner\'s attention on options they won\'t use.',
          },
        ],
        explanation: 'The specialist who wrote this knows a lot about interviewing — and that\'s the problem. They\'ve written everything they know instead of what the learner needs. A lesson about interviewing for internal tools needs three things: a sample question list, one live example, and the top two mistakes. Not a catalog.',
      },
    },
    {
      kind: 'richtext',
      id: 'section-4',
      label: 'Methods at a Glance',
      content:
        '<h3>Comparing the Two Methods Side by Side</h3><p>Before you pick a method for a specific coworker, it helps to see them in context. The overview tab below summarizes where each one fits; the resources tab collects the background reading for learners who want more depth.</p>',
      blooms_level: 'remember',
    },
    {
      kind: 'tabs',
      id: 'tabs-1',
      items: [
        {
          id: 'tab-1',
          heading: 'Overview',
          content: '<h4>Methods Overview</h4><p>This tab provides an overview of the two research methods covered in this lesson: empathy mapping and user interviews. Both are qualitative methods suited for understanding internal users.</p>',
          blooms_level: 'remember',
        },
        {
          id: 'tab-2',
          heading: 'Resources',
          content: '<h4>Additional Resources</h4><p>Books: "Interviewing Users" by Steve Portigal. "Practical Empathy" by Indi Young. Articles: Nielsen Norman Group guides on empathy mapping and contextual inquiry.</p>',
          blooms_level: 'remember',
        },
      ],
    },
    {
      kind: 'richtext',
      id: 'section-5',
      label: 'Take-Home Templates',
      content:
        '<h3>Materials for Your Next Session</h3><p>The two resources below are meant to leave the lesson with you — a question bank to draw from in your next interview, and a blank empathy map template for your first shadow session. Print them, fork them, or copy them into your own notebook.</p>',
      blooms_level: 'remember',
    },
    {
      kind: 'dropdowns',
      id: 'dropdowns-1',
      items: [
        {
          id: 'dropdown-1',
          heading: 'Interview Question Bank',
          content:
            '<p>A comprehensive bank of 25 questions you can draw from during user interviews, organized into five categories: workflow questions, pain-point questions, tool-usage questions, wish-list questions, and contextual questions. Workflow questions explore how the user performs their work day to day and are best at the start of an interview to establish context. Pain-point questions surface friction and are best asked after trust has been established. Tool-usage questions explore which tools the user actively relies on versus merely tolerates. Wish-list questions give the user permission to imagine alternatives. Contextual questions explore the environment, stakeholders, and constraints around the work. Use the bank as a menu, not a script, and adapt phrasing to match the participant\'s vocabulary and role. A printable PDF and a Notion-friendly version are both available to download.</p>',
          blooms_level: 'remember',
          blooms_note: '25 questions with no guidance on which to use when. Reference material, not a teaching tool.',
          feedback: {
            edits: [
              {
                original:
                  'Workflow questions explore how the user performs their work day to day and are best at the start of an interview to establish context. Pain-point questions surface friction and are best asked after trust has been established. Tool-usage questions explore which tools the user actively relies on versus merely tolerates. Wish-list questions give the user permission to imagine alternatives. Contextual questions explore the environment, stakeholders, and constraints around the work.',
                replacement:
                  'Pick one question from each category for your first interview. The full descriptions and worked examples live in the linked PDF.',
                reason:
                  'A dropdown should point at the artifact, not re-teach each category inline. Keep the categories visible, push the explanations to the reference material.',
              },
              {
                original: 'Use the bank as a menu, not a script, and adapt phrasing to match the participant\'s vocabulary and role.',
                replacement: 'Adapt phrasing to the participant; the bank is a menu, not a script.',
                reason: 'Same instruction, half the words.',
              },
            ],
            explanation: 'The question bank\'s content is valuable, but it does not belong inside a collapsed dropdown. Two fixes go together: (1) promote it to its own richtext section so learners see the categories without clicking, and (2) trim the inline descriptions so the dropdown text is a pointer to the artifact, not a duplicate explanation. These edits apply #2; the structural promotion is a separate move.',
          },
        },
        {
          id: 'dropdown-2',
          heading: 'Empathy Map Template',
          content:
            '<p>A printable and editable empathy map template featuring the four classic quadrants (Says, Thinks, Does, and Feels) along with space for notes, participant metadata, observation date, and researcher initials. Available in three formats: a PDF optimized for printing on letter-size paper, a Figma file for digital annotation, and a Miro board your team can duplicate into its own workspace. The template also includes two optional extensions that some teams find useful: a Pains and Gains row inspired by the Value Proposition Canvas, and a small Environment section for notes about where the observation took place and what tools were present.</p>',
          blooms_level: 'remember',
          blooms_note: 'A blank template without a worked example. Learner won\'t know what "good" looks like.',
          feedback: {
            edits: [
              {
                original:
                  'The template also includes two optional extensions that some teams find useful: a Pains and Gains row inspired by the Value Proposition Canvas, and a small Environment section for notes about where the observation took place and what tools were present.',
                replacement:
                  'The template also includes a filled-in example map so learners see what a good one looks like before trying their own.',
                reason:
                  'A worked example teaches more than optional extensions. Swap the extensions blurb for a sample the learner can pattern-match against.',
              },
            ],
            explanation: 'The current description offers a catalog of structural options (Pains and Gains row, Environment section). A template without an example tells the learner what the grid looks like but not what a good one contains. Replacing the extensions note with a filled-in sample turns the template from a blank container into a teaching tool.',
          },
        },
      ],
    },
  ],
}

// ── Lesson 3: Written by a "feature describer" ──────────────────────────
// Same interleaving discipline as lessons 1 and 2: rich-text bridges
// before the tab gallery and before the dropdowns group so nothing stacks
// flush.

const CLAUDE_TOOLS_LESSON: Lesson = {
  id: 'l3',
  course_id: COURSE_ID,
  name: 'Custom Claude Tools — From Prompt to Product',
  short_description:
    'Building custom tools on top of Claude. System prompts as product specs, structured outputs, tool use patterns.',
  duration_minutes: 35,
  blooms_profile: 'apply',
  objectives: [
    'Set up a Claude API project with authentication',
    'Write a system prompt for a custom tool',
    'Use structured outputs to get JSON from Claude',
    'Implement tool use to let Claude call external functions',
    'Deploy a basic Claude-powered tool',
  ],
  blocks: [
    {
      kind: 'richtext',
      id: 'section-1',
      label: 'Getting Started',
      content:
        '<h3>Setting Up Your Environment</h3><p>First, you\'ll need to install the Anthropic SDK. Run <code>npm install @anthropic-ai/sdk</code> in your terminal. Then create a new file called <code>tool.ts</code> and add the following code:</p><p><code>import Anthropic from \'@anthropic-ai/sdk\';<br/>const client = new Anthropic();</code></p><p>Make sure you have your API key set in your environment variables as <code>ANTHROPIC_API_KEY</code>. You can get an API key from console.anthropic.com. Once you have the SDK installed and your key configured, you\'re ready to start building.</p>',
      blooms_level: 'remember',
      blooms_note: 'Jumps to setup without explaining why. A learner follows the steps but doesn\'t understand the architecture.',
      feedback: {
        edits: [
          {
            original: 'First, you\'ll need to install the Anthropic SDK.',
            replacement: 'Before you install anything, name three things about your tool: who it\'s for, what job it does, and what a good response looks like. Write those three answers at the top of <code>tool.ts</code> as comments — every later decision, from model choice to prompt wording, gets judged against them. With that in hand, install the Anthropic SDK.',
            reason: 'Turns the opening from an instruction into a design checkpoint. The learner has to make three specific decisions before running a command, and the answers become the spec every later step is tested against.',
          },
          {
            original: 'Once you have the SDK installed and your key configured, you\'re ready to start building.',
            replacement: 'Once the SDK is installed and your key is configured, sketch your first request against the three answers you wrote at the top of the file. If the system prompt you\'d send doesn\'t reference who the user is or what good output looks like, revise the three answers before you revise the prompt — that\'s where the gap actually lives.',
            reason: 'Turns "ready to start" into an application step. The learner uses their three answers as a rubric against their own draft, which is Apply-tier work.',
          },
        ],
        explanation: 'The section currently reads as a recall drill: install, configure, start. After these two edits, install still happens but it is sandwiched between a design checkpoint (three answers at the top of the file) and an application step (check your first draft against those answers). Same content, same install command — but now every step is in service of decisions the learner has to make.',
        blooms_level_after: 'apply',
      },
    },
    {
      kind: 'richtext',
      id: 'section-2',
      label: 'System Prompts',
      content:
        '<h3>Writing System Prompts</h3><p>A system prompt tells Claude how to behave. To set a system prompt, pass it as the <code>system</code> parameter in your API call:</p><p><code>const response = await client.messages.create({<br/>&nbsp;&nbsp;model: "claude-sonnet-4-5-20250929",<br/>&nbsp;&nbsp;max_tokens: 1024,<br/>&nbsp;&nbsp;system: "You are a helpful support agent for Acme Corp.",<br/>&nbsp;&nbsp;messages: [{ role: "user", content: "How do I reset my password?" }]<br/>});</code></p><p>You can make your system prompt as detailed as you want. Include instructions about tone, format, what to include and exclude, and any specific knowledge the tool should have. The better your system prompt, the better your tool will perform.</p>',
      blooms_level: 'understand',
      blooms_note: 'Shows the code but doesn\'t teach prompt design. "Make it as detailed as you want" is anti-guidance.',
      feedback: {
        edits: [
          {
            original: 'You can make your system prompt as detailed as you want. Include instructions about tone, format, what to include and exclude, and any specific knowledge the tool should have. The better your system prompt, the better your tool will perform.',
            replacement: 'A system prompt is a product spec for Claude. Draft yours with three named components before you add tone or format: <strong>who the user is</strong>, <strong>what they\'re trying to accomplish</strong>, and <strong>what a good response looks like</strong>. Then read the draft out loud. If you can\'t name all three in your own words just from reading it back, the spec isn\'t tight enough yet — revise until you can.',
            reason: '"Make it as detailed as you want" gives no direction. The revision gives the learner a specific three-component rubric, asks them to draft against it, and names a concrete test ("read it out loud") they can use to judge their own work.',
          },
        ],
        explanation: 'The section currently documents the `system` parameter but treats prompt design as optional craft. The edit turns the closing paragraph into a hands-on exercise: draft the three components, then validate by reading the draft back. The learner ends the section with an actual system prompt they wrote, not just an understanding of where the parameter goes.',
        blooms_level_after: 'apply',
      },
    },
    {
      kind: 'richtext',
      id: 'section-3',
      label: 'Structured Outputs',
      content:
        '<h3>Getting Structured Data from Claude</h3><p>Sometimes you need Claude to return data in a specific format. You can do this by asking for JSON in your prompt. Add instructions like "Return your response as a JSON object with the following fields: name, description, priority." Claude will format its response accordingly. For more reliable structured outputs, you can use the <code>response_format</code> parameter or parse the response with a schema validator like Zod.</p>',
      blooms_level: 'remember',
      blooms_note: 'Correct but surface-level. Tells you to use JSON but doesn\'t teach when or why structured outputs matter for tool-building.',
      feedback: {
        edits: [
          {
            original: 'Sometimes you need Claude to return data in a specific format. You can do this by asking for JSON in your prompt. Add instructions like "Return your response as a JSON object with the following fields: name, description, priority." Claude will format its response accordingly.',
            replacement: 'Your output format is a design decision driven by what your code does with the response, not a generic JSON request. Before you prompt for structure, decide the downstream use: if your code renders a card, the shape is the card\'s fields; if it triggers a workflow, the shape is the workflow\'s inputs; if it routes a ticket, the shape is the router\'s required keys. Write that shape down first, then ask Claude to return exactly it — e.g., "Return a JSON object with the fields: name, description, priority."',
            reason: 'The original tells the learner to ask for JSON without explaining why or how to pick the shape. The revision forces the learner to map downstream use to output shape before writing the prompt — that\'s the Apply move the objective promised.',
          },
        ],
        explanation: 'This section describes the feature but never asks the learner to decide what structure their own tool needs. The edit reframes structured outputs as a design decision driven by the code that consumes the response, gives three concrete downstream scenarios as scaffolding, and asks the learner to choose one before writing the prompt. The API syntax stays at the end so the learner still sees how to express their chosen shape.',
        blooms_level_after: 'apply',
      },
    },
    {
      kind: 'richtext',
      id: 'section-4',
      label: 'Build Flow',
      content:
        '<h3>The Four-Step Build</h3><p>The tabs below sequence the whole build: install and configure, draft the system prompt, add structured output, and deploy for a teammate to try. Each step is self-contained so you can stop after any of them and still have something working.</p>',
      blooms_level: 'understand',
    },
    {
      kind: 'tabs',
      id: 'tabs-1',
      items: [
        { id: 'tab-1', heading: 'Step 1', content: '<h4>Install & Configure</h4><p>Install the SDK, set your API key, and verify the connection with a test message.</p>', blooms_level: 'remember' },
        { id: 'tab-2', heading: 'Step 2', content: '<h4>Write Your Prompt</h4><p>Create a system prompt for your tool. Test it with 3-5 different user inputs to see how it responds.</p>', blooms_level: 'remember' },
        { id: 'tab-3', heading: 'Step 3', content: '<h4>Add Structure</h4><p>Configure structured outputs so your tool returns parseable JSON. Validate the output matches your expected schema.</p>', blooms_level: 'remember' },
        { id: 'tab-4', heading: 'Step 4', content: '<h4>Deploy</h4><p>Package your tool as an API endpoint or CLI command. Share it with one teammate for feedback.</p>', blooms_level: 'remember' },
      ],
    },
    {
      kind: 'richtext',
      id: 'section-5',
      label: 'When You Get Stuck',
      content:
        '<h3>References for Tricky Moments</h3><p>Most builds stall on one of three things: an unfamiliar API surface, a blank-page system prompt, or an unhelpful error. The three references below map to those moments — open whichever matches your current stuck.</p>',
      blooms_level: 'remember',
    },
    {
      kind: 'dropdowns',
      id: 'dropdowns-1',
      items: [
        {
          id: 'dropdown-1',
          heading: 'API Reference',
          content: '<p>Complete API reference for the Anthropic SDK: authentication, message creation, streaming, system prompts, tool use, and structured outputs. With code examples in TypeScript and Python.</p>',
          blooms_level: 'remember',
          blooms_note: 'Reference material. Useful but not a teaching tool.',
        },
        {
          id: 'dropdown-2',
          heading: 'Code Templates',
          content: '<p>Copy-paste starter templates for common tool patterns: a support bot, a data extractor, a content reviewer, and a workflow automator. Each includes system prompt, message handling, and error handling.</p>',
          blooms_level: 'remember',
          blooms_note: 'Templates let learners start but don\'t help them understand when to deviate.',
        },
        {
          id: 'dropdown-3',
          heading: 'Troubleshooting Guide',
          content: '<p>Common errors and fixes: authentication failures, rate limits, malformed requests, unexpected outputs, and token limit issues. With error messages and solutions.</p>',
          blooms_level: 'remember',
          blooms_note: 'FAQ-style content. Helpful for reference, not for learning.',
        },
      ],
    },
  ],
}

// ── Lesson 4: Workflow Integration & Adoption ───────────────────────────
// A solid starting draft meant to be reviewed live in a chat. Intentional
// kickstart points left for the AI to flag: one unobservable objective
// ("understand"), one video placeholder with no script_note ("empty video"),
// and no knowledge check at the end.
const WORKFLOW_INTEGRATION_LESSON: Lesson = {
  id: 'l4',
  course_id: COURSE_ID,
  name: 'Workflow Integration & Adoption',
  short_description:
    'Embedding tools into existing workflows. Slack, Notion, and API integrations. Measuring adoption.',
  duration_minutes: 30,
  blooms_profile: 'analyze',
  objectives: [
    'Choose the right surface (Slack, Notion, email, or standalone) for a tool based on where the target user already works',
    'Design an integration that fits into an existing workflow rather than replacing it',
    'Instrument adoption signals from day one so you know whether the tool is being used, ignored, or worked around',
    'Understand common reasons internal tools fail to be adopted',
  ],
  blocks: [
    {
      kind: 'richtext',
      id: 'section-1',
      label: 'Introduction',
      content:
        '<h3>Integration is where tools live or die</h3><p>A tool that works perfectly in isolation can still go unused if it does not fit where people already spend their day. This lesson focuses on the step after you have built something: choosing where it lives, how it integrates with the surrounding workflow, and how you will know if it is actually working.</p>',
      blooms_level: 'understand',
      blooms_note: 'Framing section. Sets stakes cleanly without over-explaining.',
    },
    {
      kind: 'richtext',
      id: 'section-2',
      label: 'Choosing the surface',
      content:
        '<h3>Where does your user already live?</h3><p>Before picking a technology, figure out the surface. If the person who would use your tool lives in Slack all day, a web dashboard is a second home they will rarely visit. If they work in Notion, a CLI is a context switch. The right surface is usually the one they are already in.</p><p>The three most common surfaces for internal tools are Slack (fast, informal, ambient), Notion (document-shaped, shareable, searchable), and email (ubiquitous, asynchronous, heavy). Each fits different tool shapes.</p>',
      blooms_level: 'apply',
      blooms_note: 'Introduces a decision framework. Apply-level because the learner will actively pick.',
    },
    {
      kind: 'richtext',
      id: 'section-3',
      label: 'Three surfaces, three tradeoffs',
      content:
        '<h3>Three surfaces, three tradeoffs</h3><p>The tabs below break down what each surface is good at and where it falls short. Pick the surface that matches your tool\'s rhythm: does it surface answers conversationally, or does it produce artifacts that someone will reference later?</p>',
      blooms_level: 'apply',
    },
    {
      kind: 'tabs',
      id: 'tabs-1',
      items: [
        {
          id: 'tab-1',
          heading: 'Slack',
          content:
            '<h4>Slack: ambient and conversational</h4><p><strong>Best for:</strong> quick answers, ephemeral prompts, back-and-forth questions. Slash commands, workflow buttons, and bot mentions fit the shape of "I need this now, I will forget about it in ten minutes."</p><p><strong>Falls short for:</strong> anything that produces a reference artifact. Threads go cold, search is weak, and important outputs drift into noise within a day.</p>',
          blooms_level: 'analyze',
        },
        {
          id: 'tab-2',
          heading: 'Notion',
          content:
            '<h4>Notion: document-shaped and durable</h4><p><strong>Best for:</strong> outputs that other people will read, reference, or edit. Good for tools that produce summaries, decisions, specs, or tracked work.</p><p><strong>Falls short for:</strong> real-time interaction. Notion is where your tool\'s output lives; it is not where the conversation happens.</p>',
          blooms_level: 'analyze',
        },
        {
          id: 'tab-3',
          heading: 'Email',
          content:
            '<h4>Email: heavy but universal</h4><p><strong>Best for:</strong> outputs that must reach people who do not live in your other product surfaces. Good for summaries, digests, and escalations.</p><p><strong>Falls short for:</strong> fast iteration. Every email is a commit. There is no easy way to edit or retract once it is sent.</p>',
          blooms_level: 'analyze',
        },
      ],
    },
    {
      kind: 'richtext',
      id: 'section-4',
      label: 'See it in action',
      content:
        '<h3>See it in action</h3><p>The video below walks through wiring a Slack slash command to a Claude-powered tool end to end: the app manifest, the webhook handler, and the three lines of response formatting that make the output feel native to Slack rather than bolted-on.</p>',
      blooms_level: 'apply',
    },
    {
      kind: 'video',
      id: 'video-1',
      label: 'Slack integration walkthrough',
      title: 'Wiring a Slack slash command to Claude',
      duration: '2:30',
      // Intentional kickstart: no script_note. AI should flag this as an
      // "empty video" fault per the content-design skill.
      blooms_level: 'apply',
    },
    {
      kind: 'richtext',
      id: 'section-5',
      label: 'Signal design',
      content:
        '<h3>Signal design</h3><p>Once the tool is live, the next question is whether it is actually being used. Two quick references below: what to instrument from day one, and how to read the patterns you will see once real usage starts flowing through.</p>',
      blooms_level: 'apply',
    },
    {
      kind: 'dropdowns',
      id: 'dropdowns-1',
      items: [
        {
          id: 'dropdown-1',
          heading: 'Adoption Signal Checklist',
          content:
            '<p>The minimum adoption signals to capture on day one: unique users in the first week, repeat usage rate (the same user returning within seven days), drop-off after first use, and workaround signal (when someone does the thing the tool was built to do, by hand, after having used the tool once). Instrument all four before launch so you never have to backfill.</p>',
          blooms_level: 'apply',
          blooms_note: 'Practical checklist. Apply level — the learner will run this on their own tool.',
        },
        {
          id: 'dropdown-2',
          heading: 'Usage Patterns Cheat Sheet',
          content:
            '<p>Common patterns once usage starts flowing and what each one tells you. <strong>Spike then flatline:</strong> novelty, not adoption. <strong>Steady low use:</strong> a dedicated subset of users found real value. <strong>High repeat per user:</strong> the tool is solving a recurring problem for the people who found it. <strong>First-use then gone:</strong> the value was not obvious, or the setup cost was too expensive relative to the payoff.</p>',
          blooms_level: 'analyze',
          blooms_note: 'Interpretive. Analyze level — the learner has to map patterns to diagnoses.',
        },
      ],
    },
    {
      kind: 'richtext',
      id: 'section-6',
      label: 'When adoption does not happen',
      content:
        '<h3>When adoption does not happen</h3><p>If the signals say your tool is not being used, resist the urge to polish it more. Adoption failure is usually a fit problem, not a quality problem. Go back to where your user actually works and ask what they did instead. That conversation will tell you whether to pivot the tool, move the surface, or sunset the whole thing.</p>',
      blooms_level: 'evaluate',
      blooms_note: 'Decision-making against criteria. Evaluate level — but the lesson currently ends without a knowledge check to verify.',
    },
  ],
}

export const SAMPLE_LESSONS: Lesson[] = [
  UNDERSTANDING_PEOPLE_LESSON,
  DESIGN_THINKING_LESSON,
  CLAUDE_TOOLS_LESSON,
  WORKFLOW_INTEGRATION_LESSON,
  comingSoonLesson({
    id: 'l5',
    name: 'Evaluating & Iterating on Internal Tools',
    short_description:
      'Feedback loops for internal products. Usage analytics without surveillance. When to sunset a tool.',
    blooms_profile: 'evaluate',
    duration_minutes: 25,
    objective_count: 3,
  }),
]

export const SAMPLE_LESSONS_BY_ID: Record<string, Lesson> = Object.fromEntries(
  SAMPLE_LESSONS.map((l) => [l.id, l]),
)
