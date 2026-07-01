# Review-workflow — deep multi-agent check of a workflow prompt

The heavy, opt-in counterpart of the Prompt Helper's **inline-check** (Step 5 in
`reference/prompt-helper.md`). Instead of one assistant scanning the prompt, six skeptic
agents review it in parallel, each through a single lens, then one synthesis agent merges
the findings into a ranked verdict with patch recommendations.

It reviews the **prompt text only**. It never runs the target-workflow.

## When to offer it (and when not)

- Offer it **after** the inline-check, or instead of it, only when the stakes justify the
  cost: the target-workflow is large (10+ agents), writes or deletes things, spends money,
  or the domain is high-stakes. For a small read-only prompt the inline-check is enough -
  say so instead of upselling the deep run.
- **Consent is separate and explicit.** A "yes" to the inline-check is NOT a "yes" to the
  review-workflow. Ask its own question, name the cost plainly ("this launches 7 agents in
  the background"), and run it only on a direct yes. Never run it silently.
- The user can also ask for it directly ("do a deep check of this prompt").

## How to deliver it

1. Copy `templates/review-prompt.js` into `<project>/.claude/workflows/review-workflow-prompt.js`.
   The script is complete - no placeholders to fill.
2. Translate the agent prompts and `log` lines into the user's language (the standard
   language rule; the synthesis agent already answers in the language of the reviewed prompt).
3. Optionally run `node <skill-dir>/tools/validate-workflow.js` on the copy (mechanical check).
4. The run itself is the user's explicit step, done by the Workflow tool, with
   **`args` = the prompt text under review** (a plain string). The skill does not run it.

## The six lenses

One lens per known failure class (the pitfalls list in `reference/prompt-helper.md`):

| Lens | Checklist items | Catches |
|------|-----------------|---------|
| goal | 1-2 | vague goal, unnamed output |
| shape | 3-4 | fake parallelism, missing/needless barrier, agent-washing |
| anchor | 5 | shared source without a phase-0 anchor |
| data | 6 | blind agents missing data, "see the context above" |
| verify | 7, 9 | verify-by-count, unverifiable acceptance criteria |
| risk | 8, 10 | over-promised autonomy, overlapping writes without isolation |

Each lens returns structured findings (severity + exact quote + problem + fix) and is told
that an empty list is a valid answer - lenses must not invent problems to look useful.

## What comes back, and what to do with it

The synthesis returns: a one-line verdict (ready / needs fixes / needs rebuilding), findings
ranked **blocker / important / minor**, and patch recommendations in **keep / fix / add /
remove** form - patches to the existing prompt, not a rebuild. (If every lens comes back
empty, the run short-circuits: it returns `verdict: 'ready'` with no findings and the
synthesis agent never runs.)

Feed the result into the Prompt Helper's **repair-loop** (Step 5): fixable by an assumption
-> propose the assumption; needs a fact -> ask one question; blocks the workflow -> back to
the gate. After fixes, re-assemble only the affected parts. A second full review run is
rarely needed - re-check the fixed spots inline.

## Cost honesty

7 agents per run (6 lenses + 1 synthesis), background, token-expensive. Say this before
asking for consent. If the user hesitates, the inline-check remains the default.
