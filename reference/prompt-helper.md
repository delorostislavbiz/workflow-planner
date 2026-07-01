# Prompt Helper — build a correct workflow prompt

The add-on flow of workflow-planner. It helps a user (newcomer-first) turn a fuzzy
idea — or a rough draft — into a **correct task description ("prompt") for a Dynamic
Workflow**. It leads with the gate ("do you even need a workflow?"), then runs a recipe
or an interview, assembles the prompt, and offers an opt-in inline check. It **never runs
the target workflow**.

Respond in the **user's language** (see `output_language` in the state model). Keep it
plain and short. In novice mode, one question at a time.

## Mini-glossary (use these spellings consistently)

- **workflow-planner** — this skill.
- **planner** — the existing flow of the skill: gate -> plan -> JS script.
- **Workflow tool / Dynamic Workflow** — the runtime that runs the JS script with agents (`parallel`/`pipeline`).
- **target-workflow** — the workflow the prompt is being written for. The helper never runs it.
- **review-workflow** — a separate multi-agent run that reviews the prompt for holes (`reference/review-workflow.md`).
- **leaf-agent** — an agent inside a workflow with no nested sub-agents. (Plain "leaf-agent" after first use.)

## Routing (summary; full table in SKILL.md)

| Input | Route |
|------|-------|
| A task already shaped as a workflow prompt | existing `gate -> plan -> script` (not this flow) |
| A direct imperative ("make N docs/pages/things"), not yet shaped as a workflow prompt | **build-path** (gate first) |
| Idea / "help me phrase it" / "do I need a workflow?" | **build-path** (below) |
| "Check my draft" / a near-ready prompt pasted | **draft-audit** (below) |

An explicit user command always beats auto-detection. A near-ready prompt goes to
**draft-audit**, not a full rebuild.

## Flows

**build-path (from an idea):**
```
0 mode/language -> 1 gate -> (linear: recommend + short plan + STOP; still apply item 8 to risky steps)
                          -> (unclear: 1-2 probe questions -> fuzzy-input exit)
                          -> (fit) -> 2 recipe | interview
   -> 3 checklist -> 4 assemble -> 5 hole-check (opt-in) -> 6 hand off
```
**draft-audit (from a draft):**
```
0 mode/language -> 1 express gate (is a workflow needed?)
   -> A check the draft against the checklist + pitfalls
   -> B patch recommendations: keep / fix / add / remove
   -> (full rebuild ONLY on request)
```

## State model (the skill's memory between turns)

Maintain an internal state table and update it every turn:

`mode` · `output_language` · `gate_decision` · `pattern_id` · `known_facts` ·
`assumptions` · `missing_blockers` · `open_questions` · `risk_flags` · `next_action`.

Hard rules:
- **Do not re-ask** a slot that is already filled.
- **Do not assemble** the final prompt while a blocker slot is open without an **explicit
  assumption** — and any assumption used is recorded in `assumptions` and shown to the user.

## Component ownership (no overlap)

- **gate** — decides ONLY `workflow / no-workflow / unclear`. Collects nothing.
- **pattern** — proposes a form and the **minimal** pattern-slots.
- **checklist** — validates completeness; **never re-asks** a closed slot.
- **assembler** — only formulates the prompt; makes no new decisions.

## Step 1 — Gate conversation

Open with one plain line (not a lecture):
> "A workflow means several agents working at once or as a pipeline. It pays off when
> there are same-type chunks to do at once, or a multi-stage flow at volume. If it's just
> steps one after another, a plain linear plan is better."

Ask the minimum, in plain words, one at a time (novice):
- Same-type chunks done at once, or steps in sequence?
- How many such chunks — a couple, or dozens?
- Do the chunks depend on each other / write into the same place?
- Will you need to step in and decide mid-way? (a workflow runs to the end)

Decide using **the deciding rule** and **the Decision matrix** in `reference/applicability.md`
— apply them, do not restate them here. For the shared-source case, apply the
**Shared-source threshold rule** anchor in `reference/applicability.md`.

Outcomes:
- **linear** — say it plainly (tone rules below), offer a short linear plan, **STOP**. Even on a linear verdict, if any step writes / deletes / costs money / touches external services, apply checklist item 8 (confirm before the dangerous step) inside that short plan; never promise blind autonomy.
- **unclear** — 1-2 probe questions, then the fuzzy-input exit (below).
- **fit** — name *why* it fits (this teaches the user), continue to Step 2.

**Persistence rule** (user insists on a workflow after a linear verdict): explain once,
respect the choice, continue, but tag the prompt "workflow chosen against recommendation".
"Give both" only on explicit request.

**Fuzzy-input exit:** after the probe question(s) (1-2), state the assumptions, then ask
"assemble a draft on these assumptions, or clarify more?". If goal / result / units of
parallelism are still missing, do **not** output the final prompt as ready.

## Step 2 — Recipe or interview

