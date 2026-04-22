export type DemoTurn = {
  user: string
  assistant: string
}

export const DEMO_TURNS: DemoTurn[] = [
  {
    user:
      "Can you review the empathy mapping section of my \"Understanding the People You Build For\" draft? It feels too dense.",
    assistant:
      "Took a look. The empathy mapping section bundles the definition, the framework diagram, and two worked examples into a single 900-word block — that's too much for one beat.\n\n**What's working**\n- The definition is specific: *\"what they say / think / do / feel when the tool fails them.\"*\n- The first worked example (ticket triage) is concrete and short.\n\n**What's too heavy**\n- The second worked example restates the framework instead of exercising it — the learner has already absorbed it in example one.\n- The framework diagram arrives *after* 300 words of setup. It should anchor the section, not punctuate it.",
  },
  {
    user: "What specifically should I cut vs. keep?",
    assistant:
      "Here's the cut list:\n\n**Keep**\n- Definition (verbatim — it's doing work).\n- Framework diagram, but move it directly under the definition so it grounds the concept visually before the prose.\n- Worked example one (ticket triage).\n\n**Cut**\n- Worked example two — it's restating the framework, not exercising it. Replace with a prompt: *\"Now map your own internal tool failure. One sentence per quadrant.\"*\n- The \"Why empathy matters\" preamble. Three paragraphs of motivation before the definition. The opening hook already earned the reader's attention.\n\nExpected effect: section drops from ~900 to ~450 words, and you move from Understand → Apply on Bloom's taxonomy.",
  },
  {
    user: "Good. Any concerns about the objectives after those edits?",
    assistant:
      "Checked the three objectives against the revised section:\n\n1. *\"Define the four empathy map quadrants\"* — cleanly met by the kept definition.\n2. *\"Identify two empathy failure modes in a workflow\"* — the kept worked example delivers one; the prompt asks the learner to surface a second. Good fit.\n3. *\"Apply empathy mapping to a feature request\"* — previously implicit; now explicit because the prompt is the application.\n\nNo gaps. The edits actually tighten the objectives-to-content alignment rather than loosen it — the section now has one job per objective instead of the old pattern of one objective spread across three passages.",
  },
]
