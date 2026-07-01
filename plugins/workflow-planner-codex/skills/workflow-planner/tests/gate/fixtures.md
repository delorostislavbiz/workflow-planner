# Gate & planner — test fixtures (Codex)

10 fixtures for the core flow (gate -> plan -> approved run), complementing
`tests/prompt-helper/fixtures.md` (which covers the Prompt Helper only). Same protocol and
evidence rules as `tests/prompt-helper/runbook.md`; run outputs go to the polygon
(`D:\AI-PROJECTS\WORKFLOW-PLANNER-TEST\gate-codex\<date>\`), never into the repo.

Adapted to the Codex runtime: the artifact is a plan with subagent briefs (no JS script, no
`.claude/workflows`, no script validator); after explicit approval the MAIN agent runs the
flat subagents itself.

**Routing note:** every input below is an EXPLICIT plan request ("Plan this task and write
the plan: ..."). That is deliberate: per SKILL.md's entry routing, a bare imperative would
go to the Prompt Helper build-path - an explicit user command beats auto-detection and lands
in the planner flow this suite tests. (The same underlying tasks appear as bare imperatives
in F1/F3/F4, where the expected artifact is a PROMPT; here it is a PLAN.)

**[multi-turn]** means the fixture needs a human driving several turns (ratifying the
Acceptance Contract, approving the plan, answering probes); automated single-shot runners
must skip these. Most planner fixtures are multi-turn by design: the flow contains a
contract-ratification exchange for non-trivial tasks and an approval checkpoint before any
subagent runs.

Each fixture: **input · expected verdict/route · key claims (2-5) · forbidden actions ·
pass/fail**.

---

### G1 — Clear fit (fan-out) [multi-turn]
- **Input:** "Plan this task and write the plan: check 30 blog pages for broken links and assemble a report."
- **Verdict:** fit (30 same-type independent units + synthesis).
- **Key claims:** builds and ratifies an Acceptance Contract before the plan; verdict with a one-line rationale; a workflow plan with a branch map, subagent prompt briefs, and a Scale & Budget section (batched into 2-6 subagents, or wider only with the user's cost consent); the plan is SHOWN and the skill WAITS for approval.
- **Forbidden:** spawning any subagent before the user approves the plan.
- **Pass/fail:** PASS if the plan appears with contract + branch map + briefs and no subagent runs until the user approves.

### G2 — Linear chain [multi-turn]
- **Input:** "Plan this task and write the plan: add a contact form to the landing page - markup, validation, email submission, test."
- **Verdict:** not a fit -> linear plan.
- **Key claims:** rationale = hard step-by-step chain; ratifies the Acceptance Contract (a quick "ok?" is enough), then writes `PLAN.md` in step -> verify format, shows it, and STOPS.
- **Forbidden:** waiting for approval of the linear plan itself after showing it (approval gates subagent runs, and a linear plan has none); producing a workflow plan or spawning subagents.
- **Pass/fail:** PASS if `PLAN.md` is linear with per-step verifies and the skill stops after showing it.

### G3 — Shared source, 3+ chunks [multi-turn]
- **Input:** "Plan this task and write the plan: write the README, API reference, install guide, and FAQ for tool X - all from one command list."
- **Verdict:** fit, workflow WITH a phase-0 anchor.
- **Key claims:** detects the shared source; 4 chunks = "3+"; Phase 0 fixes the inventory; the inventory is pasted into every Phase 1 subagent brief (visible in the briefs' Inputs field).
- **Forbidden:** blind fan-out without the anchor; routing to linear.
- **Pass/fail:** PASS if the plan has Phase 0 anchor -> parallel chunks with the source in each brief.

### G4 — Shared source, 2 chunks [multi-turn]
- **Input:** "Plan this task and write the plan: write the README and the API reference from one command list."
- **Verdict:** not a fit -> linear (fix the source, then write both).
- **Key claims:** references the Shared-source threshold rule; 2 chunks below the line; the linear plan fixes the source before writing the two docs.
- **Forbidden:** a phase-0 anchor workflow for 2 chunks.
- **Pass/fail:** PASS if the plan is linear with "fix source first" ordering.

### G5 — Trivial task
- **Input:** "Plan this task: rename the variable `usr` to `user` in src/app.js."
- **Verdict:** not a fit (trivial - single edit).
- **Key claims:** calls it trivial without agent-washing; the Acceptance Contract is ONE line (per acceptance-contract.md "Too Simple?"), with no six-question interview; the linear `PLAN.md` is minimal (1-3 steps, each with a verify).
- **Forbidden:** a workflow; a full contract interview; inflating the plan beyond a few steps.
- **Pass/fail:** PASS if a minimal linear PLAN.md with a one-line contract and no interview.

### G6 — Borderline -> clarify [multi-turn]
- **Input:** "Plan this task: process our documents and make summaries." (count and independence unknown)
- **Verdict:** unclear -> 1-2 probe questions first.
- **Key claims:** asks about count / same-typeness / dependencies (a concise clarifying question, not a guess); states assumptions; verdict only after the answers.
- **Forbidden:** issuing a verdict or plan before probing; more than 2 questions.
- **Pass/fail:** PASS if it probes first, then routes correctly per the answer.

### G7 — Nested sub-agents request
- **Input:** "Plan a workflow where each agent spawns its own sub-agents to go deeper."
- **Verdict:** the nesting itself is out - Codex subagents are flat leaf workers by default.
- **Key claims:** says plans must not depend on recursive delegation (`agents.max_depth` is an advanced environment feature, not something a public plan may rely on - SKILL.md Runtime Boundary); offers a flat shape (batching, phases) instead.
- **Forbidden:** planning a branch that spawns sub-agents.
- **Pass/fail:** PASS if the honest no-nesting answer + a workable flat alternative.

### G8 — PLAN.md already exists [multi-turn]
- **Input:** any planning task from this suite, in a workspace where `PLAN.md` is already present.
- **Route:** before writing - the existence check fires.
- **Key claims:** does NOT overwrite silently; asks the user or writes `PLAN.<task>.md`.
- **Forbidden:** silent overwrite of the existing `PLAN.md`.
- **Pass/fail:** PASS if the old plan survives untouched unless the user said otherwise.

### G9 — Run only after approval, with the run protocol [multi-turn]
- **Input:** G1's task, driven through approval ("the plan looks good, go ahead").
- **Route:** plan approved -> the main agent starts the run per the Run Protocol.
- **Key claims:** no subagent runs before the approval message; on approval, the main agent follows the Run Protocol from `reference/codex-workflow-runtime.md` BEFORE spawning - restates the approved plan, names the branches being launched, confirms read-only vs edit, and names each branch's file ownership.
- **Forbidden:** spawning before approval; skipping the pre-spawn protocol; asking a subagent to spawn its own subagents.
- **Pass/fail:** PASS if nothing ran pre-approval and the pre-spawn protocol is visible in the transcript. (The driver may stop the session once spawning starts - full execution is not required to score this fixture.)

### G10 — Language preservation
- **Input:** "Plane diese Aufgabe und schreibe den Plan: prüfe 20 Produktseiten auf SEO-Probleme und erstelle einen Bericht." (German)
- **Verdict:** fit.
- **Key claims:** everything user-facing in the FIRST reply - gate rationale, contract draft, any probe or ratification question - is in German; if the flow reaches the plan, the plan and the subagent briefs are in German too.
- **Forbidden:** answering or writing artifacts in English/Russian.
- **Pass/fail:** PASS if reply/artifact language == task language (checkable from the first turn alone).
