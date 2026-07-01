#!/usr/bin/env node
// Mechanical validator for Dynamic Workflow scripts (.claude/workflows/*.js).
// Complements the model's self-check in templates/workflow-script.js: everything
// here is checked deterministically, by text analysis - no model judgment.
//
// Usage:  node validate-workflow.js <script.js> [more.js ...]
// Exit:   0 = no errors (warnings allowed), 1 = at least one error.
//
// Checks are heuristic (regex over comment/string-stripped source), tuned to
// catch the known fabrication classes from reference/workflow-primitives.md.
// A PASS here does not prove the script correct - it proves it free of the
// mechanical mistakes this tool knows about.

'use strict';

const fs = require('fs');

const PRIMITIVES = ['agent', 'parallel', 'pipeline', 'phase', 'log', 'workflow'];
const AGENT_OPT_KEYS = ['label', 'phase', 'schema', 'agentType', 'model', 'effort', 'isolation'];
// Common fabrications seen in generated scripts: options that do not exist.
const FABRICATED_OPT_KEYS = ['retries', 'timeout', 'tools', 'context', 'memory', 'temperature'];

// --- source stripping -------------------------------------------------------
// Returns { code, hasInterpolation }. `code` is the source with comments and
// string/template TEXT blanked out; code inside template interpolations
// (${...}) stays visible, including nested templates. STRICTLY length- and
// line-preserving: every index into `code` is valid in `src` too.
// `hasInterpolation` is true if any template literal contains ${...}.
function strip(src) {
  let code = '';
  let hasInterpolation = false;
  // Context stack: 'code' frames track {} depth; a frame opened by ${ pops
  // back to its template when its braces close.
  const stack = [{ type: 'code', depth: 0, fromTemplate: false }];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ctx = stack[stack.length - 1];
    const c = src[i];
    const c2 = src.slice(i, i + 2);
    if (ctx.type === 'code') {
      if (c2 === '//') {
        while (i < n && src[i] !== '\n') { code += ' '; i++; }
      } else if (c2 === '/*') {
        const end = src.indexOf('*/', i + 2);
        const stop = end === -1 ? n : end + 2;
        for (; i < stop; i++) code += src[i] === '\n' ? '\n' : ' ';
      } else if (c === '"' || c === "'") {
        code += c; i++;
        while (i < n && src[i] !== c && src[i] !== '\n') {
          if (src[i] === '\\') { code += '  '; i += 2; }
          else { code += ' '; i++; }
        }
        if (i < n && src[i] === c) { code += c; i++; }
      } else if (c === '`') {
        code += '`'; i++;
        stack.push({ type: 'template' });
      } else if (c === '{') {
        ctx.depth++; code += c; i++;
      } else if (c === '}') {
        if (ctx.fromTemplate && ctx.depth === 0) { stack.pop(); code += '}'; i++; }
        else { ctx.depth--; code += c; i++; }
      } else {
        code += c; i++;
      }
    } else { // template text
      if (c === '\\') { code += '  '; i += 2; }
      else if (c === '`') { code += '`'; i++; stack.pop(); }
      else if (c2 === '${') {
        hasInterpolation = true;
        code += '${'; i += 2;
        stack.push({ type: 'code', depth: 0, fromTemplate: true });
      } else {
        code += c === '\n' ? '\n' : ' '; i++;
      }
    }
  }
  return { code, hasInterpolation };
}

