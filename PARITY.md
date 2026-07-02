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
| `reference/prompt-helper.md` | `reference/prompt-helper.md` | shared logic, run-modes wording differs per runtime |
| `reference/prompt-patterns.md` | `reference/prompt-patterns.md` | shared recipes, Form/Feasibility reworded per runtime |
| `reference/workflow-primitives.md` | `reference/codex-workflow-runtime.md` | intentionally different (runtimes differ) |
| `reference/plan-to-script.md` | `reference/plan-to-codex-workflow.md` | intentionally different |
| `reference/diagram-html.md` | — | Claude-only (by design) |
| `reference/review-workflow.md` | `reference/review-workflow.md` | shared logic (6 lenses, consent rules); Codex ships the reviewer brief inline instead of a script |
| `reference/after-run.md` | `reference/after-run.md` | shared logic; Codex has no resume cache - its copy says so and re-runs branches surgically instead |
| `templates/workflow-plan.md` | `templates/codex-workflow-plan.md` | counterparts, structure should track (both carry Scale & Budget) |
| `templates/linear-plan.md` | `templates/linear-plan.md` | shared rules (self-review items, quality bar, assumptions note); verdict phrasing and tool names differ per runtime |
| `templates/workflow-script.js` | — | Claude-only (Codex has no JS runtime) |
| `templates/review-prompt.js` | — | Claude-only (the Codex reviewer brief lives inside its `reference/review-workflow.md`) |
| `examples.md` | `examples.md` | shared idea; artifacts differ per runtime (scripts vs plan shapes) |
| `tests/prompt-helper/*` | `tests/prompt-helper/*` | shared; fixture DATA (sources, counts) must match. Accepted runtime difference: Claude inputs start with an explicit `/workflow-planner` call (other installed skills hijack description-matching; headless may not auto-activate) - Codex inputs stay bare, its runbook drives activation itself |
| `tests/gate/*` | `tests/gate/*` | shared logic; script/validator claims reworded per runtime (G9 tests the Run Protocol instead) |
| `tools/validate-workflow.js` | — | Claude-only (validates the JS runtime) |
| `tools/lint-plan.js` | `tools/lint-plan.js` | shared tool, byte-identical copy shipped inside the plugin (decision 2026-07-02: repo is public, the plugin must be self-contained); drift is caught by `check-parity.js` mode 'identical' - edit the root copy, then re-copy |
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

(Empty. The lint-plan.js deferral was closed the same day it was opened - 2026-07-02, the
user decided the packaging question: the plugin ships its own byte-identical copy of the
tool, synced via check-parity 'identical' mode. The 2026-07-01 batch - review-workflow,
after-run, planner examples, gate fixtures,
Scale & Budget, runbook automation section - was ported the same day. When you defer a new
mirror, add it here with a date.)

- **2026-07-01, watch item (not a mirror):** `tools/run-fixtures.js --cmd "codex exec"` is
  untested - confirm `codex exec` reads the prompt from stdin before trusting an automated
  Codex suite run; if it does not, the Codex suites stay manual (noted in both runbooks).
