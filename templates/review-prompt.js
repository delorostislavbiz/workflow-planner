// review-workflow: a multi-agent hole-check of a WORKFLOW PROMPT (not of code).
// This is the deep, opt-in counterpart of the Prompt Helper's inline-check
// (see reference/review-workflow.md for consent rules and when to offer it).
//
// How to deliver: copy into <project>/.claude/workflows/review-workflow-prompt.js.
// The prompt under review is passed at run time via `args` (a string) - the
// script itself needs NO placeholders filled.
// LANGUAGE: before delivering, translate the agent prompts and log lines into
// the user's language (the synthesis is already instructed to answer in the
// language of the reviewed prompt).
// It never runs the target workflow - it only reads the prompt text.

export const meta = {
  name: 'review-workflow-prompt',
  description: 'Deep hole-check of a workflow prompt: 6 skeptic lenses in parallel -> dedup -> one ranked verdict',
  phases: [{ title: 'Review' }, { title: 'Synthesis' }],
}

// args = the workflow prompt under review, as a plain string.
if (!args || typeof args !== 'string' || args.trim().length < 40) {
  log('No prompt text received - run this workflow with args = the prompt under review (a string).')
  return null
}

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'important', 'minor'] },
          checklist_item: { type: 'string' },
          quote: { type: 'string' },
          problem: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'checklist_item', 'quote', 'problem', 'fix'],
      },
    },
  },
  required: ['findings'],
}

// One lens per known failure class of workflow prompts
// (the pitfalls list in reference/prompt-helper.md, Step 5).
const LENSES = [
  { key: 'goal', focus: 'Goal and output (checklist items 1-2): is the goal stated so an outsider could check it? Is the expected output named? Vague goals scatter the agents.' },
  { key: 'shape', focus: 'Units and dependencies (checklist items 3-4): are the units of parallelism real and same-type? Is anything presented as parallel that actually depends on another branch (fake parallelism)? Is a needed barrier missing, or a barrier demanded where none is needed? Is this agent-washing - a task that needs no workflow at all?' },
  { key: 'anchor', focus: 'Shared source of truth (checklist item 5): do several chunks cite one not-yet-fixed source (command list, schema, glossary, numbering)? If yes, is there a phase-0 anchor that fixes it before the parallel chunks, and is the fixed source passed into every chunk prompt?' },
  { key: 'data', focus: 'Data for blind agents (checklist item 6): does each agent prompt carry everything the agent needs alone - goal, inputs, paths/links, constraints, output format? Any "see the context above" or reliance on what other agents know is a defect: agents are blind.' },
  { key: 'verify', focus: 'Verification (checklist items 7 and 9): is each unit checked by CONTENT (not by count - "N done" hides defects)? Are the acceptance criteria observable predicates an outsider could re-run? Is the final check independent of the maker?' },
  { key: 'risk', focus: 'Autonomy, risk and write-boundaries (checklist items 8 and 10): which steps write, delete, cost money, or touch external services - and does the prompt require confirmation before them instead of promising blind autonomy? Do parallel agents write into overlapping files without ownership rules or worktree isolation?' },
]

phase('Review')
const reviews = await parallel(LENSES.map((l) => () =>
  agent(
    `You are a skeptical reviewer of a WORKFLOW PROMPT (a task description for multi-agent orchestration). Your single lens:\n${l.focus}\n\nPrompt under review:\n---\n${args}\n---\n\nReport only defects visible through your lens, with an exact quote from the prompt for each. Do not invent problems to look useful: if the prompt is clean through this lens, return an empty findings list. Do not review anything outside your lens. severity: blocker = the workflow will fail or cause harm; important = results will be degraded; minor = polish.`,
    { label: `lens:${l.key}`, phase: 'Review', schema: FINDINGS }
  )
))

// The barrier is deliberate: dedup needs ALL lens results at once.
const all = reviews.filter(Boolean).flatMap((r) => r.findings)
if (all.length === 0) {
  // Short-circuit: nothing to synthesize. 'ready' matches the documented verdict scale.
  log('All lenses returned clean - no holes found.')
  return { verdict: 'ready', findings: [] }
}
const seen = new Set()
const deduped = []
for (const f of all) {
  const key = `${f.checklist_item}|${f.quote.slice(0, 60).toLowerCase().trim()}`
  if (!seen.has(key)) { seen.add(key); deduped.push(f) }
}
log(`${all.length} raw findings -> ${deduped.length} after dedup`)

phase('Synthesis')
const report = await agent(
  `You are consolidating a review of a workflow prompt. Answer in the language the prompt under review is written in.\n\nPrompt under review:\n---\n${args}\n---\n\nDeduplicated findings from 6 review lenses (JSON):\n${JSON.stringify(deduped, null, 2)}\n\nProduce, in this order:\n1. A one-line verdict: ready / needs fixes / needs rebuilding.\n2. Findings ranked blocker -> important -> minor, each with its quote and a concrete fix.\n3. Patch recommendations in keep / fix / add / remove form - patch the existing prompt, do NOT rewrite it from scratch.\nDrop findings that contradict each other or the prompt text; keep only what a careful reader would confirm.`,
  { label: 'synthesis', phase: 'Synthesis' }
)
return report
