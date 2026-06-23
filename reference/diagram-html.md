# Workflow diagram - self-contained HTML

How to render a workflow plan as a **graphical** diagram in a single, self-contained
HTML file (no internet, no CDN, no external CSS/JS/fonts). Opens in any browser.

## When to produce it

- **On request only**, and **only for workflow plans** (linear plans are a step list -
  a diagram adds nothing). After showing a workflow plan, you may offer it in one line:
  "Need an HTML diagram of the structure?" - do not generate it unasked.
- The diagram is a **view of the plan**, not a new design. It must match the plan's
  branch map exactly: same phases, same branches, same dependencies, same loops.
  Do not invent structure that is not in the plan.

## Output file

- `PLAN.diagram.html` next to `PLAN.md` (if the plan was written as `PLAN.<task>.md`,
  use `PLAN.<task>.diagram.html`). Into the current project only - never the home or
  skill folder. If the file exists, do not overwrite silently (same rule as `PLAN.md`).

## What it shows (plan element -> HTML)

| In the plan | In the diagram |
|---|---|
| A phase | a titled card (`.phase`), stacked top-to-bottom |
| Flow from one phase to the next | a centered down-arrow (`.arrow-down`, the char ↓) |
| Parallel branches (one phase, `parallel`/`pipeline`) | nodes side by side in a `.lane`, tagged `∥ parallel (barrier)` or `→ pipeline (flow)` |
| Pipeline stages within a flow | nodes joined by `→` (`.arrow-r`) |
| A branch / agent / stage | a `.node` box |
| The anchor (phase 0) | `.node--anchor` (accent) |
| The assembly / synthesis branch | `.node--assemble` (accent) |
| A check / verify / gate | a `.verify` pill |
| A loop (verify->retry, loop-until-dry, retry-until-pass) | a `.loop` block: the body row + a CSS back-connector + a label with the **stop condition** |
| Wide fan-out (4+ same-type branches) | collapse to one `.node--collapsed` box: `×N role` |

**Loops are the point.** Every loop must show, on the back-edge label, the **stop
condition** (verify ok / K empty rounds / iteration cap / budget). A loop with no
visible stop is the diagram telling you the plan forgot its stop-condition - fix the
plan, do not draw an open loop.

## Layout rules (keep it readable)

- One vertical column of phases. Inside a phase, one horizontal `.lane`.
- Collapse any fan-out of 4+ interchangeable branches to a single `×N` box. Never draw
  8 identical boxes.
- Loops use the pure-CSS U-connector below (no coordinate math). For a genuinely complex
  edge you may drop in a small inline `<svg>`, but prefer the CSS connector.
- All node/label text is in the **language of the task** (the example below is Russian
  to illustrate; match whatever the plan is written in).

## Generation checklist

1. Self-contained: one `.html` file, everything inline. No `http(s)://`, no external
   `src`/`href`, no web fonts (use a system font stack). Open offline = it must render.
2. Matches the branch map: every phase/branch/loop in the plan is in the diagram, and
   nothing extra.
3. Every loop's exit edge is labeled with its stop condition.
4. Wide fan-outs collapsed to `×N`.
5. Labels in the task's language.

## Template (clone this, fill in, delete unused parts)

This example renders: an anchor phase -> a parallel fan-out (collapsed) -> an assembly
phase that has a verify->retry **loop** with a stop condition. It is valid, offline,
self-contained. Adapt the nodes/labels to the actual plan.

