# workflow-planner

[🇬🇧 English](README.md) · **🇩🇪 Deutsch**

Ein Skill für Claude Code, der eine Aufgabe in den richtigen atomaren Plan verwandelt. Er entscheidet zuerst, ob die Aufgabe eine parallele Orchestrierung braucht (einen Dynamic Workflow über das Workflow-Tool) oder einen einfachen linearen Plan, und schreibt das passende Artefakt.

## Wozu

Nicht jede Aufgabe gehört in einen Workflow. Eine lineare Kette von Schritten gewinnt nichts durch Parallelität, während ein Hintergrundlauf mit Dutzenden Agenten nur Overhead bringt. Und umgekehrt: Eine Aufgabe aus Dutzenden unabhängigen Teilen sequenziell abzuarbeiten ist Verschwendung. Dieser Skill nimmt dir die Entscheidung ab: Er ordnet die Aufgabe ein und schreibt einen Plan für den richtigen Modus.

## Was er macht

1. **Eignungs-Gate (hybrid).** Bewertet die Aufgabe anhand einer Checkliste. Ist die Antwort eindeutig, gibt er ein Urteil mit Begründung. Ist sie grenzwertig, stellt er 1–2 klärende Fragen.
2. **Passt nicht** – schreibt einen linearen `PLAN.md` im Format „Schritt → Prüfung".
3. **Passt** – schreibt einen atomaren Plan mit Zweigen, Rollen und Parallelität und erzeugt nach deiner Freigabe ein lauffähiges JS-Skript für das Workflow-Tool.

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
|   |-- workflow-primitives.md    # Workflow-Tool: Primitive, Grenzen, häufige Fehler
|   |-- plan-to-script.md         # wie aus einem Plan ein JS-Skript wird
|   `-- diagram-html.md           # optionales kundenfreundliches HTML-Diagramm eines Workflows
|-- templates/
|   |-- workflow-plan.md          # Vorlage für den Workflow-Plan
|   |-- workflow-script.js        # Vorlage für das JS-Skript
|   `-- linear-plan.md            # Vorlage für den linearen Plan
|-- examples.md                   # zwei ausgearbeitete Beispiele
|-- README.md                     # Englisch
|-- README.de.md                  # Deutsch
`-- LICENSE
```

## Voraussetzungen

- Claude Code mit Unterstützung für Agent Skills und Dynamic Workflows (das Workflow-Tool).
- Für `isolation:'worktree'` (wenn Zweige parallel in dieselben Dateien schreiben) – ein Git-Repository.

## Lizenz

MIT. Siehe `LICENSE`.
