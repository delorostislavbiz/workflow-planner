# Applicability gate

How to decide whether a task fits a Dynamic Workflow, or whether a linear plan is better.

## Gate mechanics (hybrid)

1. **Auto-assessment.** Run the task description through the criteria below. Do not ask questions if the answer is obvious.
2. **Verdict with rationale.** Say "fits" or "does not fit" and, in one or two sentences, why (which criteria you relied on).
3. **Only when borderline - 1-2 clarifying questions.** If the task is ambiguous (especially with short / dictated input), ask rather than guess. Probe questions below.

State assumptions about the task up front. If there are several interpretations, list them and ask.

## Fits a workflow if at least one holds

- **Independent chunks for parallelism**: 3+ same-type units that can be processed at once (topics, files, sections, pages, review dimensions, candidates).
- **A multi-stage pipeline**: clear processing stages that a stream of items flows through (a pipeline pays off in wall-clock even without wide parallelism).
- **Volume justifies background overhead**: not 2-3 actions, but dozens of same-type units.

And the work is **decomposable** into agents with clean context: each chunk is self-contained once the needed data is put into its prompt.

## Does not fit (then a linear plan) if

- **A linear chain** with hard step-by-step dependencies: nothing runs in parallel and there is no stream of items.
- **Shared mutable state** between steps: agents are blind to each other, so shared memory cannot be done this way.
- **Frequent interaction**: each step needs a user decision along the way (a workflow runs autonomously to the end).
- **Trivial**: doable with a single prompt or plain code. Wrapping that in agents is "agent-washing".
- **Control points needed inside** a phase, not between phases.

## The deciding rule

Mentally remove parallelism and flow. If nothing is lost (the work is still linear) - a linear plan. If there is real parallelism OR a multi-stage flow at volume - a workflow.

## Decision matrix (signals)

A quick complement to the two sections above (it does not replace them). A workflow is not only about parallelism: a need for independent expertise or verification can justify one too. And many chunks do NOT justify one if they all write into a single mutable target.

- **Fit:** independent units; a need for independent expertise or adversarial review; verifiable artifacts; a shared synthesis over the results; a high cost of a silent error.
- **No-fit:** 1-2 steps; a shared mutable file without isolation; the goal is unclear; no verifiable result; cheaper to do linearly.
- **Caution (a workflow may still fit, but flag it in the plan):** needs access/secrets; destructive changes; a high-stakes domain (legal / medical / financial); the task list is dynamic; strong step-by-step dependence on a human.

## Borderline case: multiple artifacts with a shared source of truth

### Shared-source threshold rule

Single normative statement (other sections and files reference this anchor; they do not restate it): when **3+** same-type chunks cite a shared, not-yet-fixed source of truth, do not run them blind - use a workflow with a **phase-0 anchor** (Phase 0 fixes the source; Phase 1 runs `parallel` with that source in every prompt). With only **2** chunks, go linear (fix the source, then write both). 4 chunks is "3+", so it routes to the anchor workflow, never to a linear plan.

A task of the form "make several things" (documentation sections, pages, chapters, configs) where the chunks look independent. Do not rush into parallel - first check whether they cite a shared source.

Test: **"if launched in parallel blind, would facts diverge between the chunks?"**

- **No, the chunks are genuinely independent** (they do not reference each other, do not write into one mutable target, and there is no shared source) - normal parallelism (`parallel`/`pipeline`), as everywhere.
- **Yes, the chunks cite a shared source** (a command/flag list, an API schema, data, a glossary, numbering) that is not yet fixed - blind parallelism causes divergence: each agent invents its own version of the source. Chunks that reference each other (foreign keys, cross-links) or write into one mutable target (a single database/schema, one codebase) are NOT genuinely independent even when they look like different entities: their shared source is that target's schema plus the order the links impose. Then decide by the chunk count, consistent with the "3+ same-type units" rule above:
  - **2 chunks - linear**: too few for parallelism to pay off the background overhead; fix the source first, then write both chunks that cite it;
  - **3+ chunks - a workflow with a phase-0 anchor**: Phase 0 (one agent fixes the source of truth) -> Phase 1 (`parallel` over the chunks, the source passed into each prompt) -> optional Phase 2 (assembly and consistency check).

  The count is the deciding line and it is firm: 4 chunks is "3+", so it goes to the anchor workflow, not linear. A shared source never routes 3+ chunks to a linear plan - the phase-0 anchor keeps the parallelism while killing divergence.

A phase-0 anchor is just a sequential phase before a parallel one (the source of truth is passed into the prompts of all Phase 1 branches). Parallelism is preserved, divergence is not.

Example: "write README, API reference, install guide, FAQ for tool X". All four cite one set of commands/flags. Four chunks is "3+", so this is a workflow with Phase 0 "build the command inventory" (not linear): Phase 0 fixes the commands/flags, Phase 1 writes the four docs in `parallel` with that inventory in each prompt.

Example (shared mutable target): "migrate N tables into one new database, a script per table". The tables write into a single target schema and reference each other via foreign keys - that schema plus the migration order the keys impose is the shared source, so the tables are NOT independent. 3+ tables -> phase-0 anchor (Phase 0 fixes the target schema and FK/migration order), then `parallel` over the per-table scripts - not blind parallel.

## Probe questions (only when borderline)

- How many independent chunks are in the task? (1-2 - likely linear; 3+ - a reason for parallelism)
- Are they same-type or genuinely different?
- Are there dependencies between chunks (one needs another's result)?
- Will several agents write to the same files? (then `isolation:'worktree'` and git are needed)
- Volume: a couple of steps or dozens of units?

## Boundary with agent-constructor

- A one-off orchestration of a concrete task (run it now) - this is workflow-planner.
- Reusable subagent roles (`.claude/agents/*.md`) that are later invoked manually via Agent/Task and coordinated through a README - that is `agent-constructor`.
- They compose: agent-constructor builds the roles, workflow-planner can reference them via `opts.agentType`. But by default a workflow uses the default subagent + prompt.
