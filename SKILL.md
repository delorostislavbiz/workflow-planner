---
name: workflow-planner
description: 'Plans a task and produces an atomic plan. A hybrid gate first decides whether the task fits Dynamic Workflows: if not, it writes a linear PLAN.md (step -> verify); if yes, it writes a plan with branches, roles and parallelism plus a ready-to-run JS script for the Workflow tool. Use when asked to "plan a task", "atomic plan", "workflow plan", "parallelize this task", "do we need a workflow here", "break this into parallel branches". Does NOT create subagents in .claude/agents (that is agent-constructor) - this skill is about one-off orchestration via the Workflow tool (parallel/pipeline) and about plans. It also includes a Prompt Helper that turns a fuzzy idea or a rough draft into a correct workflow prompt; triggers "help me write a workflow prompt", "I have an idea for a workflow", "do I need a workflow", "check my workflow prompt".'
license: MIT
user-invocable: true
argument-hint: [task description]
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Workflow Planner

Turns a task into the right atomic plan. First decides whether the task needs a Dynamic Workflow (parallel orchestration via the Workflow tool) or a plain linear plan. Then writes the matching artifact.

- **Not a fit for a workflow** -> a linear `PLAN.md` in "step -> verify" format.
- **A fit** -> a plan with branches/roles/parallelism + a ready-to-run JS script for the Workflow tool.

