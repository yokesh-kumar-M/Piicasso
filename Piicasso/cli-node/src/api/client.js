/**
 * client.js — axios wrapper with JWT auth + auto-refresh.
 *
 * On every request, attaches `Authorization: Bearer <access>` if a token is
 * stored. On a 401, attempts a single refresh against /user/token/refresh/.
 * If that fails too, the caller sees the original error and the CLI prints
 * "session expired — run `piicasso login`" + exits 1.
 */
'use strict';

const axios = require('axios');
const store = require('../config/store');
const { err } = require('../ui/theme');

function baseClient() {
  return axios.create({
    baseURL: store.apiBase(),
    timeout: 30000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
}

async function refreshAccess() {
  const cfg = store.read();
  if (!cfg.refresh) return false;
  try {
    const c = baseClient();
    const res = await c.post('user/token/refresh/', { refresh: cfg.refresh });
    if (res.data && res.data.access) {
      store.update({ access: res.data.access });
      return true;
    }
  } catch {
    // swallow — caller handles "session expired"
  }
  return false;
}

/**
 * Authenticated request. Pass the same shape you'd pass to axios:
 *   request({ method: 'GET', url: 'history/' })
 *   request({ method: 'POST', url: 'submit/', data: { text } })
 *
 * On 401, refreshes once and retries. On a second failure, throws a labelled
 * error the CLI surfaces verbatim.
 */
async function request(opts) {
  const cfg = store.read();
  const headers = { ...(opts.headers || {}) };
  if (cfg.access) headers.Authorization = `Bearer ${cfg.access}`;

  const c = baseClient();
  try {
    return await c.request({ ...opts, headers });
  } catch (e) {
    const status = e.response && e.response.status;
    if (status === 401 && cfg.refresh) {
      const refreshed = await refreshAccess();
      if (refreshed) {
        const next = store.read();
        const retryHeaders = { ...headers, Authorization: `Bearer ${next.access}` };
        try {
          return await c.request({ ...opts, headers: retryHeaders });
        } catch (e2) {
          if (e2.response && e2.response.status === 401) {
            throw sessionExpired();
          }
          throw e2;
        }
      }
      throw sessionExpired();
    }
    if (status === 401) {
      throw sessionExpired();
    }
    throw e;
  }
}

function sessionExpired() {
  const e = new Error('session expired — run `piicasso login`');
  e.code = 'SESSION_EXPIRED';
  return e;
}

/** Format an axios error into a single line for the user. */
function formatError(e) {
  if (e && e.code === 'SESSION_EXPIRED') return `error: ${e.message}`;
  if (e && e.response) {
    const status = e.response.status;
    const data = e.response.data;
    let detail = '';
    if (data) {
      if (typeof data === 'string') detail = data;
      else if (data.detail) detail = data.detail;
      else detail = JSON.stringify(data);
    }
    return `error: HTTP ${status}${detail ? ' — ' + detail : ''}`;
  }
  if (e && e.request) {
    return `error: no response from ${store.apiBase()} (${e.code || 'network error'})`;
  }
  return `error: ${e && e.message ? e.message : 'unknown failure'}`;
}

/** Convenience helper used by command modules. Exits the process on failure. */
async function call(opts) {
  try {
    const res = await request(opts);
    return res.data;
  } catch (e) {
    console.error(err(formatError(e)));
    process.exit(1);
  }
}

module.exports = { request, call, refreshAccess, formatError };
