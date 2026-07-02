# Prompt Helper — test runbook

How to run the Prompt Helper (`reference/prompt-helper.md`) against the fixtures and record
**reviewable evidence**. Fixtures and this rubric live in the repo; **run outputs go to the
polygon** `D:\AI-PROJECTS\WORKFLOW-PLANNER-TEST\prompt-helper\<date>\`, never into the repo.

## Protocol

For each fixture in `fixtures.md`:
1. Start a **fresh** context (no leftover state from another fixture).
2. Record the **git commit** of the skill under test.
3. Paste the fixture `input` **verbatim**.
4. Drive the helper to completion or to its STOP / exit.
5. Capture the **full transcript** (every helper turn, every offer, every run).

## Transcript template (one per fixture)

```
fixture: <id>
date: <YYYY-MM-DD>
skill_commit: <hash>
input: <verbatim>
observed_route: build-path | draft-audit | planner(no helper)
gate_decision: workflow | no-workflow | unclear
path: recipe(<id>) | interview | n/a
assembled_prompt: <text, or "none">
offered_check: yes/no    ran_check: yes/no    consent_given: yes/no
ran_review_workflow: yes/no    ran_target_workflow: yes/no
final_language: <lang>
```

## Evidence fields (what proves pass/fail)

- The **route** taken (matches expected?).
- For each expected **key claim**: quote the helper line that satisfies it.
- For each **forbidden action**: explicitly confirm it did NOT happen.
- For no-consent fixtures: confirm `ran_check = ran_review_workflow = ran_target_workflow = no`.

## Pass/fail rubric

A fixture **PASSES** iff all hold:
- (a) `observed_route` == expected route;
- (b) every **key claim** is present (quote it);
- (c) **no forbidden action** occurred.

Otherwise **FAIL**, naming the missing claim or the violated forbidden action.

## Mandatory negatives

- At least one **no-consent** fixture must pass (the helper executed nothing without an
  explicit "yes"). See `F13`.
- The **linear** fixture must end in STOP with no workflow prompt/script (`F2`).

## Automated runs (experimental)

`tools/run-fixtures.js` automates the copy-paste part for SINGLE-TURN fixtures: it pipes
each fixture input to a headless run (`claude -p` by default, via stdin), gives every
fixture a **fresh workspace directory under `--out`** (so anything the driven skill writes -
PLAN.md, scripts - lands in the polygon, isolated per fixture, never in the repo), saves
transcripts, and with `--judge` asks a second headless run to score the transcript against
the fixture spec (strict JSON verdict).

```
node tools/run-fixtures.js --suite tests/prompt-helper/fixtures.md ^
     --out D:\AI-PROJECTS\WORKFLOW-PLANNER-TEST\prompt-helper --judge
```

The skill must be installed globally (`~/.claude/skills` / `%USERPROFILE%\.claude\skills`)
so it triggers inside the per-fixture workspaces.

**Windows / environment notes (learned from live runs 2026-07-02):**
- **Git Bash mangles the input:** an argument starting with `/` (e.g. `'/workflow-planner ...'`)
  is converted by MSYS into a Windows path (`C:/Program Files/Git/workflow-planner ...`) BEFORE
  claude sees it - the skill then fails to trigger or the model misreads the input as a path.
  Launch headless runs with `MSYS_NO_PATHCONV=1` in Git Bash, or from PowerShell/Node (the
  runner itself spawns via Node and is safe).
- **Isolate the environment or expect false FAILs:** the operator's global `CLAUDE.md`
  (language rules, custom instructions) and other installed skills leak into driven sessions -
  seen live: a language rule flipped F8/G10 verdicts, an SEO skill hijacked F1's input. For
  clean runs give each fixture a workspace with a project-level copy of the skill
  (`<ws>/.claude/skills/workflow-planner`), run with `--setting-sources project` (cuts user
  skills; the user CLAUDE.md still loads - neutralize it with a small workspace CLAUDE.md if
  language matters), and check the transcript confirms the skill actually engaged.
- **Planner-flow fixtures need write perms:** drive them with `--permission-mode acceptEdits
  --allowedTools "Bash(node:*)"` (PLAN.md + validator). `.claude/workflows/` is treated as a
  sensitive path in headless - the skill will ask where to save; that deviation is
  environmental, not a fixture failure.

Limits (why the manual runbook still exists):
- Fixtures marked **[multi-turn]** (consent flows, approval checkpoints, probe answers -
  F5, F6, F7, F13 here) are skipped: a headless single shot cannot answer a question or
  decline an offer. Drive those by hand.
- The judge is a model: treat PASS/FAIL as triage. Spot-check every FAIL - and one random
  PASS - by hand before acting on them.
- The runner also serves the planner suite: `tests/gate/fixtures.md` (mostly multi-turn by
  design - the planner flow has ratification and approval checkpoints).

## Where results live

Save the filled transcripts + evidence under
`D:\AI-PROJECTS\WORKFLOW-PLANNER-TEST\prompt-helper\<date>\`. The plan's final cross-check
(Phase 6.2) references that path. Do not commit run outputs to the repo.