```html
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Схема воркфлоу</title>
<style>
  :root{
    --bg:#f6f7f9; --card:#fff; --ink:#1f2933; --muted:#6b7280; --line:#9aa5b1;
    --anchor:#2563eb; --assemble:#7c3aed; --verify:#d97706; --loop:#c0392b;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  .wf{max-width:860px;margin:32px auto;padding:0 16px}
  .wf h1{font-size:18px;margin:0 0 2px}
  .wf .sub{color:var(--muted);margin:0 0 22px;font-size:13px}
  .phase{background:var(--card);border:1px solid #e5e7eb;border-radius:12px;
    padding:14px 16px}
  .phase-title{font-size:11px;letter-spacing:.06em;text-transform:uppercase;
    color:var(--muted);margin-bottom:10px}
  .lane{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center}
  .tag{font-size:11px;color:var(--muted);text-align:center;margin-bottom:8px}
  .node{background:#fff;border:1.5px solid var(--line);border-radius:10px;
    padding:8px 12px;min-width:100px;text-align:center}
  .node small{display:block;font-size:11px;color:var(--muted)}
  .node--anchor{border-color:var(--anchor);box-shadow:inset 0 0 0 2px #dbeafe}
  .node--assemble{border-color:var(--assemble);box-shadow:inset 0 0 0 2px #ede9fe}
  .node--collapsed{border-style:dashed;color:var(--muted)}
  .verify{background:#fffbeb;border:1.5px solid var(--verify);border-radius:999px;
    padding:8px 14px;color:#92400e;white-space:nowrap}
  .arrow-down{text-align:center;color:var(--line);font-size:22px;line-height:1;margin:6px 0}
  .arrow-r{color:var(--line);font-size:18px}
  /* loop: pure-CSS U-connector under the row, no coordinate math */
  .loop{position:relative}
  .loop-edge{height:26px;margin:2px 56px 0;border:2px dashed var(--loop);
    border-top:none;border-radius:0 0 12px 12px;position:relative}
  .loop-edge::before{content:"";position:absolute;left:-7px;top:-1px;
    border:5px solid transparent;border-bottom-color:var(--loop);border-top:none}
  .loop-label{text-align:center;font-size:11px;color:var(--loop);font-weight:600;margin-top:5px}
</style>
</head>
<body>
<div class="wf">
  <h1>Схема воркфлоу: миграция 4 таблиц</h1>
  <p class="sub">Вид плана PLAN.md — структура и петли. Это не сам прогон.</p>

  <div class="phase">
    <div class="phase-title">Фаза 0 — якорь</div>
    <div class="lane">
      <div class="node node--anchor">Якорь: целевая схема + порядок FK<small>фиксирует общий источник истины</small></div>
    </div>
  </div>

  <div class="arrow-down">↓</div>

  <div class="phase">
    <div class="phase-title">Фаза 1 — подготовка по таблицам</div>
    <div class="tag">∥ параллельно (барьер) — сборке нужны все результаты</div>
    <div class="lane">
      <div class="node">A: users</div>
      <div class="node">B: products</div>
      <div class="node node--collapsed">×N: подготовка таблицы</div>
      <div class="node">D: payments</div>
    </div>
  </div>

  <div class="arrow-down">↓</div>

  <div class="phase">
    <div class="phase-title">Фаза 2 — сборка с проверкой</div>
    <div class="loop">
      <div class="lane">
        <div class="node node--assemble">Сборка прогона</div>
        <span class="arrow-r">→</span>
        <div class="verify">{ verify: целостность ok? }</div>
      </div>
      <div class="loop-edge"></div>
      <div class="loop-label">нет → повтор · стоп: максимум 3 попытки</div>
    </div>
  </div>

  <div class="arrow-down">↓ ok</div>

  <div class="phase">
    <div class="phase-title">Результат</div>
    <div class="lane"><div class="node">Готовый упорядоченный прогон + отчёт целостности</div></div>
  </div>
</div>
</body>
</html>
```

## Loop-until-dry variant

When a phase repeats until nothing new is found, render the verify as the question and
label both edges - the back-edge with "new found -> repeat" and the exit with the stop:

```html
<div class="loop">
  <div class="lane">
    <div class="node">Раунд поиска (finders)</div>
    <span class="arrow-r">→</span>
    <div class="verify">{ нашли новое? }</div>
  </div>
  <div class="loop-edge"></div>
  <div class="loop-label">да → ещё раунд · стоп: K пустых раундов подряд ИЛИ бюджет</div>
</div>
```
