# Examples

Four contrasting runs: a plain fit, a clear no-fit, a shared-source task that needs a phase-0 anchor, and an unknown-size discovery loop. The gate's reasoning and the resulting artifact are shown.

---

## Example 1: fits a workflow

**User task:** "Check 20 site pages for SEO issues and assemble a summary report."

**Gate reasoning:** 20 same-type independent units (pages) - they can be checked at once. Plus a final assembly from all results. The volume justifies a background run. -> **Fits.** Parallel checks + a barrier before the synthesis (the report needs all results).

**Plan (workflow-plan.md, short):**

- Phase 1 "Checks" [parallel, branches independent]: one checker agent per page. Branch output: the page's list of SEO issues.
- Phase 2 "Synthesis" [depends on Phase 1]: one agent takes all 20 results and assembles a summary report. Input: all check results.
- Post-verify: eyeball that the report covers 20 pages and has no empty entries.

**Script (`.claude/workflows/seo-check-20.js`):**

```js
export const meta = {
  name: 'seo-check-20',
  description: 'Check 20 pages for SEO and assemble a summary report',
  phases: [{ title: 'Checks' }, { title: 'Synthesis' }],
}

const pages = [/* 20 URLs */]

phase('Checks')
const checks = await parallel(
  pages.map((url, i) => () =>
    agent(`Check the SEO of ${url}: title, meta, headings, alt, speed. Return a list of issues.`,
          { label: `check:${i}`, phase: 'Checks' }))
).then(r => r.filter(Boolean))   // barrier: all are needed for the report

phase('Synthesis')
const report = await agent(
  `Assemble a summary SEO report over 20 pages. Check results:\n${checks.join('\n\n')}`,
  { label: 'synth', phase: 'Synthesis' }
)
return report
```

The `parallel` barrier is justified here: the synthesizer needs ALL checks at once.

---

## Example 2: does NOT fit (a linear plan)

**User task:** "Add a contact form to the landing page: markup, validation, email submission, test."

**Gate reasoning:** This is a linear chain with hard dependencies: validation goes on top of finished markup, submission comes after validation, the test comes after everything. There are no independent chunks for parallelism, no stream of same-type items. Remove parallelism and flow - nothing is lost. -> **Does not fit. A linear plan.**

**Plan (linear-plan.md, short):**

```
Mode: Linear (a hard chain of dependencies, nothing to parallelize)

1. Build the form (fields: name, email, message) -> verify: form is visible on the page, fields render
2. Add client-side validation -> verify: empty submit is blocked, a malformed email is flagged
3. Wire up email submission -> verify: a test request arrives in the mailbox
4. Run an end-to-end test -> verify: filled in -> submitted -> email received, form cleared
```

Here a workflow would only add background-run overhead with no gain - a linear plan is shorter and clearer.

---

## Example 3: shared source -> phase-0 anchor

**User task:** "Write the README, API reference, install guide, and FAQ for tool X - all from one command list."

**Gate reasoning:** Four same-type chunks - but they all cite one source of truth (the command/flag list) that is not fixed yet. Launched blind, each agent would invent its own version of the commands and the docs would diverge. 4 chunks is "3+" (the Shared-source threshold rule in `reference/applicability.md`) -> **Fits, as a workflow with a phase-0 anchor** - never blind parallel, and not linear either.

**Plan (short):**

- Phase 0 "Anchor" [sequential]: one agent fixes the command inventory. Output: the reference list.
- Phase 1 "Docs" [parallel, 4 branches]: each doc written with the inventory passed INTO its prompt.
- Phase 2 "Consistency" [depends on Phase 1]: one agent cross-checks the docs against the inventory.
- Post-verify: every command mentioned in the docs exists in the inventory; no doc contradicts another.

**Script (`.claude/workflows/docs-pack-anchored.js`):**

```js
export const meta = {
  name: 'docs-pack-anchored',
  description: 'Fix the command inventory, then write 4 docs in parallel from it',
  phases: [{ title: 'Anchor' }, { title: 'Docs' }, { title: 'Consistency' }],
}

phase('Anchor')
const inventory = await agent(
  'Build the command inventory for tool X: every command, flag and default, from bin/x --help and docs/cli.md. Return a compact reference list.',
  { label: 'anchor:inventory', phase: 'Anchor' }
)
if (!inventory) {
  log('Anchor failed - stopping: writing the docs blind is exactly the divergence we are avoiding.')
  return null
}

const docs = ['README', 'API reference', 'install guide', 'FAQ']
phase('Docs')
// positions are preserved: results[i] belongs to docs[i]; the four docs are NAMED
// and all required, so no .filter(Boolean) - check them by name instead.
const results = await parallel(docs.map((d) => () =>
  agent(`Write the ${d} for tool X. Use ONLY this command inventory as the source of truth - do not invent commands or flags:\n${inventory}`,
        { label: `doc:${d}`, phase: 'Docs' })))

const missing = docs.filter((d, i) => !results[i])
if (missing.length) log(`Failed: ${missing.join(', ')} - the pack is incomplete, re-run those`)

phase('Consistency')
const check = await agent(
  `Cross-check these docs against the command inventory and against each other. Flag every command/flag mismatch.\n\nInventory:\n${inventory}\n\nDocs:\n${results.filter(Boolean).join('\n\n---\n\n')}`,
  { label: 'consistency', phase: 'Consistency' }
)
return { docs: results, check }
```

