/**
 * store.js — persistence for ~/.piicasso/config.json.
 *
 * Holds: { api, mode, access, refresh, user }. Created lazily on first
 * write. Reads return an empty object if the file is missing or unreadable.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_API = 'https://core-engine-woeg.onrender.com/api/';

function configDir() {
  return path.join(os.homedir(), '.piicasso');
}

function configPath() {
  return path.join(configDir(), 'config.json');
}

function ensureDir() {
  const dir = configDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

/** Returns the parsed config or {} on any failure. Never throws. */
function read() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Persist `obj` to disk (atomic-ish: write then rename is overkill for a CLI). */
function write(obj) {
  ensureDir();
  fs.writeFileSync(configPath(), JSON.stringify(obj, null, 2), { mode: 0o600 });
}

/** Merge `patch` into the stored config. */
function update(patch) {
  const current = read();
  const next = { ...current, ...patch };
  write(next);
  return next;
}

/** Remove the auth-related fields. Leaves api and mode in place. */
function clearAuth() {
  const current = read();
  delete current.access;
  delete current.refresh;
  delete current.user;
  write(current);
  return current;
}

/** Return the API base URL, honoring env override then config then default. */
function apiBase() {
  const fromEnv = process.env.PIICASSO_API;
  if (fromEnv) return ensureTrailingSlash(fromEnv);
  const cfg = read();
  if (cfg.api) return ensureTrailingSlash(cfg.api);
  return DEFAULT_API;
}

function ensureTrailingSlash(u) {
  return u.endsWith('/') ? u : u + '/';
}

/** Return the current local mode, defaulting to 'user'. */
function getMode() {
  const cfg = read();
  return cfg.mode === 'security' ? 'security' : 'user';
}

module.exports = {
  DEFAULT_API,
  configDir,
  configPath,
  read,
  write,
  update,
  clearAuth,
  apiBase,
  getMode,
};
