# workflow-planner

[🇬🇧 English](README.md) · **🇩🇪 Deutsch**

Ein Skill für Claude Code, der eine Aufgabe in den richtigen atomaren Plan verwandelt. Er entscheidet zuerst, ob die Aufgabe eine parallele Orchestrierung braucht (einen Dynamic Workflow über das Workflow-Tool) oder einen einfachen linearen Plan, und schreibt das passende Artefakt.

## Wozu

Nicht jede Aufgabe gehört in einen Workflow. Eine lineare Kette von Schritten gewinnt nichts durch Parallelität, während ein Hintergrundlauf mit Dutzenden Agenten nur Overhead bringt. Und umgekehrt: Eine Aufgabe aus Dutzenden unabhängigen Teilen sequenziell abzuarbeiten ist Verschwendung. Dieser Skill nimmt dir die Entscheidung ab: Er ordnet die Aufgabe ein und schreibt einen Plan für den richtigen Modus.

## Was er macht

1. **Eignungs-Gate (hybrid).** Bewertet die Aufgabe anhand einer Checkliste. Ist die Antwort eindeutig, gibt er ein Urteil mit Begründung. Ist sie grenzwertig, stellt er 1–2 klärende Fragen.
2. **Passt nicht** – schreibt einen linearen `PLAN.md` im Format „Schritt → Prüfung".
3. **Passt** – schreibt einen atomaren Plan mit Zweigen, Rollen, Parallelität und einer Umfangs-/Budget-Schätzung und erzeugt nach deiner Freigabe ein lauffähiges JS-Skript für das Workflow-Tool – anschließend wird das Skript mechanisch geprüft (`tools/validate-workflow.js` fängt erfundene Primitive und Resume-Brecher ab).
4. **Prompt-Helfer.** Verwandelt eine vage Idee oder einen groben Entwurf in einen korrekten Workflow-Prompt: zuerst das Gate, dann ein Rezept (8 Muster) oder ein Interview, dann eine optionale Lückenprüfung – inline oder als tiefe Multi-Agenten-Prüfung für riskante Prompts (separate, ausdrückliche Zustimmung).
5. **Nach dem Lauf.** Hilft, das Ergebnis gegen den Abnahme-Vertrag zu lesen, gescheiterte Zweige per Resume fortzusetzen statt alles neu zu bezahlen, und ein Einmal-Skript über `args` wiederverwendbar zu machen.

## Installation

Kopiere den Ordner `workflow-planner/` in dein Skills-Verzeichnis:

- macOS / Linux: `~/.claude/skills/workflow-planner/`
- Windows: `%USERPROFILE%\.claude\skills\workflow-planner\`

Prüfe, dass er sichtbar ist: `/skills` sollte `workflow-planner` auflisten.

## Verwendung

```
/workflow-planner prüfe 30 Blog-Seiten auf kaputte Links und stelle einen Bericht zusammen
```

Oder beschreibe einfach eine Aufgabe – der Skill aktiviert sich aus der Beschreibung. Danach:

1. Der Skill gibt ein Urteil (passt in einen Workflow oder nicht).
2. Er zeigt den Plan.
3. Nach der Freigabe legt er die Artefakte im **aktuellen Projekt** ab:
   - `PLAN.md` im Stammverzeichnis;
   - `.claude/workflows/<name>.js` (im Workflow-Modus).
4. Das Ausführen des Workflows ist ein eigener Schritt und deine ausdrückliche Entscheidung. Der Skill führt nie etwas von selbst aus.

Hinweis: Die Artefakte (Plan, Diagramm, Agenten-Prompts) entstehen in der **Sprache deiner Aufgabe** – schreibst du die Aufgabe auf Deutsch, ist der Plan auf Deutsch. Die internen Anweisungen des Skills sind auf Englisch; das liest das Modell, und es betrifft die Ausgabe nicht.

## Abgrenzung zu anderen Skills

- **agent-constructor** baut wiederverwendbare Subagenten-Rollen (`.claude/agents/*.md`) und deren Koordination über ein README. workflow-planner kümmert sich um die einmalige Orchestrierung einer konkreten Aufgabe und um Pläne. Sie ergänzen sich: Gibt es bereits Rollen, kann das Skript sie über `opts.agentType` ansprechen. (Echte verschachtelte Subagenten gehören zu agent-constructor, nicht in einen Workflow.)

## Struktur

```
workflow-planner/
|-- SKILL.md                      # Orchestrierung: Gate + Ablauf + Navigation
|-- reference/
|   |-- applicability.md          # Kriterien „passt / passt nicht"
|   |-- acceptance-contract.md    # was „fertig" heißt, fixiert vor der Planung
|   |-- prompt-helper.md          # von der Idee/dem Entwurf zum korrekten Workflow-Prompt
|   |-- prompt-patterns.md        # 8 Workflow-Rezepte
|   |-- workflow-primitives.md    # Workflow-Tool: Primitive, Grenzen, Fakten-Register
|   |-- plan-to-script.md         # wie aus einem Plan ein JS-Skript wird
|   |-- review-workflow.md        # tiefe Multi-Agenten-Prüfung eines Prompts (Opt-in)
|   |-- after-run.md              # Ergebnisse lesen, Resume, Umplanen, Wiederverwenden
|   `-- diagram-html.md           # optionales kundenfreundliches HTML-Diagramm eines Workflows
|-- templates/
|   |-- workflow-plan.md          # Vorlage für den Workflow-Plan (inkl. Umfang & Budget)
|   |-- workflow-script.js        # Vorlage für das JS-Skript
|   |-- review-prompt.js          # fertiges Review-Workflow-Skript
|   `-- linear-plan.md            # Vorlage für den linearen Plan
|-- tools/
|   |-- validate-workflow.js      # mechanischer Validator für Workflow-Skripte
|   |-- run-fixtures.js           # Headless-Testrunner (experimentell)
|   `-- check-parity.js           # Drift-Prüfung gegen die Codex-Kopie
|-- tests/
|   |-- gate/                     # Fixtures für Gate & Planer
|   `-- prompt-helper/            # Fixtures + Runbook für den Prompt-Helfer
|-- examples.md                   # vier ausgearbeitete Beispiele + Prompt-Helfer-Läufe
|-- plugins/workflow-planner-codex/  # die Codex-Kopie (siehe PARITY.md)
|-- PARITY.md                     # Paritäts-Checkliste zwischen den beiden Kopien
|-- README.md                     # Englisch
|-- README.de.md                  # Deutsch
`-- LICENSE
```

## Voraussetzungen

- Claude Code mit Unterstützung für Agent Skills und Dynamic Workflows (das Workflow-Tool).
- Für `isolation:'worktree'` (wenn Zweige parallel in dieselben Dateien schreiben) – ein Git-Repository.
- Für die Skripte in `tools/` (Skript-Validator, Testrunner, Paritätsprüfung) – Node.js ≥ 18. Der Skill selbst funktioniert auch ohne sie; es entfallen nur die mechanischen Prüfungen.

## Lizenz

MIT. Siehe `LICENSE`.
