'use strict';

const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const axios = require('axios');
const store = require('../src/config/store');
const client = require('../src/api/client');

const originalAxiosCreate = axios.create;
const originalStore = {
  apiBase: store.apiBase,
  clearAuth: store.clearAuth,
  read: store.read,
  update: store.update,
};

afterEach(() => {
  axios.create = originalAxiosCreate;
  Object.assign(store, originalStore);
});

function fakeStore(initial) {
  const state = { ...initial };
  let clearCount = 0;

  store.apiBase = () => 'https://example.test/api/';
  store.read = () => ({ ...state });
  store.update = (patch) => {
    Object.assign(state, patch);
    return { ...state };
  };
  store.clearAuth = () => {
    delete state.access;
    delete state.refresh;
    delete state.user;
    clearCount += 1;
    return { ...state };
  };

  return { state, get clearCount() { return clearCount; } };
}

test('refreshAccess is single-flight and persists a rotated token pair', async () => {
  const session = fakeStore({ access: 'old-access', refresh: 'old-refresh' });
  let postCount = 0;
  let releaseRefresh;
  const refreshResponse = new Promise((resolve) => {
    releaseRefresh = resolve;
  });

  axios.create = () => ({
    post(url, body) {
      postCount += 1;
      assert.equal(url, 'user/token/refresh/');
      assert.deepEqual(body, { refresh: 'old-refresh' });
      return refreshResponse;
    },
  });

  const first = client.refreshAccess();
  const second = client.refreshAccess();
  assert.strictEqual(first, second);
  assert.equal(postCount, 1);

  releaseRefresh({ data: { access: 'new-access', refresh: 'new-refresh' } });
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(session.state.access, 'new-access');
  assert.equal(session.state.refresh, 'new-refresh');
  assert.equal(session.clearCount, 0);
});

test('refreshAccess retains a valid refresh token when rotation is disabled', async () => {
  const session = fakeStore({ access: 'old-access', refresh: 'stable-refresh' });
  axios.create = () => ({
    post: async () => ({ data: { access: 'new-access' } }),
  });

  assert.equal(await client.refreshAccess(), true);
  assert.equal(session.state.access, 'new-access');
  assert.equal(session.state.refresh, 'stable-refresh');
});

test('refreshAccess clears unusable credentials after failure', async () => {
  const session = fakeStore({ access: 'expired-access', refresh: 'invalid-refresh' });
  axios.create = () => ({
    post: async () => {
      throw new Error('refresh rejected');
    },
  });

  assert.equal(await client.refreshAccess(), false);
  assert.equal(session.state.access, undefined);
  assert.equal(session.state.refresh, undefined);
  assert.equal(session.clearCount, 1);
});
