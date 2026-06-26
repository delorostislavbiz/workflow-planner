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

---

## Doesn't fit / more complex

Fall back to the **free interview** (Step 2 in `reference/prompt-helper.md`): elicit the
checklist from scratch. Don't force a task into a recipe it doesn't match.
