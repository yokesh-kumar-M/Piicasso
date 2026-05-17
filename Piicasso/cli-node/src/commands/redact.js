/**
 * redact — print the input text with PII replaced by [TYPE] placeholders.
 */
'use strict';

const fs = require('fs');
const { detectEntities, redactText, renderRedacted } = require('../engine/pii');
const { err } = require('../ui/theme');

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

function run({ text, file, json }) {
  const input = readInput(text, file);
  if (!input.trim()) {
    console.error(err('error: no text supplied (pass a string or --file path)'));
    process.exit(1);
  }
  const entities = detectEntities(input);
  const segments = redactText(input, entities);
  if (json) {
    console.log(JSON.stringify({ entities, segments }, null, 2));
    return;
  }
  console.log(renderRedacted(segments));
}

module.exports = { run };