See `reference/prompt-patterns.md`.
- **novice:** propose the single most likely recipe ("looks like a Fan-out — does that
  fit?") plus a "doesn't fit" option. Do not dump the full menu.
- **concise:** show the compact recipe list at once.

A recipe is a **scaffold, not a cage** — if it doesn't fit, fall back to the interview.
Both paths feed the same checklist (Step 3).

## Step 3 — Correct-prompt checklist (the heart)

Internal QA, **not a questionnaire**. Pull items through the conversation; defaults fill
many; the recipe closes some; surface only what the task needs. Each item is a
**`question`** (how to elicit it) plus a **`why`** (one line). Keep all 10.

1. **Goal & result** — Q: "What do you want, and what does 'done' look like?" — why: without it the agents scatter.
2. **Output** — Q: "What should come out — a report, files, text?" — why: shapes the result. Default: a task description for the planner.
3. **Units of parallelism** — Q: "What gets done at once, how many, same-type?" — why: this is the fan-out.
4. **Dependencies & order** — Q: "What waits for what; where are the barriers?" — why: otherwise you get fake parallelism.
5. **Shared source of truth** — Q: "Do several chunks rely on one not-yet-fixed source?" — why: divergence. Apply the **Shared-source threshold rule** in `reference/applicability.md` (don't restate it).
6. **Data in the leaf-agent prompt** — Q: "What does each agent need to succeed alone — it can't see you or the other agents?" — why: blind leaf-agents fail. The prompt must carry goal, input artifacts, **paths/links**, constraints, result criteria, output format. Give bulk data via explicitly available files or an anchor artifact; **never "see the context above"** (and don't dump everything inline either).
7. **Verify by content** — Q: "How do we check each unit by its content, not by a count?" — why: "3 done" hides defects.
8. **Autonomy by risk level** — Q: "Which steps write, delete, cost money, or touch external services?" — why: a workflow runs to the end. Default: read-only -> autonomous to the end; write/destructive/paid/external -> **confirm before the dangerous step**; risk unknown -> ask one question or record the limit "do not perform dangerous actions". If the domain is high-stakes (legal / medical / financial), set `risk_flags` and require a human gate before any external or irreversible output. Also: what counts as an emergency.
9. **Acceptance criteria** — Q: "How do we know the whole thing is done and good, and who checks?" — why: a clear finish line.
10. **Write-boundaries & environment** — Q: "Which files does each agent touch?" — why: parallel writes collide. Mini-checklist: which files are read-only; what each agent may change; who merges/synthesizes; what to do on conflict; whether `isolation:'worktree'` + git is needed; which commands are forbidden. No nested sub-agents (agents are leaf-agents).

## Run modes (what may execute, and when)

- **inline-check** — one assistant, no agents. Only after a "yes". **This is the default check.**
- **review-workflow** — a separate multi-agent review run (6 skeptic lenses + synthesis). Only after a **separate** explicit "yes" — consent to the inline-check does not carry over. Offer it only when the stakes justify the cost (large / write-heavy / high-stakes target). How to deliver it and the ready script: `reference/review-workflow.md` + `templates/review-prompt.js`.
- **target-workflow** — the workflow the prompt is for. The helper **never** runs it.

So: nothing silently; inline-check after asking; review-workflow only after a separate yes.

## Step 5 — Hole-check (opt-in) + repair-loop

Offer (don't run silently): "Want a quick check of the prompt for holes before the planner?"
If yes -> **inline-check** against the checklist plus the pitfalls list.

Pitfalls to look for: over-promised autonomy; unverifiable criteria; agent-washing; fake
parallelism / a missing barrier; a shared source without an anchor; a leaf-agent missing
data (item 6); verify by count; a missing step; dangerous actions without confirmation;
overlapping file writes.

**Repair-loop:**
- fixable by an assumption -> propose the assumption text (record in `assumptions`);
- needs a fact -> ask one question;
- blocks the workflow -> back to the gate, or a no-go;
- after a fix, re-assemble only the affected parts.

Findings are ranked: **blocker / important / minor**. The target-workflow is never run.

For a large, write-heavy, or high-stakes prompt, after (or instead of) the inline check,
offer the deep **review-workflow** — with its own explicit consent and an honest cost line
(see `reference/review-workflow.md`). Its findings feed this same repair-loop.

## Steps 4 & 6 — Assemble and hand off

Assemble the prompt from the filled checklist, in `output_language`, using the skeleton
below. The assembler makes no new decisions.

Hand off: present the clean prompt; state the next step ("paste it into workflow-planner —
it runs the gate, writes the plan and the script; I won't run anything"); offer to save it
to a file.

### Assembly skeleton (fill only what applies, keep it plain)

```
Goal & result
Units & parallelism            (+ shared source / phase-0 anchor, if any)
Dependencies & barriers
Per-branch data                (paths / anchor artifact, not "context above")
Verify-by-content, per unit
Autonomy & emergencies         (by risk level)
Acceptance criteria
Write-boundaries & environment (read-only files, ownership, worktree+git if needed)
Output
```

## Presentation modes

- **novice:** one-line explanation, one question at a time, plain examples.
- **concise:** propose the likely pattern + the missing slots in one compact block; no one-by-one.

Pick by signals (newcomer/experienced, "keep it short"); switch on request. Logic is the
same in both — only the delivery changes.

## Tone (operational rules)

Don't shame. Don't argue past one message. Give the reason in one sentence. Always give the
next practical step.

## Output language

Work — and write the final prompt — in the user's input language. Don't force Russian or
English. (Tests include a non-Russian case to guard this.)

## Edge cases (expected behavior)

- **Insists on a workflow for a linear task** -> persistence rule (Step 1): explain once, respect it, tag "against recommendation".
- **"Make it fully autonomous" for a destructive/write task** -> checklist item 8: require confirmation before the dangerous step; don't promise blind autonomy.
- **No access to web / repo / secrets / tools** -> record it as a constraint; don't silently assume access.
- **Needs current/fresh sources** -> flag it as a risk/constraint in the prompt.
- **Project too broad, no boundaries** -> decompose; take the first concrete piece.
- **Agents must change overlapping files** -> checklist item 10 (worktree / ownership).
- **High-stakes (legal / medical / financial)** -> heightened caution; explicit confirmations; don't over-promise.
- **Asks for nested sub-agents** -> there are none (agents are leaf-agents); offer a flat shape, or route to agent-constructor.
- **Fuzzy / dictated input** -> interpret by meaning; state assumptions; confirm (plus the fuzzy-input exit in Step 1).
