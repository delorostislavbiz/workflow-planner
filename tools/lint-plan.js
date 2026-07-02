#!/usr/bin/env node
// Mechanical linter for generated plans (PLAN.md / PLAN.<task>.md).
// Complements the model's plan self-review in the templates: everything here
// is checked deterministically, by text analysis - no model judgment.
//
// Usage:  node lint-plan.js <PLAN.md> [more.md ...]
// Exit:   0 = no errors (warnings allowed), 1 = at least one error.
//
// Checks are heuristic and language-tolerant (plans are written in the task's
// language; headings come from the templates). A PASS does not prove the plan
// good - it proves it free of the mechanical defects this tool knows about:
// missing contract/predicates, steps without verify, count-only verify,
// ritual steps around trivial edits, blind dependent branches, missing budget.

'use strict';

const fs = require('fs');

// --- helpers -----------------------------------------------------------------

const RX = {
  contractHead: /^#{2,3}\s.*(acceptance contract|контракт|abnahme|vertrag)/i,
  anyHead: /^#{2,3}\s/,
  predicate: /^\s*-\s*\[[ x]\]/i,
  doneWhenLine: /(done when|готово, когда|готово когда|fertig, wenn)/i,
  step: /^\s*(?:\d+[.)]|N\s*\(final\))\s+/,
  verify: /(->|→|=>)?\s*verify\s*:|\bverify\b\s*(->|→|:)/i,
  manualOnly: /(check manually|проверить вручную|вручную проверить|manuell prüfen)/i,
  countWords: /(количеств|числ[оа]|счёт|счет|\bcount\b|number of|кол-во|штук)/i,
  contentSignals: /(grep|содерж|content|предикат|predicate|test|тест|сравн|diff|выборк|sample|спот-чек|spot-check|каждо[йм]|each|скептик|skeptic|независим|independent)/i,
  existenceStep: /(убедиться|проверить|check|verify|ensure),?\s+(что|that)?\s*.*(существует|есть на месте|file exists|exists)|test-path/i,
  contractCheckStep: /(сверк|сверить|verify|check).{0,40}(контракт|acceptance contract)/i,
  workflowMode: /mode:\s*\*{0,2}\s*dynamic workflow/i,
  branchMapHead: /^#{2,3}\s.*(branch map|карта веток|карта ветвей)/i,
  scaleHead: /^#{2,3}\s.*(scale\s*&\s*budget|scale and budget|масштаб и бюджет|бюджет)/i,
  budgetCut: /(runs? short|не хват|нехватк|сокращ|урез|degrade|cut first|реж[ею]м|режется|кончает|кончит)/i,
  assumptionsHead: /^#{2,3}\s.*(assumptions|допущени|annahmen)/i,
  tableRow: /^\s*\|(.+)\|\s*$/,
  tableRule: /^\s*\|[\s:|-]+\|\s*$/,
};

function findings() {
  const list = [];
  return {
    list,
    error(line, msg) { list.push({ sev: 'ERROR', line, msg }); },
    warn(line, msg) { list.push({ sev: 'WARN', line, msg }); },
  };
}

// Collect step blocks: a step line + its continuation lines (until the next
// step line, heading, or blank-line-then-non-list). Line numbers are 1-based.
function collectSteps(lines, from, to) {
  const steps = [];
  for (let i = from; i < to; i++) {
    if (!RX.step.test(lines[i])) continue;
    let end = i + 1;
    while (end < to && !RX.step.test(lines[end]) && !RX.anyHead.test(lines[end])) end++;
    steps.push({ line: i + 1, text: lines.slice(i, end).join('\n') });
    i = end - 1;
  }
  return steps;
}

// --- main lint ----------------------------------------------------------------

