# Plan: <task name>

Mode: **Linear**
Gate verdict: not a fit for subagents - <why: linear chain / shared mutable state / frequent interaction / trivial>

> Fill in the angle brackets. Remove these notes before delivering the plan.
> Before writing to `PLAN.md`, check whether it already exists. Do not overwrite it silently.

## Assumptions

- <what is taken as given about the task - environment, inputs, scope>
- <assumption 2>

## Steps (Atomic, Each With a Check)

1. <atomic step> -> verify: <concrete command / test / visual check / source check>
2. <step> -> verify: <...>
3. <step> -> verify: <...>

Each step is one meaningful action. Verify must be concrete enough to prove the step is done.

## Plan Self-Review

- Language: plan and steps match the user's task language.
- Logic: dependencies are ordered correctly.
- Granularity: no step hides 3+ sub-actions or more than roughly half a day of work.
- Verify strength: no verify is only "check manually" or only a count when content can be sampled.
- Simplicity: no subagents are used where a linear plan is clearer.
