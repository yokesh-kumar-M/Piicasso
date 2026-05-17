/**
 * inbox — list messages from /api/operations/messages/.
 */
'use strict';

const api = require('../api/client');
const { dim, ok, label, out } = require('../ui/theme');

function pad(s, n) {
  s = String(s == null ? '' : s);
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

async function run({ json }) {
  const data = await api.call({ method: 'GET', url: 'operations/messages/' });
  const rows = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
  if (json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (!rows.length) {
    console.log(dim('inbox empty.'));
    return;
  }
  console.log(label(`${rows.length} message${rows.length === 1 ? '' : 's'}:`));
  console.log(dim('─'.repeat(72)));
  console.log(dim(`${pad('ID', 6)} ${pad('FROM', 20)} ${pad('WHEN', 22)} SUBJECT`));
  console.log(dim('─'.repeat(72)));
  for (const r of rows) {
    const id = r.id != null ? r.id : '—';
    const from = r.sender || r.from || r.from_user || '';
    const when = r.created_at || r.timestamp || '';
    const subj = (r.subject || r.title || r.body || '').replace(/\s+/g, ' ').slice(0, 40);
    console.log(`${ok(pad(id, 6))} ${pad(from, 20)} ${pad(when, 22)} ${out(subj)}`);
  }
}

module.exports = { run };
