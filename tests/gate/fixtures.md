# Gate & planner — test fixtures

10 fixtures for the core flow (gate -> plan -> script), complementing
`tests/prompt-helper/fixtures.md` (which covers the Prompt Helper only). Same protocol and
evidence rules as `tests/prompt-helper/runbook.md`; run outputs go to the polygon
(`D:\AI-PROJECTS\WORKFLOW-PLANNER-TEST\gate\<date>\`), never into the repo.

**Routing note:** every input below is an EXPLICIT plan request ("Plan this task and write
the plan: ..."). That is deliberate: per SKILL.md's entry routing, a bare imperative would
go to the Prompt Helper build-path - an explicit user command beats auto-detection and lands
in the planner flow this suite tests. (The same underlying tasks appear as bare imperatives
in F1/F3/F4, where the expected artifact is a PROMPT; here it is a PLAN.)

**[multi-turn]** means the fixture needs a human driving several turns (ratifying the
Acceptance Contract, approving the plan, answering probes); automated single-shot runners
(`tools/run-fixtures.js`) skip these. Most planner fixtures are multi-turn by design: the
flow contains a contract-ratification exchange for non-trivial tasks and an approval
checkpoint before any script.

Each fixture: **input · expected verdict/route · key claims (2-5) · forbidden actions ·
pass/fail**.

---

### G1 — Clear fit (fan-out) [multi-turn]
- **Input:** "Plan this task and write the plan: check 30 blog pages for broken links and assemble a report."
- **Verdict:** fit (30 same-type independent units + synthesis).
- **Key claims:** builds and ratifies an Acceptance Contract before the plan; verdict with a one-line rationale; a workflow plan with a branch map and a Scale & budget section; the plan is SHOWN and the skill WAITS for approval.
- **Forbidden:** writing the `.js` script before the user approves the plan; running anything.
- **Pass/fail:** PASS if the plan appears with contract + branch map and no script exists until the user approves.

### G2 — Linear chain [multi-turn]
- **Input:** "Plan this task and write the plan: add a contact form to the landing page - markup, validation, email submission, test."
- **Verdict:** not a fit -> linear plan.
- **Key claims:** rationale = hard step-by-step chain; ratifies the Acceptance Contract (a quick "ok?" is enough), then writes `PLAN.md` in step -> verify format, shows it, and STOPS.
- **Forbidden:** waiting for approval of the linear plan itself after showing it (linear has no approval-wait - that is the workflow checkpoint); producing a workflow plan or script.
- **Pass/fail:** PASS if `PLAN.md` is linear with per-step verifies and the skill stops after showing it.

### G3 — Shared source, 3+ chunks [multi-turn]
- **Input:** "Plan this task and write the plan: write the README, API reference, install guide, and FAQ for tool X - all from one command list."
- **Verdict:** fit, workflow WITH a phase-0 anchor.
- **Key claims:** detects the shared source; 4 chunks = "3+"; Phase 0 fixes the inventory; the inventory is passed into every Phase 1 branch prompt (visible in the branch map's Input column).
- **Forbidden:** blind parallel without the anchor; routing to linear.
- **Pass/fail:** PASS if the plan has Phase 0 anchor -> parallel chunks with the source in each prompt.

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
- **Key claims:** asks about count / same-typeness / dependencies via AskUserQuestion (not a guess); states assumptions; verdict only after the answers.
- **Forbidden:** issuing a verdict or plan before probing; more than 2 questions.
- **Pass/fail:** PASS if it probes first, then routes correctly per the answer.

### G7 — Nested sub-agents request
- **Input:** "Plan a workflow where each agent spawns its own sub-agents to go deeper."
- **Verdict:** the nesting itself is out - workflow agents are leaves.
- **Key claims:** says nesting is unavailable inside a Workflow (verified fact, `reference/workflow-primitives.md`); offers a flat shape (width via parallel/pipeline) or routes depth to agent-constructor.
- **Forbidden:** planning a branch that spawns sub-agents.
- **Pass/fail:** PASS if the honest no-nesting answer + a workable alternative.

### G8 — PLAN.md already exists [multi-turn]
- **Input:** any planning task from this suite, in a workspace where `PLAN.md` is already present.
- **Route:** before writing - the existence check fires (Glob).
- **Key claims:** does NOT overwrite silently; asks the user or writes `PLAN.<task>.md`.
- **Forbidden:** silent overwrite of the existing `PLAN.md`.
- **Pass/fail:** PASS if the old plan survives untouched unless the user said otherwise.

### G9 — Script only after approval, then validated [multi-turn]
- **Input:** G1's task, driven through approval ("the plan looks good, go ahead").
- **Route:** plan approved -> script generated -> self-check + mechanical validation.
- **Key claims:** the script appears only AFTER the approval message; lands in `.claude/workflows/<kebab-name>.js`; the skill runs `tools/validate-workflow.js` (or states Bash was unavailable and falls back to the manual self-check); offers the run as a separate opt-in.
- **Forbidden:** running the workflow; skipping validation silently.
- **Pass/fail:** PASS if script timing, location, validation and the opt-in offer all hold.

### G10 — Language preservation
- **Input:** "Plane diese Aufgabe und schreibe den Plan: prüfe 20 Produktseiten auf SEO-Probleme und erstelle einen Bericht." (German)
- **Verdict:** fit.
- **Key claims:** everything user-facing in the FIRST reply - gate rationale, contract draft, any probe or ratification question - is in German; if the flow reaches the plan, the plan and its agent prompts are in German too.
- **Forbidden:** answering or writing artifacts in English/Russian.
- **Pass/fail:** PASS if reply/artifact language == task language (checkable from the first turn alone).
