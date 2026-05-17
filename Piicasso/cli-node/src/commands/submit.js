/**
 * submit — upload text to the server for AI-backed analysis.
 *
 * POSTs to /api/submit/ with { text }. Accepts either a path or stdin; if a
 * path is passed, its contents are read and submitted.
 */
'use strict';

const fs = require('fs');
const api = require('../api/client');
const { ok, dim, err, label, out } = require('../ui/theme');

function run({ file, json }) {
  if (!file) {
    console.error(err('error: usage: piicasso submit <file>'));
    process.exit(1);
  }
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error(err(`error: cannot read ${file}: ${e.message}`));
    process.exit(1);
  }
  if (!text.trim()) {
    console.error(err('error: file is empty'));
    process.exit(1);
  }
  return api.call({ method: 'POST', url: 'submit/', data: { text } }).then(data => {
    if (json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    console.log(ok('submitted.'));
    if (data && data.id !== undefined) console.log(label('id     ') + ' ' + out(String(data.id)));
    if (data && data.status)          console.log(label('status ') + ' ' + out(String(data.status)));
    if (data && data.summary)         console.log(dim('summary:') + '\n' + out(String(data.summary)));
    if (data && Array.isArray(data.entities)) {
      console.log(dim(`entities: ${data.entities.length}`));
    }
  });
}

module.exports = { run };
