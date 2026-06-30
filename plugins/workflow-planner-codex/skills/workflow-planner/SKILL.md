---
name: workflow-planner
description: Decide whether a task needs a linear plan or a Codex multi-agent workflow plan. Use when asked to plan a task, make an atomic plan, parallelize work, decide whether subagents are justified, break work into branches, or create a workflow plan for Codex. This Codex version does not generate Claude Dynamic Workflow JS scripts; it prepares a flat Codex subagent workflow plan and runs it only after explicit user approval.
---

# Workflow Planner for Codex

Turn a task into the right atomic plan for Codex.

- **Not a fit for subagents** -> write a linear `PLAN.md` in "step -> verify" format.
- **A fit for subagents** -> write a flat Codex multi-agent workflow plan with phases, branches, roles, prompts, handoffs, and verification gates.

Write generated artifacts in the language of the user's task. Do not force English.

## Runtime Boundary

This is the Codex adaptation of the Claude workflow-planner skill. Keep the distinction clear:

- Claude Dynamic Workflows use a saved JS script and primitives such as `agent`, `parallel`, and `pipeline`.
- Codex uses main-thread orchestration of subagents. The main agent spawns, steers, waits for, closes, verifies, and integrates subagent results.
- Codex subagents should be treated as **flat leaf workers** by default. Do not design plans that require a child agent to spawn its own child agents. Codex can be configured for deeper nesting with `agents.max_depth`, but the default is direct children only and public workflows must not depend on recursive delegation.

The multi-agent discipline from the local `multiagent-workflow` plugin is built into this skill: start from facts, choose linear work when parallelism is not justified, keep delegation bounded, accept artifacts instead of summaries, and verify before synthesis. Users should not need to install a separate multiagent plugin for this skill to be useful.

## How It Works

1. **Understand the task.** State assumptions up front. If the task is ambiguous and guessing would change the plan, ask a concise clarifying question.
1.5. **Build the Acceptance Contract (judge).** Before routing or planning, establish what "done" means for the whole task. Read `reference/acceptance-contract.md` and build an Acceptance Contract: observable predicates, fixed before the work starts, including an independent out-of-sample check and a stop condition. Honor the delegation slider - if the user gives criteria, structure and drill them; if the user is tired or says "decide yourself", auto-draft and then get ratification. Trivial tasks: a one-line contract is enough - do not run a full interview. The contract is **frozen at plan approval** - changing it later is a new round with explicit re-ratification, not a silent edit. It feeds the rest of the plan: per-step verifies, the whole-task post-verify, and the rubric handed to any verifier subagent - all check **against** this contract, not ad hoc.
2. **Applicability gate.** Read `reference/applicability.md`. Decide whether the task benefits from flat Codex subagents or should stay linear.
3. **Linear path.** If not a fit, use `templates/linear-plan.md` and write `PLAN.md` in the project root. Show it and stop.
4. **Workflow path.**
   - Read `reference/plan-to-codex-workflow.md` and `reference/codex-workflow-runtime.md`.
   - Use `templates/codex-workflow-plan.md` to write an atomic workflow plan.
   - Show the plan and wait for explicit approval before running any subagents.
   - After approval, run the workflow from the main thread with flat subagents. Do not ask any subagent to spawn more subagents.
   - After subagents finish, inspect their artifacts or cited evidence, run deterministic checks where possible, and synthesize the final result.

## Atomicity

Every linear step or workflow atom is one meaningful action with its own verify. Split any step that hides 3+ sub-actions or more than roughly half a day of work. Avoid the opposite mistake too: do not create one subagent per micro-step. A subagent branch should be a coherent bundle of atoms.

## File Navigation

| When | Read |
|------|------|
| Building the Acceptance Contract (definition of done, before the gate) | `reference/acceptance-contract.md` |
| Deciding applicability | `reference/applicability.md` |
| Writing a Codex workflow plan | `templates/codex-workflow-plan.md` |
| Mapping a plan to subagents | `reference/plan-to-codex-workflow.md` + `reference/codex-workflow-runtime.md` |
| Writing a linear plan | `templates/linear-plan.md` |

Load on demand, not all at once.

## Artifacts - Current Project Only

- Linear or workflow plan: `PLAN.md` in the current project root.
- Before writing, check whether `PLAN.md` already exists. If it exists, do not overwrite it silently; ask the user or write `PLAN.<task>.md`.
- Optional workflow diagram, only if requested: `PLAN.diagram.html` next to the plan.
- Do not write artifacts to the user's home folder, the skill folder, the plugin folder, or anywhere global.

## Checkpoints

- State assumptions before the plan.
- For workflow plans, show the plan before running subagents and wait for explicit approval.
- Running subagents is a separate user opt-in. A plan is not permission to execute the workflow.
- Verify that the plan, branch roles, prompts, and final labels match the user's language.
- Keep user constraints in every subagent prompt: language, paths, read-only/edit policy, sandbox, web policy, budget, and approval rules.

## What It Does Not Do

- Does not generate Claude `.claude/workflows/*.js` scripts.
- Does not rely on Claude Dynamic Workflow primitives.
- Does not require a separate `multiagent-workflow` plugin installation.
- Does not rely on recursive subagents.
- Does not split trivial linear work into agents.
- Does not run subagents before explicit user approval.
