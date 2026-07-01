# Plan: <task name>

Mode: **Dynamic Workflow**
Gate verdict: fits - <which criteria you relied on: independent chunks / flow / volume>
Script artifact: `.claude/workflows/<kebab-name>.js`

> Fill in the angle brackets. Remove the example comments before delivering the plan.
> Before writing to `PLAN.md`: if it already exists in the project root (check with Glob), do not overwrite it silently - ask the user or write `PLAN.<task>.md` instead (an existing plan is unrecoverable once overwritten).

## Assumptions
- <what is taken as given about the task - environment, inputs, scope>
- <assumption 2>

State assumptions before the plan (in the language of the task). If any is wrong, the plan changes - confirm the doubtful ones with the user first.

## Acceptance Contract
- **Goal (one measurable line):** <what + threshold>
- **Done when (observable predicates):**
  - [ ] <checkable predicate>
  - [ ] <checkable predicate>
- **Hard constraints:** <budget / must-haves / deadline>
- **Durability:** <how we confirm it holds, not a one-off>
- **Independent check (out-of-sample):** <who/what, not involved in building>
- **Stop condition:** <met when… ; raise the bar as attempts grow>

What "done" means, fixed before the branches and frozen at plan approval. For trivial tasks this may be a single `Done when:` line. The Post-verify section below checks the final result against this contract.

## Branch map

| Branch | Role | Depends on | Parallel with | Input (data into the prompt) | Output |
|--------|------|-----------|---------------|------------------------------|--------|
| A | <role> | - | B | - | <what it returns> |
| B | <role> | - | A | - | <what it returns> |
| C | <role> | A, B | - | results of A and B | <what it returns> |

The dependency decides the primitive: independent branches in one phase - `parallel`/`pipeline`; a dependent branch - the next phase.

## Phases

### Phase 1: <name>  [parallel: branches are independent]
Primitive: `parallel` (need all results together) or `pipeline` (flow without a barrier, the default)

#### Branch A - <role>
- atom A.1 -> verify: <how to check the result: command / test / visual / adversarial check>
- atom A.2 -> verify: <...>
- Branch A output: <exactly what the agent returns>

#### Branch B - <role>
- atom B.1 -> verify: <...>
- Branch B output: <...>

### Phase 2: <name>  [depends on Phase 1]
Primitive: sequential (input - the previous phase's results)

#### Branch C - <role>
- input: results of A and B (passed into the agent's prompt)
- atom C.1 -> verify: <...>
- Branch C output: <final>

## verify strategy
- Expensive/important branches: a separate verify stage (a skeptic agent checks the result).
- Independence: prefer a check the generator did not make itself - a deterministic gate (test/linter/type-check) first, else a SEPARATE skeptic agent, not the same agent grading its own output.
- Contract as rubric: pass the Acceptance Contract text into the separate skeptic agent's prompt as its rubric, so verify checks the task-level contract, not just the atom's output.
- Cheap ones: the check is built into the prompt ("after X, run test Y").
- The whole result: post-verify below.
- Language check: the plan, branch roles, and the agent prompts are in the language of the task (not English by default).

## Post-verify (after the run)
- Check the final result against every predicate in the Acceptance Contract.
- Run the contract's **independent check** here - a verify the generating agents did not make themselves (a separate skeptic agent for expensive/important goals).
- Pass only if all predicates hold AND the independent check confirms them.

## Scale & budget
- **Agents total:** ~<N> (<branches> work + <verify agents> verify + <1> synthesis). If a branch loops: worst case <cap x rounds>.
- **Waves:** concurrency is capped at min(16, cores-2) - call that cap C. ~<ceil(N/C)> wave(s) of parallel work (on an 8-core machine C=6, so 32 agents is ~6 waves, not 2). More agents than the cap just queue, they do not speed anything up.
- **If the budget runs short:** what gets cut FIRST, explicitly - <e.g. "verify only blocker findings" / "process 20 of 30 pages and say so">. The script checks `budget.remaining()` before big batches and degrades by this rule, never silently.

State the numbers so the user decides about the run knowing its size. A workflow is token-expensive by design; surprising the user with the bill afterwards is a planning failure.

## Running
A workflow runs in the background and requires an explicit opt-in. After the plan is approved, the script `.claude/workflows/<kebab-name>.js` is generated. If branches write to the same files in parallel, `isolation:'worktree'` and a git repository are needed.
After the run - reading the result, recovering failed branches (resume), re-plan vs re-run, and re-use with new `args` - see `reference/after-run.md`. If the task is repeatable (weekly audit, release acceptance), keep run-specific inputs in `args`, not hardcoded.

## Diagram (optional, on request)
A self-contained HTML view of this workflow - phases, parallel branches, and loops with their stop conditions - can be generated on request as `PLAN.diagram.html` (see `reference/diagram-html.md`). Not produced unless asked.
