# Examples

Two contrasting runs: one task fits a workflow, the other does not. The gate's reasoning and the resulting artifact are shown.

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
