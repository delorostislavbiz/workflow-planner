# Review-workflow — deep multi-agent check of a workflow prompt (Codex)

The heavy, opt-in counterpart of the Prompt Helper's **inline-check** (Step 5 in
`reference/prompt-helper.md`). Instead of the main agent scanning the prompt alone, it
spawns six flat reviewer subagents - each skeptical, each looking through a single lens -
then dedups their findings and consolidates them into one ranked verdict with patch
recommendations.

It reviews the **prompt text only**. It never runs the target-workflow. Subagents are flat
leaf workers; none of them spawns anything.

## When to offer it (and when not)

- Offer it **after** the inline-check, or instead of it, only when the stakes justify the
  cost: the target-workflow is large, writes or deletes things, spends money, or the domain
  is high-stakes. For a small read-only prompt the inline-check is enough - say so instead
  of upselling the deep run.
- **Consent is separate and explicit.** A "yes" to the inline-check is NOT a "yes" to the
  review-workflow. Ask its own question, name the cost plainly ("this spawns 6 subagents"),
  and run it only on a direct yes. Never run it silently.
- The user can also ask for it directly ("do a deep check of this prompt").

## How to run it (main-agent orchestration)

1. Spawn the six reviewer subagents at once (they are independent - full parallelism).
   Each gets the prompt brief below with its own lens and the full prompt under review
   pasted in. Subagents inherit the sandbox; the review needs no file or web access.
2. Wait for all six, then **dedup in the main thread** (same checklist item + overlapping
   quote = one finding). Dedup is main-agent work, not another subagent.
3. Consolidate in the main thread (or one final drafting subagent, verified by the main
   thread): rank the surviving findings and write patch recommendations. Answer in the
   language the reviewed prompt is written in.
4. If every lens comes back clean, short-circuit: verdict `ready`, no findings, no
   consolidation step.

## The six lenses

One lens per known failure class (the pitfalls list in `reference/prompt-helper.md`):

| Lens | Checklist items | Catches |
|------|-----------------|---------|
| goal | 1-2 | vague goal, unnamed output |
| shape | 3-4 | fake parallelism, missing/needless barrier, agent-washing |
| anchor | 5 | shared source without a phase-0 anchor |
| data | 6 | blind subagents missing data, "see the context above" |
| verify | 7, 9 | verify-by-count, unverifiable acceptance criteria |
| risk | 8, 10 | over-promised autonomy, overlapping writes without ownership split |

## Reviewer subagent brief (one per lens)

```text
Role: skeptical reviewer of a workflow prompt, single lens: <lens focus from the table>
Goal: find real defects visible through this lens ONLY
Scope: the prompt text below - nothing else
Out of scope: other lenses; running or simulating the workflow; file/web access
Inputs: <the full prompt under review, pasted verbatim>
Constraints: report only defects you can quote; an empty list is a valid answer -
  do not invent problems to look useful
Return format, one block per finding:
- Severity: blocker | important | minor
- Checklist item: <number>
- Quote: <exact text from the prompt>
- Problem: <one line>
- Fix: <one line>
Stop when: the prompt is fully examined through this lens
```

severity: blocker = the workflow will fail or cause harm; important = results will be
degraded; minor = polish.

## What comes back, and what to do with it

The consolidation returns: a one-line verdict (ready / needs fixes / needs rebuilding),
findings ranked **blocker / important / minor**, and patch recommendations in **keep / fix /
add / remove** form - patches to the existing prompt, not a rebuild.

Feed the result into the Prompt Helper's **repair-loop** (Step 5): fixable by an assumption
-> propose the assumption; needs a fact -> ask one question; blocks the workflow -> back to
the gate. After fixes, re-assemble only the affected parts. A second full review run is
rarely needed - re-check the fixed spots inline.

## Cost honesty

6 subagents per run, token-expensive. Say this before asking for consent. If the user
hesitates, the inline-check remains the default.
