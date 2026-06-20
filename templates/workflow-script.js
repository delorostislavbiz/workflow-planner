// Dynamic Workflow JS script template.
// Generated from workflow-plan.md. One file = one workflow.
// Goes into <project>/.claude/workflows/<kebab-name>.js
// Fill in <...>, remove the unused pattern (parallel OR pipeline), drop the extra comments.

export const meta = {
  name: '<kebab-name>',                  // matches the file name
  description: '<one line: what it does>',
  phases: [{ title: '<Phase 1>' }, { title: '<Phase 2>' }],  // one per phase() call
}

// -------------------------------------------------------------
// PATTERN A: independent branches at once, then assembly (parallel = barrier)
// Use when the next step needs ALL results together.
// -------------------------------------------------------------
phase('<Phase 1>')
const branches = await parallel([
  () => agent('<branch A prompt: role + its atoms>', { label: 'A:<role>', phase: '<Phase 1>' }),
  () => agent('<branch B prompt: role + its atoms>', { label: 'B:<role>', phase: '<Phase 1>' }),
]).then(r => r.filter(Boolean))          // a failed agent -> null, filter it out
const [a, b] = branches

phase('<Phase 2>')
// Branch C depends on A and B - pass their results INTO THE PROMPT (the agent is blind).
const c = await agent(
  `<branch C prompt>\n\nInput A:\n${a}\n\nInput B:\n${b}`,
  { label: 'C:<role>', phase: '<Phase 2>' }
)
return c

// -------------------------------------------------------------
// PATTERN B: a flow of items through stages (pipeline = NO barrier, the DEFAULT)
// Each item flows on its own; verify is the second stage.
// -------------------------------------------------------------
// const items = [/* <list of independent units> */]
// const results = await pipeline(
//   items,
//   (item, _orig, i) => agent(`<stage 1: process> ${item}`, { label: `do:${i}`, phase: '<Phase 1>' }),
//   (res, item, i)   => agent(`<stage 2: check the result> ${res}`, { label: `verify:${i}`, phase: '<Phase 2>' }),
// )
// return results.filter(Boolean)

// -------------------------------------------------------------
// STRUCTURED OUTPUT (when the result is processed by code, not as text)
// -------------------------------------------------------------
// const SCHEMA = { type: 'object', properties: { items: { type: 'array', items: { type: 'string' } } }, required: ['items'] }
// const data = await agent('<prompt>', { schema: SCHEMA })   // -> validated object
// data.items.forEach(/* ... */)

// Limits reminder: concurrent min(16, cores-2), at most 1000 per run.
// Not allowed in the script: Date.now(), Math.random(), new Date() with no args. Plain JS only, not TS.
