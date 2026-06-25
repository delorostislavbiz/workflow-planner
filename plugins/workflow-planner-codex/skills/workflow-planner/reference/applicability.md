# Applicability Gate for Codex

Decide whether a task fits a flat Codex subagent workflow or whether a linear plan is better.

## Gate Mechanics

1. **Auto-assess.** Run the task through the criteria below.
2. **Give a verdict.** Say "fits" or "does not fit" and explain the deciding criteria in one or two sentences.
3. **Ask only when borderline.** If ambiguity changes the execution shape, ask 1-2 concise questions.

State assumptions before the plan. If there are several likely interpretations, list them and ask.

## Fits a Codex Subagent Workflow If

- **Independent chunks for parallelism:** 3+ same-type units can be processed independently, such as files, pages, modules, candidates, sections, review dimensions, or sources.
- **A multi-stage flow at volume:** many items pass through the same stages, such as extract -> verify -> synthesize.
- **Read-heavy exploration:** several independent questions can be investigated in parallel without mutating the same files.
- **Verification can run in parallel:** one branch can implement or analyze while another checks tests, docs, logs, or edge cases.
- **Volume justifies overhead:** the task is large enough that multiple isolated agents save time or reduce context pollution.

The work must be decomposable into clean subagent prompts. Each branch needs enough input in its prompt to work without seeing the main conversation.

## Does Not Fit If

- **Linear dependency chain:** each step depends on the exact result of the previous step.
- **One shared mutable state:** several workers would edit the same file family or one coupled target at the same time.
- **Frequent interaction:** the work needs user decisions inside the phase, not between phases.
- **Trivial task:** one normal Codex pass is enough.
- **The immediate critical blocker is unknown:** localize the blocker in the main thread first, then delegate independent follow-up work.
- **Nested delegation is required:** do not depend on child agents spawning their own child agents in the default Codex workflow.

## Deciding Rule

Mentally remove parallelism. If the plan loses nothing, keep it linear. If independent chunks or a high-volume flow remain, use a flat Codex subagent workflow.

## Shared Source of Truth

When several artifacts cite one source of truth, do not launch blind parallel branches until that source is fixed.

- **1-2 chunks:** keep it linear; fix the source, then write the chunks.
- **3+ chunks:** use a phase-0 anchor. First one branch fixes the source of truth, then parallel branches use that exact source in their prompts, then an optional final branch checks consistency.

Examples:

- "Write README, API reference, install guide, and FAQ" -> phase 0 command inventory, then parallel docs, then consistency check.
- "Migrate N related tables into one schema" -> phase 0 target schema and dependency order, then parallel per-table scripts only if write scopes are safe.

## Probe Questions

- How many independent chunks are there?
- Are they same-type units or genuinely different dependent steps?
- Do branches write to the same files or data?
- What source of truth must every branch share?
- What checks can prove the branches are correct?
