/**
 * analyze — local PII detection. No network. Prints a small fixed-width table.
 */
'use strict';

const fs = require('fs');
const { detectEntities } = require('../engine/pii');
const { ok, dim, err, label, out } = require('../ui/theme');

function readInput(text, file) {
  if (file) {
    try {
      return fs.readFileSync(file, 'utf8');
    } catch (e) {
      console.error(err(`error: cannot read ${file}: ${e.message}`));
      process.exit(1);
    }
  }
  return text || '';
}

function pad(s, n) {
  s = String(s);
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

function run({ text, file, json }) {
  const input = readInput(text, file);
  if (!input.trim()) {
    console.error(err('error: no text supplied (pass a string or --file path)'));
    process.exit(1);
  }
  const entities = detectEntities(input);

  if (json) {
    console.log(JSON.stringify(entities, null, 2));
    return;
  }

  if (!entities.length) {
    console.log(dim('no PII detected.'));
    return;
  }

  console.log(label(`detected ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}:`));
  console.log(dim('─'.repeat(64)));
  console.log(dim(`${pad('TYPE', 8)} ${pad('LABEL', 10)} ${pad('SPAN', 10)} ${pad('WEIGHT', 8)} TEXT`));
  console.log(dim('─'.repeat(64)));
  for (const e of entities) {
    const span = `${e.start}-${e.end}`;
    console.log(
      `${ok(pad(e.type, 8))} ${pad(e.label, 10)} ${pad(span, 10)} ${pad(e.weight.toFixed(2), 8)} ${out(e.text)}`,
    );
  }
}

module.exports = { run };
