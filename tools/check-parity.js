#!/usr/bin/env node
// Advisory parity checker for the Claude skill vs its Codex copy.
// Compares section headings of the SHARED file pairs from PARITY.md and flags
// drift. It catches forgotten mirrors, not bad ones - meaning is on you.
//
// Usage: node tools/check-parity.js   (from the repo root)
// Exit:  1 only if a counterpart file is missing; heading drift is a warning.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CODEX = path.join(ROOT, 'plugins', 'workflow-planner-codex', 'skills', 'workflow-planner');

// [claudePath, codexPath, mode]
// mode=true: compare section headings; mode=false: counterpart must exist, but its
// structure is intentionally different; mode='identical': byte-equal copies (shared tools
// shipped inside the plugin - any diff means one side is stale).
const PAIRS = [
  ['SKILL.md', 'SKILL.md', false],
  // applicability: heading phrasing differs by design ("...workflow" vs "...Codex subagent
  // workflow"); rule parity (thresholds, matrix, anchor) is checked by eye per PARITY.md.
  ['reference/applicability.md', 'reference/applicability.md', false],
  ['reference/acceptance-contract.md', 'reference/acceptance-contract.md', true],
  ['reference/prompt-helper.md', 'reference/prompt-helper.md', true],
  ['reference/prompt-patterns.md', 'reference/prompt-patterns.md', true],
  ['reference/workflow-primitives.md', 'reference/codex-workflow-runtime.md', false],
  ['reference/plan-to-script.md', 'reference/plan-to-codex-workflow.md', false],
  ['reference/review-workflow.md', 'reference/review-workflow.md', false],
  ['reference/after-run.md', 'reference/after-run.md', false],
  ['templates/workflow-plan.md', 'templates/codex-workflow-plan.md', false],
  ['templates/linear-plan.md', 'templates/linear-plan.md', true],
  ['examples.md', 'examples.md', false],
  ['tests/prompt-helper/fixtures.md', 'tests/prompt-helper/fixtures.md', true],
  ['tests/prompt-helper/runbook.md', 'tests/prompt-helper/runbook.md', false],
  ['tests/gate/fixtures.md', 'tests/gate/fixtures.md', false],
  ['tools/lint-plan.js', 'tools/lint-plan.js', 'identical'],
];

// Case and punctuation are normalized: "## Plan Self-Review" == "## Plan self-review".
function headings(file) {
  const md = fs.readFileSync(file, 'utf8');
  return [...md.matchAll(/^(##+)\s+(.*)$/gm)]
    .map((m) => `${m[1]} ${m[2].trim().toLowerCase().replace(/[^a-z0-9а-яё\s]/gi, '').replace(/\s+/g, ' ')}`);
}

let missing = 0;
let drifted = 0;

for (const [a, b, compare] of PAIRS) {
  const fa = path.join(ROOT, a);
  const fb = path.join(CODEX, b);
  const name = `${a} <-> codex:${b}`;
  if (!fs.existsSync(fa)) { console.log(`MISSING (claude side!): ${a}`); missing++; continue; }
  if (!fs.existsSync(fb)) { console.log(`MISSING counterpart: ${name}`); missing++; continue; }
  if (compare === 'identical') {
    const norm = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    if (norm(fa) === norm(fb)) { console.log(`ok (identical): ${name}`); }
    else { drifted++; console.log(`DRIFT (copies differ): ${name} - re-copy the tool to whichever side is stale`); }
    continue;
  }
  if (!compare) { console.log(`ok (existence only): ${name}`); continue; }

  const ha = headings(fa);
  const hb = headings(fb);
  const onlyA = ha.filter((h) => !hb.includes(h));
  const onlyB = hb.filter((h) => !ha.includes(h));
  if (onlyA.length === 0 && onlyB.length === 0) {
    console.log(`ok: ${name}`);
  } else {
    drifted++;
    console.log(`DRIFT: ${name}`);
    for (const h of onlyA) console.log(`   only in claude: ${h}`);
    for (const h of onlyB) console.log(`   only in codex:  ${h}`);
  }
}

console.log(`\n${PAIRS.length} pairs: ${missing} missing, ${drifted} drifted (see PARITY.md "Pending" before treating drift as a bug)`);
process.exit(missing ? 1 : 0);
