# Workflow recipes (patterns)

Starter library for Step 2 of the Prompt Helper (`reference/prompt-helper.md`). A recipe is
a **scaffold, not a cage**: take it as a starting shape and adjust; if it doesn't fit, fall
back to the free interview. Every recipe feeds the same checklist (Step 3).

Each card: **When it fits** · **Form** (phases + primitive) · **Slots** (only what this form
needs) · **Feasibility** (honest limits).

Feasibility ground truth (applies to all recipes): loops, retries, dedup, synthesis, and
dynamic accumulation are fine **at the orchestrator level** (the JS script). What is **not**
available: **nested sub-agents** — agents are leaf-agents. The list of units passed to a
`parallel` call must be known **before** that call (scout it inline first if it's dynamic).

---

## 1. Fan-out

- **When it fits:** many same-type units; process or check each, then assemble one summary. (review N files, check N pages, classify N items)
- **Form:** `parallel` over the units -> optional barrier -> one synthesis agent.
- **Slots:** the unit list (or how to obtain it); the per-unit instruction; what the synthesis needs.
- **Feasibility:** the unit list must be known before the `parallel` call. The synthesis **barrier** is justified only if the synthesizer needs all results at once; otherwise skip it.

## 2. Pipeline

- **When it fits:** a stream of items flows through several stages. (migrate N items: discover -> transform -> verify, each)
- **Form:** `pipeline(items, stage1, stage2, ...)` — no barrier between stages; each item flows independently.
- **Slots:** the items; the stages and what each does; the data each item carries.
- **Feasibility:** stages run per item with no cross-item barrier. If a stage genuinely needs all items together, that is a `parallel` barrier, not a pipeline stage — model it explicitly.

## 3. Shared source (phase-0 anchor)

- **When it fits:** several chunks cite one not-yet-fixed source of truth. Apply the **Shared-source threshold rule** in `reference/applicability.md` to decide the threshold (don't restate it here).
- **Form:** phase-0 anchor (one agent fixes the source) -> `parallel` over the chunks with the source in every prompt -> optional consistency check.
- **Slots:** the chunks; the shared source (or how phase 0 fixes it); the per-chunk instruction.
- **Feasibility:** phase 0 is sequential and must finish before the parallel. The fixed source is passed into **every** chunk prompt as a path/anchor artifact — not "context above".

## 4. Research with verification

- **When it fits:** dig a topic from several angles, synthesize, then fact-check the claims.
- **Form:** fan-out searches (`parallel`) -> dedup (plain code) -> verify (a flat `parallel` of skeptics) -> synthesis.
- **Slots:** the question; the search angles; verification depth; output format.
- **Feasibility:** dedup and synthesis are plain-code or single-agent steps, not nested agents. Verification is a flat `parallel` of leaf-agents. Loop-until-dry accumulation is fine at the orchestrator level.

## 5. Variant panel (judge panel)

- **When it fits:** generate several solutions from different angles and pick the best. (design, copy, strategy)
- **Form:** `parallel` attempts (distinct angles) -> `parallel` judges -> one synthesis from the winner.
- **Slots:** the problem; the distinct angles; the judging criteria; output.
- **Feasibility:** attempts and judges are flat `parallel`; the synthesis is a single agent. No nesting.

## 6. Dimension review -> verify findings

- **When it fits:** one artifact or scope reviewed across several independent dimensions, and the findings must survive a check before being reported. (audit a codebase for bugs/security/performance; QA a release; review a document set for facts/style/consistency)
- **Form:** `parallel` over the dimensions -> dedup (plain code) -> a flat `parallel` of skeptics, one per finding, each told to REFUTE it -> one synthesis of the survivors.
- **Slots:** the artifact/scope (paths, not "the project"); the dimensions; the kill bar (what refutes a finding); output format.
- **Feasibility:** the barrier after the dimensions IS justified - dedup needs all findings at once. Verification is a flat `parallel` of leaf-agents. Dedup and ranking are plain code, not agents. If findings can be many, state a cap or a severity floor for the verify stage - or the verify fan-out dwarfs the review itself.

## 7. Migration (discover -> transform -> verify)

- **When it fits:** many same-type items must be moved or converted - files to a new API, tables to a new schema, pages to a new CMS - and each item is transformable on its own once the target rules are fixed.
- **Form:** optional phase-0 anchor (one agent fixes the target rules/schema) -> `pipeline(items, transform, verify)` - each item flows on its own, its verify runs while others still transform.
- **Slots:** the item list (or how to discover it - scout it inline before the workflow); the target rules; the per-item verify (a deterministic gate first: test / compile / schema check); write boundaries.
- **Feasibility:** the item list must be known before the `pipeline` call. If the items cite one not-yet-fixed target (schema, API contract), that is the **Shared-source threshold rule** in `reference/applicability.md` - anchor first, never blind. If items write into shared files, the prompt must say so: `isolation:'worktree'` + git.

## 8. Accumulate until dry (loop with a stop)

- **When it fits:** discovery of unknown size - keep finding until nothing new comes up. (hunt bugs or edge cases, collect sources, enumerate affected call sites)
- **Form:** an orchestrator-level loop: a round of finder agents (`parallel`) -> dedup against EVERYTHING seen so far (plain code) -> stop after K consecutive rounds with nothing new; then optional verify/synthesis of the accumulated set.
- **Slots:** what counts as "the same finding" (the dedup key); K (dry rounds, usually 2); a hard iteration cap; the budget guard.
- **Feasibility:** the loop lives in the script, not in an agent - fine at the orchestrator level. It MUST carry an explicit stop: iteration cap + no-progress break + budget guard, never an open `while(true)` (see "Loops with a stop condition" in `reference/plan-to-script.md`). Dedup against all *seen* findings, not only confirmed ones - otherwise rejected findings reappear every round and the loop never dries.

---

## Doesn't fit / more complex

Fall back to the **free interview** (Step 2 in `reference/prompt-helper.md`): elicit the
checklist from scratch. Don't force a task into a recipe it doesn't match.