Write generated artifacts in the language of the task (match the user's language; do not force English or any other language onto the plan).

## How the skill talks to the user

These rules govern every reply to the user (written in the user's language), at every stage - gate, plan, Prompt Helper, checkpoints:

1. **Plain language, always.** Simple, everyday words. No jargon. If a technical term is unavoidable, unpack it in one short phrase. Short sentences. Point first, detail after.
2. **Always show the logic - briefly.** Say *why* you do each thing, clearly but short. If the user struggles, explain in more detail; the baseline stays plain and simple.
3. **One step at a time.** Lead the user stage by stage. Explain the next step before doing it. One reply = one explanation + one action - do not stack several decisions into a single message.
4. **Don't pick the solution for the user, and don't hand them a menu.** A pointed hint or one recommended next step is fine; ending a reply with "we can do A, B or C - which?" is not. A focused question to fill a missing fact (the gate's 1-2 clarifying questions) is still allowed - that gathers input, it does not outsource the decision.

## Entry routing - Prompt Helper vs planner

Before the gate, route by what the user brings. An explicit user command always beats auto-detection.

| Input | Route |
|------|-------|
| A task already shaped as a workflow prompt | the planner flow below (gate -> plan -> script) |
| A direct imperative ("make N docs/pages/things"), not yet shaped as a workflow prompt | the **Prompt Helper** build-path (gate first) |
| An idea / "help me write a workflow prompt" / "do I need a workflow?" | the **Prompt Helper** build-path |
| "Check my draft" / a near-ready prompt pasted | the **Prompt Helper** draft-audit |

The **Prompt Helper** turns a fuzzy idea or a rough draft into a correct workflow prompt (newcomer-first): it leads with the gate, runs a recipe or an interview, assembles the prompt, and offers an opt-in inline hole-check. It never runs the target workflow. A near-ready prompt goes to draft-audit, not a full rebuild. Details: `reference/prompt-helper.md`; recipes: `reference/prompt-patterns.md`.

## Boundary with agent-constructor

Don't mix them up:
- **agent-constructor** builds reusable subagent roles (`.claude/agents/*.md`) that are later invoked manually via Agent/Task and coordinated through a README.
- **workflow-planner (this skill)** plans one concrete task and generates a single runnable workflow script (`parallel`/`pipeline`).

They compose: if roles already exist in `.claude/agents`, the script can reference them via `opts.agentType`. But by default a workflow uses the default subagent + prompt.

**Depth belongs to agent-constructor, not here.** Nested subagents (a worker that spawns its own sub-workers, up to 5 levels - Claude Code v2.1.172) are NOT available inside a Workflow: workflow agents are leaves and do not receive the Agent tool (verified - see `reference/workflow-primitives.md`, "Depth and nesting"). If a task needs that depth, route it to the Agent-tool / `.claude/agents` path (agent-constructor) and note it in the plan - do not try to express it as a Workflow branch.

## How it works

1. **Understand the task.** Take the description. State assumptions up front. If the wording is ambiguous (especially short / dictated input), ask rather than guess.
1.5. **Build the Acceptance Contract (judge).** Before routing or planning, establish what "done" means for the whole task. Read `reference/acceptance-contract.md` and build an Acceptance Contract: observable predicates, fixed before the work starts, including an independent out-of-sample check. Honor the delegation slider - if the user gives criteria, structure and drill them; if the user is tired or says "decide yourself", auto-draft and then get ratification. Trivial tasks: a one-line contract is enough - do not run a full interview. The contract is **frozen at plan approval** - changing it later is a new round with explicit re-ratification, not a silent edit. The contract feeds the rest of the plan: per-step verifies and the whole-task post-verify check **against** this contract, not ad hoc.
2. **Applicability gate (hybrid).** Read `reference/applicability.md`. Run the task through the criteria. If obvious, give a verdict with a one-line rationale. If borderline, ask 1-2 clarifying questions via AskUserQuestion.
3a. **Not a fit** -> using `templates/linear-plan.md`, write a linear `PLAN.md` to the project root. Show it. Stop.
3b. **A fit** ->
   - Read `reference/plan-to-script.md`. Using `templates/workflow-plan.md`, write an atomic plan: branches, roles (a bundle of atoms), parallel/sequential by dependencies, verify, data passed into prompts.
   - **Show the plan and wait for approval** (checkpoint - before generating the script). STOP here: do not call Write for the `.js` script until the user approves the plan in words.
   - After approval, read `reference/workflow-primitives.md` and generate the JS script using `templates/workflow-script.js`. Then run the self-check checklist at the end of that template before treating the script as ready-to-run.
   - Place the artifacts in the project (see below).
   - **Do not run the script.** Offer to run it as a separate step (an explicit user opt-in; the run itself is done by the Workflow tool, not this skill).
   - **(Optional, on request) Diagram.** If the user asks for a visualization (or accepts a one-line offer), generate a self-contained HTML diagram of the workflow per `reference/diagram-html.md`, in **plain client-facing language** (the audience is a non-technical client and the tired author): everyday words, a one-line explanation under each block, a legend - no internal jargon on screen. It is a view of the plan - it must match the branch map. Workflow plans only; not produced unless asked.

## Atomicity

Every step (linear) or atom (workflow) is **one meaningful action with its own verify** - not a step that hides several sub-actions. If a step packs 3+ sub-actions or more than ~half a day of work (e.g. "migrate all products with attributes, images and variations"), split it into separate atoms, each with its own verify. A coarse step whose verify is only a count ("the number matches") hides systematic errors inside the items - make the verify check content, not just quantity. The plan self-review must check this granularity, not only logic and dependencies. (For workflows the opposite failure also exists - one micro-atom per agent shatters context; see `reference/plan-to-script.md`. An agent's branch is a bundle of atoms.)

## File navigation

| When | Read |
|------|------|
| Helping the user write the prompt (idea or draft) | `reference/prompt-helper.md` |
| Matching a task to a workflow recipe | `reference/prompt-patterns.md` |
| Building the Acceptance Contract (definition of done, before the gate) | `reference/acceptance-contract.md` |
| Deciding applicability | `reference/applicability.md` |
| Writing a workflow plan | `templates/workflow-plan.md` |
| Translating a plan into a script | `reference/plan-to-script.md` + `reference/workflow-primitives.md` + `templates/workflow-script.js` |
| Writing a linear plan | `templates/linear-plan.md` |
| Drawing the workflow diagram (on request) | `reference/diagram-html.md` |
| Need a worked example | `examples.md` |

Load on demand, not all at once.

## Artifacts - strictly into the current project (CWD)

- Linear or workflow plan: `PLAN.md` in the current project root. **Before writing, check whether `PLAN.md` already exists (Glob). If it does, do not overwrite it silently - ask the user, or write `PLAN.<task>.md` instead. Overwriting an existing plan is an unrecoverable loss.**
- Workflow script: `<project>/.claude/workflows/<kebab-name>.js` (file name = `meta.name`).
- Workflow diagram (optional, on request, workflow plans only): `PLAN.diagram.html` next to `PLAN.md` (or `PLAN.<task>.diagram.html`). Self-contained HTML - see `reference/diagram-html.md`.
- Never write artifacts to the home folder, the skill folder, or anywhere global. Only into the project being worked on.
- If branches write to the same files in parallel, note in the plan that running it needs `isolation:'worktree'` and a git repository (check for `.git`).

## Checkpoints

- State assumptions about the task before starting.
- Before delivering, verify the artifact's language matches the task: plan, gate rationale, agent prompts, and the script's labels/comments are in the user's language - not English by default.
- (Workflow branch only) Show the plan **before** generating the script and wait for approval. A linear plan has no script: write `PLAN.md`, show it, and stop - there is no approval-wait for linear.
- Running the workflow is a separate, explicit user step (a workflow runs in the background and autonomously to the end; control happens at phase boundaries, not inside a phase).

## What it does not do

- Does not run the workflow itself (only prepares the plan + script; running is an opt-in).
- Does not generate the script in the same turn as the plan - the plan must be approved first.
- Does not create `.claude/agents` subagents (that is agent-constructor).
- Does not write artifacts outside the current project.
- Does not split trivial linear work into agents, and does not produce a workflow where a linear plan is enough (that is just overhead).
- Does not use non-existent primitives or options (see the "Fabrications" section in `reference/workflow-primitives.md`).
- Does not auto-insert the HTML diagram: it is produced only on request, for workflow plans only.
