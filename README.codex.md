# Workflow Planner for Codex

This repository keeps the original Claude Code skill intact and adds a separate Codex plugin beside it.

## Which Version Should Users Install?

- **Claude Code users** install the root folder as the existing Claude skill.
- **Codex users** install the Codex plugin from `plugins/workflow-planner-codex/`.

They are separate runtime packages in one GitHub repository. A Codex user does not need to install the Claude skill, and a Claude user does not need the Codex plugin. File-level parity between the two copies is tracked in `PARITY.md` (advisory check: `node tools/check-parity.js`).

## What the Codex Version Does

The Codex skill keeps the same planning logic:

1. Decide whether the task is linear or genuinely benefits from parallel agents.
2. Write a linear `PLAN.md` when subagents would add overhead.
3. Write a Codex multi-agent workflow plan when the task has independent branches, high-volume flow, or useful parallel verification.

The Codex version does **not** generate `.claude/workflows/*.js` files. Codex has no Claude Dynamic Workflow JS runtime. Instead, after explicit approval, the main Codex agent runs a flat subagent workflow directly.

## Multiagent Runtime

The Codex plugin includes the multiagent workflow discipline inside the skill:

- flat subagents by default;
- main thread owns scope, integration, and verification;
- subagents return artifacts, evidence, file paths, or exact references;
- deterministic checks are preferred over self-report;
- recursive subagents are not required.

This means users should not need to install a separate `multiagent-workflow` plugin just to use workflow-planner in Codex.

## Install From This Repository

For a local checkout, add this repository as a marketplace root:

```powershell
codex plugin marketplace add D:\AI-PROJECTS\workflow-planner
```

Then open Codex plugins and install **Workflow Planner for Codex**.

For a GitHub-hosted repository, users add the repository as a marketplace source, then install `workflow-planner-codex` from that marketplace.

## Repository Layout

```text
workflow-planner/
|-- SKILL.md                                  # original Claude skill
|-- reference/                                # original Claude references
|-- templates/                                # original Claude templates
|-- .agents/plugins/marketplace.json          # Codex marketplace entry
|-- plugins/workflow-planner-codex/
|   |-- .codex-plugin/plugin.json             # Codex plugin manifest
|   `-- skills/workflow-planner/
|       |-- SKILL.md                          # Codex skill
|       |-- reference/                        # Codex runtime references
|       `-- templates/                        # Codex plan templates
`-- README.codex.md
```

## Compatibility Rule

Do not edit the root Claude skill when changing Codex behavior. Codex-specific behavior belongs under `plugins/workflow-planner-codex/`.
