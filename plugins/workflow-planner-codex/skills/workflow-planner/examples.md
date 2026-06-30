# Examples — Prompt Helper (Codex)

Four short runs of the Prompt Helper (`reference/prompt-helper.md`). They show the route and
the outcome, not full transcripts. Adapted to the Codex runtime (the main agent orchestrates
flat subagents; no JS script).

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
