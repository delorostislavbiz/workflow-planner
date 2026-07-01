#!/usr/bin/env node
// Experimental headless runner for the fixture suites (tests/*/fixtures.md).
// Replaces the copy-paste part of the manual runbook for SINGLE-TURN fixtures:
// it feeds each fixture input to a headless assistant run, saves the transcript
// to the polygon, and (optionally) asks a second headless run to judge the
// transcript against the fixture's expectations.
//
// What it does NOT replace: fixtures marked [multi-turn] (consent flows,
// approval checkpoints) still need a human driving them per the runbook.
// The judge is a model - treat its verdicts as triage, not as ground truth;
// spot-check FAILs by hand before acting on them.
//
// Usage:
//   node run-fixtures.js --suite <path/to/fixtures.md> --out <polygon-dir>
//                        [--cmd "claude -p"] [--only G1,G3] [--judge] [--timeout 600]
//
// Defaults: --cmd "claude -p". The command must read the prompt from STDIN
// (claude -p does); the prompt is piped, never put on the command line, so
// quotes/Cyrillic/multi-line prompts survive on every platform. Override for
// another CLI with --cmd, e.g. --cmd "codex exec" - check it reads stdin.
//
// Isolation: every fixture runs in its own fresh workspace directory created
// under --out (<out>/<date>/<id>.workspace/), so anything the driven skill
// writes (PLAN.md, .claude/workflows/*) lands in the polygon, never in the
// repo, and fixtures cannot contaminate each other. The skill must therefore
// be installed globally (~/.claude/skills) to trigger there.

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

// --- args ---------------------------------------------------------------------
function parseArgs(argv) {
  const args = { cmd: 'claude -p', judge: false, timeout: 600 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--suite') args.suite = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--cmd') args.cmd = argv[++i];
    else if (a === '--only') args.only = argv[++i].split(',').map((s) => s.trim());
    else if (a === '--judge') args.judge = true;
    else if (a === '--timeout') args.timeout = parseInt(argv[++i], 10);
    else { console.error(`Unknown argument: ${a}`); process.exit(1); }
  }
  if (!args.suite || !args.out) {
    console.log('Usage: node run-fixtures.js --suite <fixtures.md> --out <polygon-dir> [--cmd "claude -p"] [--only IDs] [--judge] [--timeout sec]');
    process.exit(1);
  }
  if (!Number.isFinite(args.timeout) || args.timeout <= 0) {
    console.error(`--timeout must be a positive number of seconds, got: ${args.timeout}`);
    process.exit(1);
  }
  return args;
}

// --- fixture parsing ------------------------------------------------------------
// Recognizes blocks of the form:
//   ### <ID> — <title>            (also plain "-" as the dash)
//   - **Input:** "...text..."
//   ...rest of the block = expectations text (key claims / forbidden / pass-fail)
function parseFixtures(mdPath) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const fixtures = [];
  const blocks = md.split(/^### /m).slice(1);
  for (const block of blocks) {
    const header = block.split('\n', 1)[0];
    const id = (header.match(/^([A-Z]+\d+)/) || [])[1];
    if (!id) continue;
    const multiTurn = /\[multi-turn\]/.test(header);
    const inputMatch = block.match(/\*\*Input:\*\*\s*(.+)/);
    let input = inputMatch ? inputMatch[1].trim() : null;
    if (input) {
      const quoted = input.match(/^"(.*)"/) || input.match(/^“(.*)”/);
      if (quoted) input = quoted[1];
    }
    fixtures.push({ id, header: header.trim(), multiTurn, input, expectations: block.trim() });
  }
  return fixtures;
}

// --- running ---------------------------------------------------------------------
// The prompt goes in via STDIN: with shell:true, argv args are joined unquoted
// (word-splitting, quote-mangling on Windows cmd.exe), so user text must never
// be part of the command line. The cmd string itself is operator-provided.
function runHeadless(cmd, promptText, timeoutSec, cwd) {
  const res = spawnSync(cmd, [], {
    encoding: 'utf8',
    input: promptText,
    cwd,
    timeout: timeoutSec * 1000,
    maxBuffer: 64 * 1024 * 1024,
    shell: true, // resolves .cmd shims on Windows; harmless elsewhere
  });
  if (res.error) return { ok: false, out: `RUNNER ERROR: ${res.error.message}` };
  const out = (res.stdout || '') + (res.stderr ? `\n--- stderr ---\n${res.stderr}` : '');
  return { ok: res.status === 0, out };
}

