# Prompt Helper — test runbook (Codex)

How to run the Prompt Helper (`reference/prompt-helper.md`) against the fixtures and record
**reviewable evidence**. Fixtures and this rubric live in the repo; **run outputs go to the
polygon** `D:\AI-PROJECTS\WORKFLOW-PLANNER-TEST\prompt-helper-codex\<date>\`, never into the repo.

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
- The **linear** fixture must end in STOP with no workflow prompt/plan (`F2`).

## Where results live

Save the filled transcripts + evidence under
`D:\AI-PROJECTS\WORKFLOW-PLANNER-TEST\prompt-helper-codex\<date>\`. Do not commit run outputs
to the repo.