// Extracts the balanced {...} block that starts at the first `{` at/after `from`.
function balancedBlock(text, from) {
  const start = text.indexOf('{', from);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

// --- checks ------------------------------------------------------------------
function validate(path) {
  const findings = []; // { level: 'ERROR'|'WARN', msg }
  const err = (msg) => findings.push({ level: 'ERROR', msg });
  const warn = (msg) => findings.push({ level: 'WARN', msg });

  let src;
  try {
    src = fs.readFileSync(path, 'utf8');
  } catch (e) {
    return [{ level: 'ERROR', msg: `cannot read file: ${e.message}` }];
  }
  if (!src.trim()) return [{ level: 'ERROR', msg: 'file is empty' }];

  const { code, hasInterpolation } = strip(src);

  // Leftover placeholders from templates/workflow-script.js mean the script was
  // not filled in. Only unambiguous template markers - a generic <word> pattern
  // would false-positive on legitimate XML-style tags inside agent prompts.
  if (/<(kebab-name|one line|Phase \d>|branch [A-Z] prompt|list of independent units|stage \d:)/.test(src)) {
    err('unfilled template placeholders <...> remain - the script is not ready to run');
  }

  // 1. meta: present, pure literal, required fields.
  const metaDecl = code.search(/export\s+const\s+meta\s*=/);
  if (metaDecl === -1) {
    err("missing `export const meta = {...}` - it is required and must be the script's first statement");
  } else {
    const block = balancedBlock(code, metaDecl);
    if (!block) {
      err('meta object braces do not balance');
    } else {
      const metaCode = code.slice(block.start, block.end); // strings already blanked
      const metaSrc = src.slice(block.start, block.end);
      if (/\(/.test(metaCode)) err('meta is not a pure literal: it contains a function call');
      if (/\.\.\./.test(metaCode)) err('meta is not a pure literal: it contains a spread (...)');
      if (/\$\{/.test(metaSrc)) err('meta is not a pure literal: it contains template interpolation ${...}');
      if (/[+?|&]/.test(metaCode.replace(/\.\.\./g, ''))) err('meta is not a pure literal: it contains an expression (+, ?:, ||, &&)');
      if (!/\bname\s*:/.test(metaCode)) err('meta.name is missing (required)');
      if (!/\bdescription\s*:/.test(metaCode)) err('meta.description is missing (required)');
      const nameMatch = metaSrc.match(/\bname\s*:\s*['"`]([^'"`]+)['"`]/);
      if (nameMatch && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(nameMatch[1])) {
        warn(`meta.name '${nameMatch[1]}' is not kebab-case`);
      }
      const knownMeta = ['name', 'description', 'phases', 'whenToUse', 'model', 'title', 'detail'];
      for (const m of metaCode.matchAll(/\b([A-Za-z_$][\w$]*)\s*:/g)) {
        if (!knownMeta.includes(m[1])) warn(`meta has an undocumented field '${m[1]}'`);
      }
      // Anything before the meta declaration besides comments/whitespace?
      if (code.slice(0, metaDecl).trim() !== '') {
        warn('meta is not the first statement in the file');
      }
    }
  }

  // 2. Forbidden calls (they break resume / do not exist in the sandbox).
  const forbidden = [
    [/\bDate\.now\s*\(/, 'Date.now() is unavailable in workflow scripts (breaks resume) - pass timestamps via args'],
    [/\bMath\.random\s*\(/, 'Math.random() is unavailable (breaks resume) - vary prompts by index/label instead'],
    [/\bnew\s+Date\s*\(\s*\)/, 'argless new Date() is unavailable (breaks resume) - pass time via args'],
    [/\brequire\s*\(/, 'require() is unavailable - the script has no Node API access'],
    [/^\s*import[\s{]/m, 'import statements are not allowed - only `export const meta` plus the body'],
    [/\bprocess\s*\./, 'process.* is unavailable - no Node API access'],
    [/\bfs\s*\./, 'fs.* is unavailable - no filesystem access from the script (agents read/write files, the script does not)'],
    [/\bEnterWorktree\b|\bExitWorktree\b/, "EnterWorktree/ExitWorktree do not exist in scripts - use agent(..., {isolation:'worktree'})"],
  ];
  for (const [re, msg] of forbidden) {
    const m = code.match(re);
    if (m) err(`line ${lineOf(code, m.index)}: ${msg}`);
  }

  // 3. TypeScript syntax (scripts are plain JS).
  const tsPatterns = [
    [/\binterface\s+[A-Z]\w*\s*\{/, 'TypeScript `interface` found - scripts are plain JS'],
    [/\benum\s+\w+\s*\{/, 'TypeScript `enum` found - scripts are plain JS'],
    [/\)\s*:\s*(string|number|boolean|void|any)\b/, 'TypeScript return-type annotation found - scripts are plain JS'],
    [/\b(const|let|var)\s+\w+\s*:\s*(string|number|boolean|any|\w+\[\])\s*=/, 'TypeScript type annotation found - scripts are plain JS'],
    [/\bas\s+const\b/, 'TypeScript `as const` found - scripts are plain JS'],
  ];
  for (const [re, msg] of tsPatterns) {
    const m = code.match(re);
    if (m) err(`line ${lineOf(code, m.index)}: ${msg}`);
  }

  // 4. isolation value: only 'worktree' exists.
  for (const m of src.matchAll(/\bisolation\s*:\s*['"`]([^'"`]+)['"`]/g)) {
    if (m[1] !== 'worktree') {
      err(`line ${lineOf(src, m.index)}: isolation:'${m[1]}' does not exist - the only value is 'worktree'`);
    }
  }

  // 5. Fabricated agent() option keys.
  for (const key of FABRICATED_OPT_KEYS) {
    const re = new RegExp(`\\b${key}\\s*:`);
    const m = code.match(re);
    if (m) warn(`line ${lineOf(code, m.index)}: '${key}:' is not a documented agent() option (known: ${AGENT_OPT_KEYS.join(', ')})`);
  }

  // 6. Loops must have an explicit stop.
  for (const m of code.matchAll(/while\s*\(\s*true\s*\)/g)) {
    const rest = code.slice(m.index);
    const hasBreak = /\bbreak\b/.test(rest);
    if (!hasBreak) err(`line ${lineOf(code, m.index)}: while(true) without a break - a loop needs an explicit stop (cap + no-progress break + budget guard)`);
    else warn(`line ${lineOf(code, m.index)}: while(true) found - confirm the break implements a real stop condition (cap / no-progress / budget)`);
  }
  const whileCount = (code.match(/\bwhile\s*\(/g) || []).length;
  if (whileCount > 0 && !/budget\.(remaining|total)/.test(code)) {
    warn('the script loops but never checks budget.remaining()/budget.total - an unbounded loop can run to the 1000-agent backstop');
  }

  // 7. Primitive usage: no agents at all is suspicious.
  if (!/\bagent\s*\(/.test(code)) {
    err('no agent() calls found - a workflow script must launch at least one agent');
  }

  // 8. parallel() elements must be thunks: () => agent(...).
  for (const m of code.matchAll(/\bparallel\s*\(\s*\[/g)) {
    const window = code.slice(m.index, m.index + 300);
    if (!/=>/.test(window)) {
      warn(`line ${lineOf(code, m.index)}: parallel([...]) - elements must be thunks (() => agent(...)), otherwise they start immediately`);
    }
  }

  // 9. phase() titles vs meta.phases titles.
  const phaseCalls = [...src.matchAll(/\bphase\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g)].map((m) => m[1]);
  const metaMatch = src.match(/phases\s*:\s*\[([\s\S]*?)\]/);
  if (metaMatch) {
    const metaTitles = [...metaMatch[1].matchAll(/title\s*:\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);
    for (const t of phaseCalls) if (!metaTitles.includes(t)) warn(`phase('${t}') has no matching entry in meta.phases (titles are matched exactly)`);
    for (const t of metaTitles) if (!phaseCalls.includes(t)) warn(`meta.phases title '${t}' has no matching phase() call`);
  }

  // 10. Unknown top-level calls (possible fabricated primitives).
  const declared = new Set();
  for (const m of code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\(|function)/g)) declared.add(m[1]);
  const builtinOk = new Set([
    ...PRIMITIVES, ...declared,
    // keywords that can precede '(' and JS builtins common in orchestration code:
    'if', 'for', 'while', 'switch', 'catch', 'return', 'async', 'await', 'typeof', 'void',
    'map', 'filter', 'forEach', 'flat', 'flatMap', 'join', 'push', 'pop', 'shift', 'unshift',
    'slice', 'splice', 'concat', 'includes', 'indexOf', 'find', 'findIndex', 'some', 'every',
    'sort', 'reduce', 'reverse', 'fill', 'keys', 'values', 'entries', 'from', 'of', 'isArray',
    'floor', 'ceil', 'round', 'min', 'max', 'abs', 'sign', 'trunc',
    'parse', 'stringify', 'String', 'Number', 'Boolean', 'Array', 'Object', 'Set', 'Map',
    'has', 'add', 'get', 'set', 'delete', 'assign', 'freeze',
    'startsWith', 'endsWith', 'toLowerCase', 'toUpperCase', 'trim', 'split', 'replace',
    'replaceAll', 'match', 'matchAll', 'test', 'exec', 'repeat', 'padStart', 'padEnd',
    'toFixed', 'toString', 'localeCompare', 'charAt', 'codePointAt', 'normalize',
    'then', 'spent', 'remaining', 'RegExp', 'Error', 'Promise', 'all', 'race',
  ]);
  const flagged = new Set();
  for (const m of code.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = m[1];
    if (!builtinOk.has(name) && !flagged.has(name)) {
      flagged.add(name);
      warn(`line ${lineOf(code, m.index)}: unknown call '${name}(' - only 5 primitives exist (agent/parallel/pipeline/phase/log) plus workflow(); if this is not a helper defined in the script, it is a fabrication`);
    }
  }

  // 11. Interpolation reminder for blind agents (informational).
  if (/\bagent\s*\(/.test(code) && phaseCalls.length > 1 && !hasInterpolation) {
    warn('multiple phases but no prompt interpolates previous results (${...}) - agents are blind; dependent branches must receive prior results inside the prompt text');
  }

  return findings;
}

// --- main ---------------------------------------------------------------------
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: node validate-workflow.js <script.js> [more.js ...]');
  process.exit(1);
}

let hasErrors = false;
for (const f of files) {
  const findings = validate(f);
  const errors = findings.filter((x) => x.level === 'ERROR');
  const warns = findings.filter((x) => x.level === 'WARN');
  console.log(`\n${f}: ${errors.length ? 'FAIL' : 'PASS'} (${errors.length} error(s), ${warns.length} warning(s))`);
  for (const x of findings) console.log(`  [${x.level}] ${x.msg}`);
  if (errors.length) hasErrors = true;
}
process.exit(hasErrors ? 1 : 0);
