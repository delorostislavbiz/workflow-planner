# Examples (Codex)

Prompt Helper runs (A-D) and two planner examples (E-F: anchor, loop-until-dry). Adapted to
the Codex runtime (the main agent orchestrates flat subagents; no JS script).

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
present (by content, not "30 checked"); the summary needs all results -> a wait-for-all
barrier; autonomy = read-only -> autonomous; output = a report. It assembles the prompt,
offers an opt-in hole-check, then hands off to the Codex planner.

### C. Draft -> audit + patch

**User:** pastes a near-ready prompt: "Build the site fully autonomously, one agent per page."
No verify, no per-agent data.

**Route:** draft-audit (a near-ready prompt is not rebuilt). Express gate: fit. Check against
the checklist + pitfalls -> findings: over-promised autonomy on write steps (item 8);
verify-by-count (item 7); subagents missing data (item 6). **Patch recommendations:** keep
the fan-out shape; fix autonomy to risk-tiered (confirm before writes); add per-page
content verify; pass each subagent its page path/anchor, not "context above". No full rebuild
unless the user asks.

### D. Novel task -> free interview

**User:** "I want to turn our messy support inbox into something useful — not sure how."

**Route:** build-path -> gate: unclear -> probe. It looks like a multi-stage flow over tickets
(classify -> cluster -> summarize), but no recipe matches cleanly. The helper falls back to the
**free interview** and fills the checklist from scratch, landing on a multi-stage (pipeline-
shaped) prompt. Recipe is a scaffold, not a cage.

### Language note

These run in the **user's language**. If the user writes in English or German, the helper and
the final prompt are in that language - never forced to Russian. The test fixtures include a
non-Russian case to guard this.

## Planner examples

Two workflow-plan shapes the gate routes to. Shown as plan outlines (the Codex artifact is a
plan with subagent briefs, not a script).

### E. Shared source -> phase-0 anchor

**User task:** "Write the README, API reference, install guide, and FAQ for tool X - all from one command list."

**Gate reasoning:** four same-type chunks, but they all cite one not-yet-fixed source of
truth (the command/flag list). Spawned blind, each subagent would invent its own version and
the docs would diverge. 4 chunks is "3+" (the Shared-source threshold rule in
`reference/applicability.md`) -> **fits, with a phase-0 anchor** - never blind fan-out, and
not linear either.

**Plan shape (codex-workflow-plan.md, short):**

- Phase 0 "Anchor" [main agent or one subagent]: fix the command inventory from `bin/x --help`
  and `docs/cli.md`. Phase output: the exact inventory text.
- Phase 1 "Docs" [4 flat subagents at once]: each brief carries the WHOLE inventory pasted in
  ("use ONLY this inventory as the source of truth - do not invent commands"). The four docs
  are NAMED and all required: if one fails, re-run that branch - do not ship a three-doc pack
  silently.
- Phase 2 "Consistency" [main agent or one verifier subagent]: cross-check the docs against
  the inventory and each other; input = inventory + all four outputs.
- Post-verify: every command mentioned in the docs exists in the inventory; no doc contradicts
  another.

The anchor is just a sequential phase before the fan-out - parallelism is preserved,
divergence is not.

### F. Unknown-size discovery -> loop until dry

**User task:** "Find the edge-case bugs in module X - keep digging until nothing new turns up."

**Gate reasoning:** independent finder runs from different angles - parallelism is real. But
the size is unknown: no fixed list of units, so a single fan-out would miss the tail. ->
**fits, as a main-agent loop** (recipe 8): rounds of finder subagents, dedup between rounds,
stop when dry. The loop MUST carry an explicit stop.

**Plan shape (short):**

- Round r (r = 1..5, hard cap): 4 flat finder subagents, one per angle (boundary values,
  error handling, concurrency, malformed input). Each brief includes everything already
  found, with "do NOT repeat these".
- Between rounds [main agent]: dedup new findings against EVERYTHING seen so far (a
  normalized one-line key per finding). No new findings for 2 consecutive rounds -> stop
  (no-progress break). Also stop at the round cap, or at the cost ceiling agreed with the
  user.
- Verify [flat skeptic subagents]: one per surviving finding, told to REFUTE it; run each as
  soon as its finding exists - no barrier.
- Output: confirmed findings + the round log (found/new per round), so the user sees the
  loop actually dried out rather than just stopped.

Three stops guard the loop (round cap, dry counter, cost ceiling) - never an open "keep
going until done". Dedup runs against everything *seen*, so a refuted finding cannot
reappear and reset the dry counter.
