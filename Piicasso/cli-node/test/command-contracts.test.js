'use strict';

const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');

const api = require('../src/api/client');
const login = require('../src/commands/login');
const risk = require('../src/commands/risk');
const submit = require('../src/commands/submit');

const originalCall = api.call;
const originalLog = console.log;

beforeEach(() => {
  console.log = () => {};
});

afterEach(() => {
  api.call = originalCall;
  console.log = originalLog;
});

test('login sends email identifiers through the backend username field', () => {
  assert.deepEqual(login.credentialsPayload('person@example.com', 'secret'), {
    username: 'person@example.com',
    password: 'secret',
  });
});

test('submit sends validated structured PII and the selected pattern mode', async () => {
  let request;
  api.call = async (options) => {
    request = options;
    return { id: 7, status: 'success', wordlist: [] };
  };

  await submit.run({
    profile: ['full_name=Ada Lovelace', 'birth_year=1815'],
    patternMode: 'deep',
    json: true,
  });

  assert.deepEqual(request, {
    method: 'POST',
    url: 'submit/',
    data: {
      full_name: 'Ada Lovelace',
      birth_year: '1815',
      pattern_mode: 'deep',
    },
  });
});

test('submit rejects malformed and unsupported profile fields before the network', async () => {
  api.call = async () => assert.fail('network should not be called');

  await assert.rejects(() => submit.run({ profile: ['full_name'], patternMode: 'standard' }), /key=value/);
  await assert.rejects(
    () => submit.run({ profile: ['unknown=value'], patternMode: 'standard' }),
    /unsupported PII field/,
  );
});

test('risk uses the backend GET contract without a fictitious target payload', async () => {
  let request;
  api.call = async (options) => {
    request = options;
    return { severity: 'LOW', total_exposure: 0, breach_probability: 0, recommendations: [] };
  };

  await risk.run({ json: true });

  assert.deepEqual(request, { method: 'GET', url: 'operations/financial-risk/' });
});
