/**
 * client.js - axios wrapper with JWT auth + single-flight token rotation.
 *
 * On every request, attaches `Authorization: Bearer <access>` if a token is
 * stored. On a 401, attempts one shared refresh and retries once.
 */
'use strict';

const axios = require('axios');
const store = require('../config/store');

let refreshPromise = null;

function baseClient() {
  return axios.create({
    baseURL: store.apiBase(),
    timeout: 30000,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });
}

/** Refresh once for every group of concurrent 401 responses. */
function refreshAccess() {
  if (refreshPromise) return refreshPromise;

  const cfg = store.read();
  if (!cfg.refresh) {
    store.clearAuth();
    return Promise.resolve(false);
  }

  refreshPromise = (async () => {
    try {
      const c = baseClient();
      // The protocol-defined refresh credential is sent only to the configured
      // PIIcasso API; this is not arbitrary file-content exfiltration.
      const res = await c.post('user/token/refresh/', { refresh: cfg.refresh }); // lgtm[js/file-access-to-http]
      if (res.data && res.data.access) {
        // SimpleJWT rotates and blacklists refresh tokens in production. Save
        // the returned pair together; retain the old refresh only when the
        // server deliberately returns access alone.
        store.update({
          access: res.data.access,
          refresh: res.data.refresh || cfg.refresh,
        });
        return true;
      }
    } catch {
      // The caller surfaces a stable session-expired error.
    }

    store.clearAuth();
    return false;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Authenticated request. Pass the same shape accepted by axios.
 * A refreshed request is retried exactly once.
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
        } catch (retryError) {
          if (retryError.response && retryError.response.status === 401) {
            store.clearAuth();
            throw sessionExpired();
          }
          throw retryError;
        }
      }
      throw sessionExpired();
    }
    if (status === 401) {
      store.clearAuth();
      throw sessionExpired();
    }
    throw e;
  }
}

function sessionExpired() {
  const error = new Error('session expired — run `piicasso login`');
  error.code = 'SESSION_EXPIRED';
  return error;
}

/** Format an axios error into a single line for the user. */
function formatError(error) {
  if (error && error.code === 'SESSION_EXPIRED') return `error: ${error.message}`;
  if (error && error.response) {
    const status = error.response.status;
    const data = error.response.data;
    let detail = '';
    if (data) {
      if (typeof data === 'string') detail = data;
      else if (data.detail) detail = data.detail;
      else detail = JSON.stringify(data);
    }
    return `error: HTTP ${status}${detail ? ` — ${detail}` : ''}`;
  }
  if (error && error.request) {
    return `error: no response from ${store.apiBase()} (${error.code || 'network error'})`;
  }
  return `error: ${error && error.message ? error.message : 'unknown failure'}`;
}

/** Convenience helper used by command modules. */
async function call(opts) {
  try {
    const res = await request(opts);
    return res.data;
  } catch (error) {
    const message = formatError(error).replace(/^error:\s*/, '');
    const commandError = new Error(message);
    commandError.cause = error;
    throw commandError;
  }
}

module.exports = { request, call, refreshAccess, formatError };
