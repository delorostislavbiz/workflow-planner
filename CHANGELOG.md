# Changelog

All notable changes to the workflow-planner skill. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are YYYY-MM-DD.

## [Unreleased]

- **Codex plugin 0.3.0:** ships its own byte-identical copy of `tools/lint-plan.js` and
  wires it into both plan paths and both templates' self-review (same no-node fallback as
  the Claude side). `check-parity.js` gained an 'identical' mode that flags stale tool
  copies. The 2026-07-02 Pending item is closed.

- **Plan linter** (`tools/lint-plan.js`): deterministic checks over generated plans —
  contract + predicates present, every step carries a verify, count-only / manual-only
  verifies flagged, ritual steps around trivial edits flagged, blind dependent branches
  (empty Input) flagged, Scale & budget required for workflow plans. Wired into both plan
  templates' self-review and SKILL.md steps 3a/3b (with an honest no-Bash fallback).
  Proven on the live plans from the 2026-07-02 runs: 3 clean PASS, 1 WARN that matches the
  known G5 residual, and a seeded bad plan failing with 4 errors. Codex integration —
  consciously deferred (see PARITY.md Pending: the plugin ships without `tools/`).

## [1.0.0] — 2026-07-02 (pending tag)

First release considered **proven by live runs**: 23 fixtures (12 headless single-turn
with an LLM judge + 11 human/orchestrator-driven multi-turn) all PASS on the released
revision, every FAIL along the way hand-triaged (real skill gaps vs fixture/environment
artifacts). Full evidence lives in the test polygon (not in this repo).

### Core (built across 2026-06)
- Hybrid applicability gate (workflow vs linear) + atomic plans: `PLAN.md` (step -> verify)
  or a branch-map workflow plan plus a ready-to-run JS script for the Workflow tool.
- Acceptance Contract stage (judge): measurable "done" fixed before planning, frozen at
  plan approval, feeds per-step verifies and post-verify.
- Prompt Helper: fuzzy idea / draft -> correct workflow prompt (recipes, draft-audit,
  free interview) with consent-gated checks.
- Review-workflow: 6 skeptic lenses -> dedup -> ranked verdict (ready / needs fixes /
  needs rebuilding). Proven live: 3 planted holes -> 3/3 found as blockers.
- After-run guidance (post-verify against the contract, resume vs re-run vs re-plan).
- Mechanical validator (`tools/validate-workflow.js`), fixture runner
  (`tools/run-fixtures.js`), Codex twin under `plugins/` with parity tooling
  (`tools/check-parity.js`, `PARITY.md`).

### Hardened by live testing (2026-07-02)
- **Empirical facts registry re-verified** on Claude Code 2.1.198: workflow agents are
  leaves (re-confirmed); the old "roles register only at session start" fact FELL —
  the role registry refreshes between turns; registry, prose and probe procedure updated.
- **Step-0 routing tie-break:** bare imperative -> Prompt Helper (artifact: PROMPT);
  explicit plan request -> planner (artifact: PLAN). The route was drifting between runs.
- **Contract sequencing:** ratify BEFORE the plan when dialogue is possible; single-shot
  runs embed a labeled draft and make plan approval cover it explicitly.
- **Approval semantics:** only an explicit yes to the approval question triggers script
  generation; ambiguous replies get a one-line re-ask.
- **Gate probes hard cap:** at most 2 clarifying questions per turn; remaining unknowns
  become explicit assumptions.
- **Trivial tasks:** 1–3 steps, checks folded into verifies (both plan templates).
- **Test suites:** fixture inputs carry an explicit `/workflow-planner` call (other
  installed skills hijack description-matching; headless may not auto-activate) and are
  self-contained (data sources named inline); F9/F10 specs test the reaction, not the
  artifact kind; runner stamps local dates; runbook gained Windows notes (MSYS path
  mangling, isolation recipe, permission flags for planner-flow fixtures).
- All mirrored to the Codex copy; parity 15/15 pairs, Pending empty.
