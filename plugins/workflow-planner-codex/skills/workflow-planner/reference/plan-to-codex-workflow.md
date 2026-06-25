# From Plan to Codex Subagents

Translate the atomic plan into a flat Codex subagent workflow.

## Main Principle

Parallelism is decided by dependencies, not by role names.

- Independent branches can run at the same time.
- A branch that needs another branch's output runs later.
- A shared source of truth is created first and pasted into every dependent branch prompt.

Do not confuse roles with parallelism. "Researcher -> writer" is a sequence. "Three reviewers inspect three independent areas" is parallelism.

## Branch Size

A branch is a coherent bundle of atoms by ownership or role. Do not create one agent per tiny step. Do not create one huge branch that hides unrelated work.

Good branch examples:

- Review auth and permission boundaries.
- Inspect checkout state management.
- Update documentation pages A-C.
- Run focused tests and triage failures.

Bad branch examples:

- "Fix everything."
- "Read the whole repo and tell me thoughts."
- "Spawn more agents for your part."

## Mapping Plan to Execution

| Plan shape | Codex execution |
|---|---|
| Independent named branches | Spawn one subagent per branch, wait for all needed outputs |
| Many same-type items | Batch items into 2-6 subagents by chunk, or more only if the user accepts cost |
| Source-of-truth anchor | Main thread or one branch produces the source, then all dependent prompts include it |
| Dependent branch | Run after the required output exists; paste that output into the prompt |
| Final assembly | Main thread synthesizes, or one final subagent drafts and main thread verifies |
| Verification | Deterministic checks first; separate verifier branch only when useful |

## Data Passing

Subagents do not share memory with each other. Every dependent branch must receive its inputs in its prompt:

- source facts;
- previous branch output;
- file paths;
- acceptance criteria;
- user constraints;
- required return format.

Before running, check every dependent branch: if the input is not in the prompt, the branch will not have it.

## Verification Strategy

Use one of these:

1. **Built-in branch verify:** the branch runs a specific command or check before returning.
2. **Separate verifier branch:** a different subagent checks important or expensive output.
3. **Main-thread post-verify:** the main agent runs deterministic checks and reviews artifacts after all branches finish.

Prefer a check the creator did not produce. A test, linter, type check, build, schema check, or source spot-check is stronger than self-report.

## Write Isolation

For edits:

- Assign disjoint file ownership before spawning.
- Tell every worker it is not alone in the codebase and must not revert unrelated edits.
- If two branches need the same file, sequence them or keep that work in the main thread.
- Use Git worktrees only when the environment supports them and the user accepts the overhead.

## Failure Handling

- For interchangeable results, continue with successful branches only if the final output can state the missing coverage.
- For named required branches, do not silently continue. Stop or ask for a decision if a required branch fails.
- Never paste missing, null, or unknown branch output into a dependent prompt as if it were valid.

## Self-Check Before Running

- Does every branch have a bounded role and stop condition?
- Are write scopes disjoint?
- Is every dependent input explicitly included in the prompt?
- Are user constraints copied into every prompt?
- Is recursive delegation avoided?
- Is there a final deterministic check or a clear reason none exists?
