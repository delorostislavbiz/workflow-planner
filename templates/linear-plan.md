# Plan: <task name>

Mode: **Linear**
Gate verdict: not a fit for a workflow - <why: linear chain / shared state / interaction / trivial>

> Fill in the angle brackets. Remove the examples before delivering the plan.

## Steps (atomic, each with a check)

1. <atomic step> -> verify: <concrete command / test / visual check>
2. <step> -> verify: <...>
3. <step> -> verify: <...>

Each step is one meaningful action. Verify is a concrete way to confirm the step is done (not "check manually" but exactly what to run / see).

## Plan self-review
- Logic errors, inconsistencies, missing steps?
- Are the dependencies between steps ordered correctly?
- Granularity: does any step hide 3+ sub-actions or more than ~half a day of work (e.g. "migrate all products with attributes, images, variations")? If so, split it into atoms, each with its own verify.
- Verify strength: is any verify only a count or "check manually"? A count hides systematic errors inside the items - check content on a sample, not just quantity.
- Plan quality score >= 8/10, otherwise refine.

## TODO in code (source of truth for what is unfinished)
- In each file to change, add: `// TODO(step-N): <what to do>` referencing the step number.
- Did the step -> ran verify -> removed the TODO from the file.
- Code = the source of truth for what is still not done.
