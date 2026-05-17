/**
 * history — list recent analyses for the signed-in user.
 */
'use strict';

const api = require('../api/client');
const { dim, ok, err, label, out } = require('../ui/theme');

function pad(s, n) {
  s = String(s == null ? '' : s);
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

async function run({ limit, json }) {
  const data = await api.call({ method: 'GET', url: 'history/' });
  const rows = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
  const n = Number.isFinite(limit) && limit > 0 ? limit : 20;
  const slice = rows.slice(0, n);
  if (json) {
    console.log(JSON.stringify(slice, null, 2));
    return;
  }
  if (!slice.length) {
    console.log(dim('no history yet.'));
    return;
  }
  console.log(label(`${slice.length} record${slice.length === 1 ? '' : 's'}:`));
  console.log(dim('─'.repeat(72)));
  console.log(dim(`${pad('ID', 6)} ${pad('CREATED', 22)} ${pad('STATUS', 12)} PREVIEW`));
  console.log(dim('─'.repeat(72)));
  for (const r of slice) {
    const id = r.id != null ? r.id : '—';
    const created = r.created_at || r.timestamp || r.created || '';
    const status = r.status || r.state || '';
    const preview = (r.text || r.input || r.summary || '').replace(/\s+/g, ' ').slice(0, 40);
    console.log(`${ok(pad(id, 6))} ${pad(created, 22)} ${pad(status, 12)} ${out(preview)}`);
  }
}

module.exports = { run };
