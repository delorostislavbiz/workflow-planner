# Judge Constructor

## Overview

Build an **Acceptance Contract** for a task: the criteria that decide when it is done, written as observable predicates, fixed **before** the work starts.

**Core principle:** A loop without a judge wanders forever. The judge is not a feeling ("looks good") — it is a check someone other than the maker could run and get the same answer.

This skill produces the contract. It does not do the work and does not run the checks — execution and verification happen elsewhere, against this contract.

## The Delegation Slider

The same contract gets built regardless of who supplies the raw material. Only the input source changes — read the user's signal:

- **User-driven** — the user dictates/​dictates criteria; you structure them and drill the vague ones.
- **Collaborative** — you propose criteria; the user corrects them through Q&A.
- **Auto** — the user is tired or says "design the criteria yourself"; you draft the full contract from the task, then present it for ratification.

Auto is allowed. **Auto without ratification is not** (see Ratification Gate).

## The Questions

Ask one at a time. In auto mode, answer them yourself from the task, then ratify. Stop early once a question is already settled by the task.

1. **What are you doing, and why?** (intent)
2. **How will you know it worked — stated so an outsider could check it?** (the core predicate)
3. **What are the hard constraints?** (budget, must-haves, deadline, scope limits)
4. **Once or durable? How do we confirm it holds?** (stability, not a one-time fluke)
5. **🔑 Who or what — that did NOT help build this — will confirm it?** (the independent / out-of-sample check)
6. **How many attempts, and at what result do we stop?** (stop condition; raise the bar as attempts grow)

## The Drilling Rule (the teeth of this skill)

**Do not move past a question until the answer is a checkable predicate.** Asking the question is not the skill — refusing the vague answer is.

Convert soft → hard, out loud:

| User says | Drill to |
|---|---|
| "looks professional" | "3 of 3 fresh visitors say what we sell within 5 seconds" |
| "good research" | "≥5 competitors, each with [price, positioning, weakness]; ≥2 facts per competitor from a non-vendor source" |
| "fast" | "loads under 3 seconds on a mid-range phone" |
| "people like it" | "≥N signups from my own audience in one week" (not likes) |

If the user cannot make it checkable, that is a finding: the goal is not yet understood. Surface it; do not paper over it.

## Question 5 Is Mandatory

The independent-check question is the one users never ask themselves. **You must raise it**, every time, even in user-driven mode. It is the difference between a real judge and grading your own homework:

- research → a source with no interest in selling you the answer
- a built thing → a person who did not build it
- copying a winner → the ones with the same feature who *failed* (not just the survivor)

## Ratification Gate

Even in full auto, the last step is **show the contract and ask "ok?"** — not "write it", just "glance and confirm". A tired user ratifies in five seconds. This keeps the human as judge-of-the-judge without making them the author.

## Freeze Rule

Once ratified, the contract is **frozen for this attempt/loop**. If the work reveals the criteria were wrong, that is a new round with explicit re-ratification — never a silent edit. Tuning the bar to match whatever you produced is the self-deception this skill exists to prevent.

## Adversarial Self-Check

Before presenting an auto-drafted contract, red-team it once: **"Could I satisfy these criteria while the result is actually bad?"** If yes, the criteria are too weak — tighten them. A confirmatory self-check ("looks fine") is theater; only the adversarial one is worth running.

## Too Simple?

Trivial tasks get a one-line contract, not a six-question interview. Match the effort to the task: if "done" is obvious and checkable in one sentence, write that sentence and move on.

## Output: The Acceptance Contract

Write the result in the task's language as:

```markdown
## Acceptance Contract
- **Goal (one measurable line):** <what + threshold>
- **Done when (observable predicates):**
  - [ ] <checkable predicate>
  - [ ] <checkable predicate>
- **Hard constraints:** <budget / must-haves / deadline>
- **Durability:** <how we confirm it holds, not a one-off>
- **Independent check (out-of-sample):** <who/what, not involved in building, confirms it>
- **Stop condition:** <met when… ; raise the bar as attempts grow>
```

## Red Flags — STOP

- Accepting "good/clean/professional/nice" as a criterion (not checkable)
- Skipping question 5 (no independent check named)
- Running auto mode without the ratification step
- Editing the contract mid-loop to match the output you got
- A self-check that only confirms instead of attacking the criteria

**All of these mean: the judge is decorative. Fix it before the work starts.**
