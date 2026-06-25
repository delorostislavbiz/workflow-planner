# Codex Workflow Runtime

Codex does not use Claude Dynamic Workflow JS scripts. A Codex workflow is run by the main agent with subagent tools and careful prompts.

## Core Model

- The **main agent** owns scope, assumptions, phase boundaries, risk decisions, approvals, integration, and final verification.
- **Subagents** do bounded work in isolated threads and return distilled results, artifact paths, exact references, or changed file lists.
- Subagents are **flat leaf workers** by default. Do not ask them to spawn more subagents.
- If recursive delegation is explicitly configured with `agents.max_depth > 1`, treat it as an advanced user environment feature, not a dependency of this skill.

## Practical Limits

- Prefer 2-6 subagents.
- Use more only when the task naturally splits into many independent same-type units and the user accepts the cost.
- For write-heavy work, split by disjoint file sets. Never let two agents own the same file family.
- Keep the immediate critical-path blocker in the main thread.
- Subagents inherit current sandbox and approval constraints unless a custom agent config overrides them.

## Recommended Branch Types

- `research`: source finding, claim checking, synthesis criticism.
- `code-audit`: architecture mapping, bug hunting, test-gap review, security review.
- `migration`: current-state mapping, target-docs research, risk planning, implementation slicing.
- `test-sweep`: focused tests, broader smoke checks, failure triage.
- `implementation-slices`: bounded edits in disjoint write sets.

## Subagent Prompt Shape

Use this shape for every spawned branch:

```text
Role: <role-name>
Goal: <one bounded task>
Scope: <files/topics/sources to inspect>
Out of scope: <what not to touch>
Inputs: <exact facts, source-of-truth text, previous branch outputs>
Constraints: <language, sandbox, edit policy, web policy, user limits>
Evidence rules: <artifact path/source reference required; UNKNOWN is allowed>
Return format:
- Findings:
- Evidence:
- Artifact path or exact source references:
- Risks:
- Recommended next action:
Stop when: <clear condition>
```

## Acceptance Rules

- Accept artifacts, source references, command outputs, screenshots, logs, diffs, or changed-file lists. Do not accept a vague summary as enough.
- Use deterministic checks when possible: tests, linters, type checks, counts, schemas, grep targets, screenshots, status codes, or source-link spot checks.
- If one branch fails, mark it explicitly. Continue only if the final answer can preserve that uncertainty.
- Close completed subagents after their results are integrated.

## Run Protocol

Before spawning:

1. Restate the approved plan.
2. Name the branches being launched.
3. Confirm whether the workflow is read-only or edit-capable.
4. Identify any files or directories each branch owns.

While running:

- Continue useful main-thread work that does not duplicate the agents.
- Give short progress updates.
- Do not busy-wait unless blocked on a result.

After running:

1. Inspect branch outputs.
2. Run final checks.
3. Synthesize findings or integrate changes.
4. Report branches used, checks run, failures, and residual risk.