function lintPlan(path) {
  const src = fs.readFileSync(path, 'utf8');
  const lines = src.split(/\r?\n/);
  const f = findings();

  const isWorkflow = RX.workflowMode.test(src) || lines.some((l) => RX.branchMapHead.test(l));

  // 1. Acceptance Contract: section present, with >=1 checkable predicate
  //    (a checkbox) or a one-line "Done when:" (the trivial form).
  const contractIdx = lines.findIndex((l) => RX.contractHead.test(l));
  if (contractIdx === -1) {
    f.error(1, 'no Acceptance Contract section (looked for "Acceptance Contract" / "Контракт" in headings)');
  } else {
    let end = lines.findIndex((l, i) => i > contractIdx && RX.anyHead.test(l));
    if (end === -1) end = lines.length;
    const body = lines.slice(contractIdx + 1, end);
    const hasPredicate = body.some((l) => RX.predicate.test(l));
    const hasDoneWhen = body.some((l) => RX.doneWhenLine.test(l));
    if (!hasPredicate && !hasDoneWhen) {
      f.error(contractIdx + 1, 'contract has no checkable predicate (no "- [ ]" checkbox and no "Done when:" line)');
    }
  }

  // 2. Assumptions section (both templates carry it).
  if (!lines.some((l) => RX.assumptionsHead.test(l))) {
    f.warn(1, 'no Assumptions section - if truly nothing is assumed, say so in one line');
  }

  // 3. Steps / atoms: every step block needs a verify; verify quality checks.
  //    For workflow plans, atom lines ("- atom X -> verify:") live under phases
  //    and are matched by the same verify regex per block below.
  const steps = collectSteps(lines, 0, lines.length);
  const stepCount = steps.length;
  let contractCheckStepAt = null;
  for (const s of steps) {
    if (!RX.verify.test(s.text)) {
      f.error(s.line, 'step has no "-> verify:" (every step carries its own concrete check)');
      continue;
    }
    if (RX.manualOnly.test(s.text) && !RX.contentSignals.test(s.text)) {
      f.warn(s.line, 'verify is only "check manually" - name exactly what to run or see');
    }
    if (RX.countWords.test(s.text) && !RX.contentSignals.test(s.text)) {
      f.warn(s.line, 'verify looks count-only - a count hides broken items; check content on a sample too');
    }
    if (RX.existenceStep.test(s.text.split('\n')[0]) && stepCount > 1) {
      f.warn(s.line, 'file-existence as its own step - fold it into the verify of the step that uses the file');
    }
    if (RX.contractCheckStep.test(s.text.split('\n')[0])) contractCheckStepAt = s.line;
  }
  if (stepCount === 0 && !isWorkflow) {
    f.error(1, 'no numbered steps found (expected "1. <step> -> verify: <check>")');
  }
  // Trivial-size hint: a small plan with a separate contract-check step should
  // fold it into the last real step's verify (SKILL.md "1-3 steps" rule).
  if (contractCheckStepAt !== null && stepCount <= 4 && !isWorkflow) {
    f.warn(contractCheckStepAt, `plan has only ${stepCount} steps but keeps a separate contract-check step - if the task is trivial, fold it into the last step's verify (target: 1-3 steps)`);
  }

  // 4. Workflow-plan specifics: branch map Input column, Scale & budget.
  if (isWorkflow) {
    const mapIdx = lines.findIndex((l) => RX.branchMapHead.test(l));
    if (mapIdx === -1) {
      f.error(1, 'workflow plan without a Branch map section');
    } else {
      // Parse the first table after the heading. Columns are matched by header
      // names, not positions, so reordered tables still lint.
      let i = mapIdx + 1;
      while (i < lines.length && !RX.tableRow.test(lines[i])) i++;
      if (i >= lines.length) {
        f.error(mapIdx + 1, 'Branch map heading without a table');
      } else {
        const header = lines[i].split('|').map((c) => c.trim().toLowerCase());
        const inputCol = header.findIndex((c) => /input|вход/.test(c));
        const depCol = header.findIndex((c) => /depends|зависит/.test(c));
        const branchCol = header.findIndex((c) => /branch|ветка|ветвь/.test(c));
        for (let r = i + 1; r < lines.length && RX.tableRow.test(lines[r]); r++) {
          if (RX.tableRule.test(lines[r])) continue;
          const cells = lines[r].split('|').map((c) => c.trim());
          const dep = depCol !== -1 ? cells[depCol] : '';
          const input = inputCol !== -1 ? cells[inputCol] : '';
          const name = branchCol !== -1 ? cells[branchCol] : `row ${r + 1}`;
          if (depCol !== -1 && inputCol !== -1 && dep && dep !== '-' && (!input || input === '-')) {
            f.warn(r + 1, `branch ${name} depends on ${dep} but its Input column is empty - a dependent agent is blind without explicit input`);
          }
        }
        if (inputCol === -1) f.warn(i + 1, 'Branch map has no Input column - each agent prompt must name its data');
      }
    }
    const scaleIdx = lines.findIndex((l) => RX.scaleHead.test(l));
    if (scaleIdx === -1) {
      f.error(1, 'workflow plan without a Scale & budget section (the user must see the size before approving)');
    } else if (!RX.budgetCut.test(src)) {
      f.warn(scaleIdx + 1, 'Scale & budget does not say what gets cut first if the budget runs short');
    }
  }

  return f.list;
}

// --- CLI ----------------------------------------------------------------------

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node lint-plan.js <PLAN.md> [more.md ...]');
  process.exit(1);
}

let totalErrors = 0;
for (const path of args) {
  let list;
  try {
    list = lintPlan(path);
  } catch (e) {
    console.error(`${path}: cannot lint - ${e.message}`);
    totalErrors++;
    continue;
  }
  const errors = list.filter((x) => x.sev === 'ERROR');
  const warns = list.filter((x) => x.sev === 'WARN');
  totalErrors += errors.length;
  console.log(`\n${path}: ${errors.length ? 'FAIL' : 'PASS'} (${errors.length} error(s), ${warns.length} warning(s))`);
  for (const x of list) console.log(`  [${x.sev}] line ${x.line}: ${x.msg}`);
}
process.exit(totalErrors ? 1 : 0);
