# Plan: <task name>

Mode: **Linear**
Gate verdict: not a fit for subagents - <why: linear chain / shared mutable state / frequent interaction / trivial>

> Fill in the angle brackets. Remove these notes before delivering the plan.
> Before writing to `PLAN.md`, check whether it already exists. Do not overwrite it silently.

## Assumptions

- <what is taken as given about the task - environment, inputs, scope>
- <assumption 2>

## Acceptance Contract
- **Goal (one measurable line):** <what + threshold>
- **Done when (observable predicates):**
  - [ ] <checkable predicate>
  - [ ] <checkable predicate>
- **Hard constraints:** <budget / must-haves / deadline>
- **Durability:** <how we confirm it holds, not a one-off>
- **Independent check (out-of-sample):** <who/what, not involved in building>
- **Stop condition:** <met when… ; raise the bar as attempts grow>

What "done" means, fixed before the steps and frozen at plan approval. For trivial tasks this may be a single `Done when:` line. The final step below verifies against this contract.

## Steps (Atomic, Each With a Check)

1. <atomic step> -> verify: <concrete command / test / visual check / source check>
2. <step> -> verify: <...>
3. <step> -> verify: <...>
N (final). Verify the whole task against the Acceptance Contract above -> verify: every "Done when" predicate checked and the independent check performed.

Each step is one meaningful action. Verify must be concrete enough to prove the step is done. The final step closes by checking the Acceptance Contract, not an ad-hoc "looks done".

## Plan Self-Review

- Language: plan and steps match the user's task language.
- Logic: dependencies are ordered correctly.
- Granularity: no step hides 3+ sub-actions or more than roughly half a day of work.
- Verify strength: no verify is only "check manually" or only a count when content can be sampled.
- Simplicity: no subagents are used where a linear plan is clearer.
