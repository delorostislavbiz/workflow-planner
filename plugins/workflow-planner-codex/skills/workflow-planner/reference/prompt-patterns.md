# Workflow recipes (patterns) — Codex

Starter library for Step 2 of the Prompt Helper (`reference/prompt-helper.md`). A recipe is
a **scaffold, not a cage**: take it as a starting shape and adjust; if it doesn't fit, fall
back to the free interview. Every recipe feeds the same checklist (Step 3).

Each card: **When it fits** · **Form** (phases + how the main agent runs the subagents) ·
**Slots** (only what this form needs) · **Feasibility** (honest limits).

Feasibility ground truth (applies to all recipes): loops, retries, dedup, synthesis, and
dynamic accumulation are fine **at the main-agent (orchestrator) level** — the main thread
does them, not a subagent. What is **not** available: **nested subagents** — Codex
subagents are flat leaf workers by default. The list of units to fan out over must be known
**before** the main agent spawns the subagents (scout it inline first if it's dynamic).

---

## 1. Fan-out

- **When it fits:** many same-type units; process or check each, then assemble one summary. (review N files, check N pages, classify N items)
- **Form:** the main agent spawns one flat subagent per unit (running at once) -> optional wait-for-all barrier -> one synthesis subagent (or the main agent synthesizes).
- **Slots:** the unit list (or how to obtain it); the per-unit instruction; what the synthesis needs.
- **Feasibility:** the unit list must be known before the main agent spawns the workers. The synthesis **barrier** (wait for all) is justified only if the synthesizer needs all results at once; otherwise let each finish on its own.

## 2. Pipeline

- **When it fits:** a stream of items flows through several stages. (migrate N items: discover -> transform -> verify, each)
- **Form:** each item flows through the stages; the main agent moves an item to the next stage as soon as its previous stage finishes — no global barrier between stages.
- **Slots:** the items; the stages and what each does; the data each item carries.
- **Feasibility:** stages run per item with no cross-item barrier. If a stage genuinely needs all items together, that is a wait-for-all barrier, not a per-item stage — model it explicitly.

## 3. Shared source (phase-0 anchor)

- **When it fits:** several chunks cite one not-yet-fixed source of truth. Apply the **Shared-source threshold rule** in `reference/applicability.md` to decide the threshold (don't restate it here).
- **Form:** phase 0 — one subagent (or the main agent) fixes the source -> then the main agent spawns one subagent per chunk with the source in every prompt -> optional consistency check.
- **Slots:** the chunks; the shared source (or how phase 0 fixes it); the per-chunk instruction.
- **Feasibility:** phase 0 is sequential and must finish before the fan-out. The fixed source is passed into **every** chunk prompt as a path/anchor artifact — not "context above".

## 4. Research with verification

- **When it fits:** dig a topic from several angles, synthesize, then fact-check the claims.
- **Form:** fan-out search subagents -> dedup by the main agent (plain work, not a subagent) -> a flat set of skeptic subagents verify -> synthesis.
- **Slots:** the question; the search angles; verification depth; output format.
- **Feasibility:** dedup and synthesis are main-agent or single-subagent steps, not nested agents. Verification is a flat set of leaf subagents. Loop-until-dry accumulation is fine at the main-agent level.

## 5. Variant panel (judge panel)

- **When it fits:** generate several solutions from different angles and pick the best. (design, copy, strategy)
- **Form:** flat subagent attempts (distinct angles) -> flat judge subagents -> one synthesis by the main agent.
- **Slots:** the problem; the distinct angles; the judging criteria; output.
- **Feasibility:** attempts and judges are flat subagents; the synthesis is a single agent. No nesting.

---

## Doesn't fit / more complex

Fall back to the **free interview** (Step 2 in `reference/prompt-helper.md`): elicit the
checklist from scratch. Don't force a task into a recipe it doesn't match.