function gitCommit(repoDir) {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: repoDir, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function judgePrompt(fixture, transcript) {
  return [
    'You are judging a test transcript against a fixture specification. Be strict and literal.',
    '',
    `FIXTURE ${fixture.id} specification (expected route/verdict, key claims, forbidden actions):`,
    '---',
    fixture.expectations,
    '---',
    '',
    'TRANSCRIPT of the run:',
    '---',
    transcript,
    '---',
    '',
    'Check: (a) does the observed route/verdict match the expected one; (b) is EVERY key claim satisfied - quote the transcript line that satisfies each; (c) did any forbidden action occur.',
    'Answer with ONLY a JSON object, no prose around it:',
    '{"id": "' + fixture.id + '", "pass": true|false, "route_ok": true|false, "missing_claims": ["..."], "forbidden_violations": ["..."], "evidence": {"<claim>": "<quote>"}, "notes": "<one line>"}',
  ].join('\n');
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

// --- main --------------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2));
const fixtures = parseFixtures(args.suite);
const selected = fixtures.filter((f) => !args.only || args.only.includes(f.id));
if (selected.length === 0) { console.error('No fixtures matched.'); process.exit(1); }

const now = new Date(); // local date, not UTC: transcripts must carry the operator's calendar day
const stamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
const outDir = path.join(args.out, stamp);
fs.mkdirSync(outDir, { recursive: true });
const commit = gitCommit(path.dirname(args.suite));

console.log(`Suite: ${args.suite} (${selected.length} fixture(s)) | skill commit: ${commit}`);
console.log(`Transcripts -> ${outDir}\n`);

const summary = [];
for (const f of selected) {
  if (f.multiTurn) {
    console.log(`${f.id}: SKIP (multi-turn - drive it manually per the runbook)`);
    summary.push({ id: f.id, result: 'SKIP (multi-turn)' });
    continue;
  }
  if (!f.input) {
    console.log(`${f.id}: SKIP (no parseable **Input:** line)`);
    summary.push({ id: f.id, result: 'SKIP (no input)' });
    continue;
  }
  process.stdout.write(`${f.id}: running... `);
  // Fresh workspace per fixture: the driven skill's artifacts (PLAN.md, scripts)
  // land here - inside the polygon, isolated from other fixtures and the repo.
  const workspace = path.join(outDir, `${f.id}.workspace`);
  fs.mkdirSync(workspace, { recursive: true });
  const run = runHeadless(args.cmd, f.input, args.timeout, workspace);
  const transcriptPath = path.join(outDir, `${f.id}.md`);
  fs.writeFileSync(transcriptPath, [
    `fixture: ${f.id}`, `date: ${stamp}`, `skill_commit: ${commit}`,
    `cmd: ${args.cmd}`, `input: ${f.input}`, '', '--- transcript ---', run.out,
  ].join('\n'));

  let result = run.ok ? 'RAN' : 'RUN-ERROR';
  if (args.judge && run.ok) {
    const judged = runHeadless(args.cmd, judgePrompt(f, run.out), args.timeout, outDir);
    fs.writeFileSync(path.join(outDir, `${f.id}.judge.txt`), judged.out);
    const verdict = extractJson(judged.out);
    if (verdict) {
      result = verdict.pass ? 'PASS' : `FAIL (${(verdict.missing_claims || []).concat(verdict.forbidden_violations || []).join('; ') || verdict.notes})`;
      fs.writeFileSync(path.join(outDir, `${f.id}.judge.json`), JSON.stringify(verdict, null, 2));
    } else {
      result = 'JUDGE-UNPARSEABLE';
    }
  }
  console.log(result);
  summary.push({ id: f.id, result });
}

console.log('\n--- summary ---');
for (const s of summary) console.log(`${s.id.padEnd(6)} ${s.result}`);
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify({ date: stamp, commit, cmd: args.cmd, summary }, null, 2));
const failed = summary.some((s) => /FAIL|ERROR|UNPARSEABLE/.test(s.result));
process.exit(failed ? 1 : 0);
