# Parity checklist — Claude skill ↔ Codex copy

The Codex version (`plugins/workflow-planner-codex/skills/workflow-planner/`) is a separate
copy with the same logic but a different runtime (no Workflow tool, no JS scripts - the main
agent orchestrates flat subagents). When you change LOGIC in a shared file, mirror the change
in its counterpart - or record it in **Pending** below, consciously. Runtime-specific wording
is expected to differ; the decision rules must not.

Advisory check: `node tools/check-parity.js` compares section headings of the shared pairs
and flags drift (it cannot judge meaning - it catches forgotten mirrors, not bad ones).

## File map

| Claude (root) | Codex counterpart | Parity |
|---------------|-------------------|--------|
| `SKILL.md` | `SKILL.md` | shared logic, runtime wording differs |
| `reference/applicability.md` | `reference/applicability.md` | shared rules (thresholds, Decision Matrix, threshold anchor) - heading phrasing differs by design, so the checker tests existence only; verify rule parity by eye |
| `reference/acceptance-contract.md` | `reference/acceptance-contract.md` | shared - keep identical |
| `reference/prompt-helper.md` | `reference/prompt-helper.md` | shared logic; run-modes DIVERGE until the review-workflow port lands (Codex still says "Phase 2, not MVP" - see Pending) |
| `reference/prompt-patterns.md` | `reference/prompt-patterns.md` | shared recipes, Form/Feasibility reworded per runtime |
| `reference/workflow-primitives.md` | `reference/codex-workflow-runtime.md` | intentionally different (runtimes differ) |
| `reference/plan-to-script.md` | `reference/plan-to-codex-workflow.md` | intentionally different |
| `reference/diagram-html.md` | — | Claude-only (by design) |
| `templates/workflow-plan.md` | `templates/codex-workflow-plan.md` | counterparts, structure should track |
| `templates/linear-plan.md` | `templates/linear-plan.md` | shared rules (self-review items, quality bar, assumptions note); verdict phrasing and tool names differ per runtime |
| `templates/workflow-script.js` | — | Claude-only (Codex has no JS runtime) |
| `templates/review-prompt.js` | — | Claude-only |
| `examples.md` | `examples.md` | shared idea; artifacts differ per runtime |
| `tests/prompt-helper/*` | `tests/prompt-helper/*` | shared |
| `tests/gate/*` | — | pending (see below) |
| `tools/validate-workflow.js` | — | Claude-only (validates the JS runtime) |
| `tools/run-fixtures.js` | usable for Codex via `--cmd "codex exec"` | shared tool |
| `tools/check-parity.js` | n/a | the checker itself |

## Procedure after a logic change

1. Change the Claude-side file.
2. Same commit or the next one: mirror the rule into the counterpart (translate runtime
   wording, keep thresholds/decision rules identical - e.g. the Shared-source threshold
   rule must say "3+" in both).
3. Run `node tools/check-parity.js`; explain or fix every flagged drift.
4. If you defer the mirror, add it to **Pending** with a date - a silent gap is the failure
   mode this file exists to prevent.

## Pending (consciously deferred)

- **2026-07-01** `reference/review-workflow.md` + `templates/review-prompt.js` - the deep
  prompt-review for Codex needs a codex-runtime shape (main agent + 6 flat skeptics);
  logic is portable, packaging is not written yet. Until it lands, the Codex
  `reference/prompt-helper.md` run-modes and mini-glossary still call the review-workflow
  "Phase 2, not MVP" - update BOTH when porting.
- **2026-07-01** Codex `tests/prompt-helper/runbook.md` has no "Automated runs" section;
  the `[multi-turn]` tag is defined inline in the fixtures header instead. When the runner
  workflow is adopted for Codex (`tools/run-fixtures.js --cmd "codex exec"`), port the
  runbook section too.
- **2026-07-01** `reference/after-run.md` - resume semantics are Workflow-tool-specific;
  a Codex counterpart would cover re-running failed subagents instead.
- **2026-07-01** `examples.md` examples 3-4 (anchor, loop-until-dry) - port with Codex
  orchestration wording instead of JS scripts.
- **2026-07-01** `tests/gate/fixtures.md` - G1/G9 reference the Workflow-tool flow; a Codex
  port must reword script-related claims.
- **2026-07-01** `templates/workflow-plan.md` "Scale & budget" section - mirror into
  `templates/codex-workflow-plan.md` with Codex numbers (prefer 2-6 subagents, no 16-cap).