The anchor is just a sequential phase before the parallel one - parallelism is preserved, divergence is not. Note the two failure styles: the anchor is guarded by name (all-or-stop), the docs degrade explicitly by name (never a silent `.filter`).

---

## Example 4: unknown-size discovery -> loop until dry

**User task:** "Find the edge-case bugs in module X - keep digging until nothing new turns up."

**Gate reasoning:** Independent finder runs from different angles - parallelism is real. But the size is unknown: no fixed list of units, so a single fan-out would miss the tail. -> **Fits, as an orchestrator-level loop** (recipe 8): rounds of finders, dedup between rounds, stop when dry. The loop needs an EXPLICIT stop - cap + no-progress break + budget guard.

**Script (`.claude/workflows/edge-case-hunt.js`):**

```js
export const meta = {
  name: 'edge-case-hunt',
  description: 'Hunt edge-case bugs in module X until two dry rounds, then verify survivors',
  phases: [{ title: 'Hunt' }, { title: 'Verify' }],
}

const ANGLES = ['boundary values', 'error handling', 'concurrency', 'malformed input']
const BUGS = { type: 'object', properties: { bugs: { type: 'array', items: { type: 'string' } } }, required: ['bugs'] }
const key = (b) => b.toLowerCase().replace(/\s+/g, ' ').slice(0, 80)

const seen = new Set()
const found = []
let dry = 0

phase('Hunt')
for (let round = 1; round <= 5 && dry < 2; round++) {          // hard cap + no-progress break
  if (budget.total && budget.remaining() < 50000) {             // budget guard
    log(`Budget floor reached at round ${round} - stopping the hunt early (results are partial)`)
    break
  }
  const batch = (await parallel(ANGLES.map((a) => () =>
    agent(`Find edge-case bugs in module X (src/x/). Angle: ${a}. Already known - do NOT repeat:\n${found.join('\n') || '(none yet)'}`,
          { label: `hunt:${a}:r${round}`, phase: 'Hunt', schema: BUGS })
  ))).filter(Boolean).flatMap((r) => r.bugs)
  const fresh = batch.filter((b) => !seen.has(key(b)))          // dedup vs everything SEEN
  fresh.forEach((b) => { seen.add(key(b)); found.push(b) })
  dry = fresh.length === 0 ? dry + 1 : 0
  log(`round ${round}: +${fresh.length} new (${found.length} total, dry=${dry})`)
}

phase('Verify')
const verified = await pipeline(
  found,
  (bug, _o, i) => agent(`Try to REFUTE this bug report for module X (src/x/): ${bug}\nAnswer "confirmed: <why>" or "refuted: <why>".`,
                        { label: `verify:${i}`, phase: 'Verify' })
)
return { found, verified: verified.filter(Boolean) }
```

Three stops guard the loop (a `for` cap, `dry < 2`, the budget floor) - never an open `while (true)`. Dedup runs against everything *seen*, so a refuted finding cannot reappear and reset the dry counter. Verification is a `pipeline`, not a barrier: each bug's skeptic runs as soon as the bug exists.

---

## Prompt Helper examples

Four short runs of the Prompt Helper (`reference/prompt-helper.md`). They show the route and
the outcome, not full transcripts.

### A. Idea -> no-workflow (linear)

**User:** "I want to fix a bug in the login form and add a test."

**Route:** build-path -> gate. Steps in a hard sequence, no same-type chunks, nothing to run
at once. **Not a fit.** The helper says so plainly, offers a short linear plan, and STOPS.
The lesson for a newcomer: not everything is a workflow.

### B. Idea -> Fan-out recipe

**User:** "I have about 30 product pages and want each checked for SEO, plus a summary."

**Route:** build-path -> gate. 30 same-type independent units -> **fit**. The helper proposes
the **Fan-out** recipe. Checklist: units = the 30 pages; per-unit verify = title/meta/headings
present (by content, not "30 checked"); the summary needs all results -> a barrier; autonomy =
read-only -> autonomous; output = a report. It assembles the prompt, offers an opt-in
hole-check, then hands off to the planner.

### C. Draft -> audit + patch

**User:** pastes a near-ready prompt: "Build the site fully autonomously, one agent per page."
No verify, no per-agent data.

**Route:** draft-audit (a near-ready prompt is not rebuilt). Express gate: fit. Check against
the checklist + pitfalls -> findings: over-promised autonomy on write steps (item 8);
verify-by-count (item 7); leaf-agents missing data (item 6). **Patch recommendations:** keep
the fan-out shape; fix autonomy to risk-tiered (confirm before writes); add per-page
content verify; pass each agent its page path/anchor, not "context above". No full rebuild
unless the user asks.

### D. Novel task -> free interview

**User:** "I want to turn our messy support inbox into something useful — not sure how."

**Route:** build-path -> gate: unclear -> probe. It looks like a multi-stage flow over tickets
(classify -> cluster -> summarize), but no recipe matches cleanly. The helper falls back to the
**free interview** and fills the checklist from scratch, landing on a pipeline-shaped prompt.
Recipe is a scaffold, not a cage.

### Language note

These run in the **user's language**. If the user writes in English or German, the helper and
the final prompt are in that language - never forced to Russian. The test fixtures include a
non-Russian case to guard this.
