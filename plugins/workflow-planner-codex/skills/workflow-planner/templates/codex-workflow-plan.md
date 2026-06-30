# Plan: <task name>

Mode: **Codex multi-agent workflow**
Gate verdict: fits - <which criteria: independent chunks / high-volume flow / parallel verification / read-heavy exploration>
Runtime: flat Codex subagents orchestrated by the main agent; no Claude Workflow JS script.

> Fill in the angle brackets. Remove these notes before delivering the plan.
> Before writing to `PLAN.md`, check whether it already exists. Do not overwrite it silently.

## Assumptions

- <what is taken as given about the task - environment, inputs, scope>
- <assumption 2>

## Acceptance Contract
- **Goal (one measurable line):** <what + threshold>
- **Done when (observable predicates):**
  - [ ] <checkable predicate>
  - [ ] <checkable predicate>
- **Hard constraints:** <budget / must-haves / deadline>
- **Durability:** <how we confirm it holds, not a one-off>
- **Independent check (out-of-sample):** <who/what, not involved in building>
- **Stop condition:** <met when… ; raise the bar as attempts grow>

What "done" means, fixed before the branches and frozen at plan approval. For trivial tasks this may be a single `Done when:` line. The Verify Strategy below checks the final result against this contract.

## Branch Map

| Branch | Role | Depends on | Parallel with | Input passed into prompt | Output |
|--------|------|------------|---------------|--------------------------|--------|
| A | <role> | - | B | <files/source facts/user constraints> | <artifact/result> |
| B | <role> | - | A | <files/source facts/user constraints> | <artifact/result> |
| C | <role> | A, B | - | outputs of A and B | <final synthesis/check> |

## Phases

### Phase 0: <source-of-truth / setup, if needed>

Run by: <main agent or one subagent>

- atom 0.1 -> verify: <concrete check>
- Phase output: <exact text/data/artifact passed to later branches>

### Phase 1: <parallel work>

Run by: flat Codex subagents. Do not ask subagents to spawn other subagents.

#### Branch A - <role>

- Scope: <files/topics/items>
- Out of scope: <what not to touch>
- atom A.1 -> verify: <command/test/source check>
- atom A.2 -> verify: <...>
- Branch output: <exact return format/artifact>

#### Branch B - <role>

- Scope: <files/topics/items>
- Out of scope: <what not to touch>
- atom B.1 -> verify: <...>
- Branch output: <...>

### Phase 2: <integration / verification>

Run by: <main agent or final verifier subagent>

- input: <outputs of required branches, pasted into prompt if a subagent runs this>
- atom C.1 -> verify: <final check>
- Final output: <what the user receives>

## Subagent Prompt Briefs

### Prompt A

```text
Role: <role>
Goal: <bounded task>
Scope: <scope>
Out of scope: <out of scope>
Inputs: <facts and source-of-truth text>
Constraints: <language, paths, edit policy, web policy, approvals>
Evidence rules: <required artifact/source/check>
Return format:
- Findings:
- Evidence:
- Artifact path or exact source references:
- Risks:
- Recommended next action:
Stop when: <stop condition>
```

### Prompt B

```text
<same shape>
```

## Verify Strategy

- Deterministic checks: <tests/linters/build/source checks>
- Independent checks: <separate verifier branch or main-thread review>
- Contract as rubric: paste the Acceptance Contract text into the verifier subagent's prompt as its rubric, so verify checks the task-level contract, not just a branch's output.
- Final post-verify: check the final result against every predicate in the Acceptance Contract, and run the contract's independent (out-of-sample) check here - a verify the generating agents did not make themselves. Pass only if all predicates hold AND the independent check confirms them.
- Language check: plan, branch roles, and prompts match the user's language.

## Run Checkpoint

This plan does not run anything by itself. After the user explicitly approves running it, the main Codex agent spawns the listed flat subagents, waits for required results, verifies artifacts, and synthesizes the final output.
