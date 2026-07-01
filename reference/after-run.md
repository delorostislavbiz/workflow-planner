# After the run — reading results, recovering, re-using

The skill's job ends at "plan + script, run is your explicit step". This file covers what
comes after the user runs the workflow: how to read the outcome, what to do when branches
fail, how to resume instead of re-paying for everything, and when to re-plan. Use it when
the user comes back with a finished, interrupted, or disappointing run.

## 1. Reading the result

- The workflow runs in the background; what the script `return`s is the final result, and
  progress is visible via `/workflows` while it runs.
- First step is always the plan's **Post-verify**: check the result against every predicate
  of the Acceptance Contract, and run the contract's **independent check** - a check the
  generating agents did not produce themselves. "The workflow finished" is not "the task is
  done"; only the contract decides that.
- If the script degraded explicitly (fewer branches survived than the norm - the
  `.filter(Boolean)` path), the result says so. Treat "complete-looking but silently
  thinner" as a red flag: count what came back against what was planned.

## 2. When branches failed

A failed branch is a `null` (the script was built to guard or filter these). Decide by role:

- **Interchangeable collection item** (one page of 30): if enough survived to satisfy the
  contract, accept the explicit degradation; if not, re-run the missing part.
- **Named required branch** (the anchor, the synthesis): the run stopped early by its own
  guard. Fix the cause (usually a prompt missing data, or a too-hard atom) and resume.

## 3. Resume - do not re-pay for finished work

**Documented behavior** (official docs): a stopped or paused run can be resumed - from
`/workflows` (select the run, press `p`) or by asking Claude to relaunch the workflow with
the same script. Agents that already completed return their **cached results**; the rest
run live. An edited script can be relaunched from the edited version.

**Finer-grained mechanism** (from the Workflow tool description, NOT in the public docs -
see the Empirical facts registry in `reference/workflow-primitives.md`): relaunching with
`resumeFromRunId: '<runId of the prior run>'` replays the longest **unchanged prefix** of
`agent()` calls from cache and runs live from the first edited or new call onward. If this
parameter is absent in the user's version, fall back to the documented path above -
relaunch the same (or edited) script and rely on completed-agent caching.

Practical consequences:

- **Interrupted run, nothing changed** -> resume as-is: completed agents are free, the rest run.
- **One branch needs a fix** -> edit ONLY that branch's prompt in the script, then resume.
  Under prefix semantics, an edit early in the script re-runs everything after it - prefer
  fixes that touch the latest possible point.
- Stop the still-running prior run first (it cannot be resumed while active).
- Resume works within the same session. In a fresh session, re-running the saved script is
  a new run - budget accordingly.
- **After any resume, re-run Post-verify on the WHOLE result**, not only the re-run part -
  a cached prefix plus a new tail can disagree (e.g. the anchor changed but cached branches
  used the old one; then invalidate from the anchor down, do not patch around it).

## 4. Re-run vs re-plan

Resume fixes execution problems. Some failures are plan problems - resume cannot fix those:

- The contract cannot be met as written -> that is a **new round with explicit
  re-ratification** (the Freeze Rule in `reference/acceptance-contract.md`), never a quiet
  lowering of the bar to match what came out.
- Branches kept colliding or starving each other -> the decomposition was wrong; back to the
  plan (branch map), not to prompt-tweaking.
- The whole shape fought the task (everything waited on everything) -> the gate verdict
  deserves a second look; maybe this was a linear task.

Rule of thumb: a **content** defect in one branch -> edit that prompt and resume; a
**structure** defect (wrong branches, wrong dependencies, wrong "done") -> re-plan.

## 5. Re-use - a run that earned its keep

A script in `.claude/workflows/<name>.js` is a saved, named workflow - the second run of
the same procedure costs zero planning. If the task smells repeatable (weekly audit, release
acceptance, content check before publishing), say so at delivery and prepare the script for
it:

- Move the run-specific inputs (list of pages, date, target dir) out of the script body and
  into **`args`** - the script reads `args`, the user passes new values per run. Do not
  hardcode what will change next week.
- Keep the Acceptance Contract in the plan next to the script: the next run is judged by
  the same contract, and drift ("this week 3 pages failed but ship anyway") is a contract
  change - explicit, not silent.

## What this file does NOT change

Running, resuming and re-running remain the user's explicit steps, done by the Workflow
tool. The skill reads results, edits scripts and plans - it does not launch anything.
