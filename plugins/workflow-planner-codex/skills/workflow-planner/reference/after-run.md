# After the run — reading results, recovering, re-using (Codex)

The workflow ran: the main agent spawned the flat subagents, waited, and integrated their
results. This file covers what comes after - how to judge the outcome, what to do when
branches failed, and how to make a good run repeatable. Use it when the user comes back
with a finished, interrupted, or disappointing run.

Honest runtime difference from the Claude version: Codex has **no resume cache**. A
finished subagent's output lives in the conversation; there is nothing to replay. Recovery
means re-running the failed branches only - never the whole workflow by reflex.

## 1. Reading the result

- First step is always the plan's **final post-verify**: check the result against every
  predicate of the Acceptance Contract, and run the contract's **independent check** - a
  check the generating subagents did not produce themselves (deterministic first: tests,
  build, schema, source spot-check). "All branches returned" is not "the task is done";
  only the contract decides that.
- Count what came back against the branch map. If some branches were dropped and the run
  continued, the final answer must state the missing coverage explicitly (the failure rule
  in `reference/plan-to-codex-workflow.md`). Treat "complete-looking but silently thinner"
  as a red flag.

## 2. When branches failed

Decide by the branch's role in the plan:

- **Interchangeable collection item** (one page of 30): if enough survived to satisfy the
  contract, accept the explicit degradation; if not, re-run the missing items.
- **Named required branch** (the anchor, the verifier, the synthesis input): do not patch
  around it. Fix the cause - usually a brief missing data, a too-wide scope, or a
  constraint that was not copied into the prompt - and re-run that branch.

## 3. Re-running failed branches (no resume - re-run surgically)

- Re-spawn ONLY the failed branch, with its original prompt brief **plus the fix** (the
  missing input pasted in, the scope narrowed, the constraint added). Completed branches'
  outputs are already in hand - do not re-run them.
- If the failed branch fed later branches, re-run those dependents too - their inputs
  changed. Anything downstream of a changed anchor is stale by definition: invalidate from
  the anchor down, do not patch around it.
- **After any partial re-run, re-run the final post-verify on the WHOLE result**, not only
  the re-run part - old branches and new ones can disagree.
- Re-running costs what it costs: say so before spawning, same as at the first approval.

## 4. Re-run vs re-plan

Re-running fixes execution problems. Some failures are plan problems:

- The contract cannot be met as written -> a **new round with explicit re-ratification**
  (the Freeze Rule in `reference/acceptance-contract.md`), never a quiet lowering of the
  bar to match what came out.
- Branches kept colliding on the same files or starving each other -> the decomposition was
  wrong; back to the branch map, not to brief-tweaking.
- The whole shape fought the task (everything waited on everything) -> the gate verdict
  deserves a second look; maybe this was a linear task.

Rule of thumb: a **content** defect in one branch -> fix its brief and re-run it; a
**structure** defect (wrong branches, wrong dependencies, wrong "done") -> re-plan.

## 5. Re-use - a run that earned its keep

The plan file (`PLAN.md`) with its Subagent Prompt Briefs IS the reusable artifact: the
second run of the same procedure costs zero planning. If the task smells repeatable (weekly
audit, release acceptance, content check before publishing), prepare the plan for it:

- Mark the run-specific inputs in the briefs (list of pages, date, target dir) as
  **parameters** - a short "inputs of this run" block at the top of the plan that the user
  updates per run, so briefs reference it instead of hardcoding values.
- Keep the Acceptance Contract next to the briefs: the next run is judged by the same
  contract, and drift ("this week 3 pages failed but ship anyway") is a contract change -
  explicit, not silent.
- Every new run still starts with explicit user approval - a saved plan is not standing
  permission to execute (the Run Checkpoint rule).

## What this file does NOT change

Running and re-running remain the user's explicit opt-in. The skill reads results, edits
plans and briefs - it does not spawn subagents without approval.
