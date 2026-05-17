/**
 * darkweb — POST /api/operations/breach-search/ with the given query.
 *
 * Output is pretty-printed JSON by default since the response shape can vary
 * depending on which backend data sources are wired up.
 */
'use strict';

const api = require('../api/client');
const { dim, ok, err, label, out } = require('../ui/theme');

async function run({ query, json }) {
  if (!query) {
    console.error(err('error: usage: piicasso darkweb <query>'));
    process.exit(1);
  }
  const data = await api.call({ method: 'POST', url: 'operations/breach-search/', data: { query } });
  if (json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(label(`breach-search for "${query}"`));
  if (!data) {
    console.log(dim('no data.'));
    return;
  }
  if (Array.isArray(data.hits)) {
    console.log(ok(`${data.hits.length} hit${data.hits.length === 1 ? '' : 's'}`));
    for (const h of data.hits) {
      const source = h.source || h.dataset || 'unknown';
      const when = h.date || h.breach_date || '';
      console.log(dim('  - ') + out(source) + (when ? dim(` (${when})`) : ''));
    }
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

module.exports = { run };
