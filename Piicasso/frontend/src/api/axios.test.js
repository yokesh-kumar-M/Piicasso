import axios from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import axiosInstance, { clearSession, persistSession, subscribeToSession } from './axios';

const originalAdapter = axiosInstance.defaults.adapter;

const response = (config, data = {}, status = 200) =>
  Promise.resolve({
    config,
    data,
    headers: {},
    status,
    statusText: status === 200 ? 'OK' : 'Error',
  });

const unauthorized = (config) =>
  Promise.reject({
    config,
    isAxiosError: true,
    response: {
      config,
      data: { detail: 'Token is invalid or expired' },
      headers: {},
      status: 401,
      statusText: 'Unauthorized',
    },
  });

describe('browser auth refresh', () => {
  beforeEach(() => {
    localStorage.clear();
    delete axiosInstance.defaults.headers.common.Authorization;
  });

  afterEach(() => {
    clearSession();
    axiosInstance.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  test('concurrent 401 responses share one refresh and persist the rotated pair', async () => {
    persistSession({ access: 'old-access', refresh: 'old-refresh' });
    const listener = vi.fn();
    const unsubscribe = subscribeToSession(listener);

    let releaseRefresh;
    const refreshResponse = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    const refreshPost = vi.spyOn(axios, 'post').mockReturnValue(refreshResponse);

    const adapter = vi.fn((config) => {
      if (!config._retry) return unauthorized(config);
      return response(config, { resource: config.url });
    });
    axiosInstance.defaults.adapter = adapter;

    const first = axiosInstance.get('resource/one');
    const second = axiosInstance.get('resource/two');

    await vi.waitFor(() => expect(refreshPost).toHaveBeenCalledTimes(1));
    releaseRefresh({ data: { access: 'rotated-access', refresh: 'rotated-refresh' } });

    const results = await Promise.all([first, second]);

    expect(results.map(({ data }) => data.resource)).toEqual(['resource/one', 'resource/two']);
    expect(adapter).toHaveBeenCalledTimes(4);
    expect(localStorage.getItem('access_token')).toBe('rotated-access');
    expect(localStorage.getItem('refresh_token')).toBe('rotated-refresh');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      access: 'rotated-access',
      refresh: 'rotated-refresh',
    });

    unsubscribe();
  });

  test('failed refresh clears credentials and publishes one logout', async () => {
    persistSession({ access: 'expired-access', refresh: 'invalid-refresh' });
    const listener = vi.fn();
    const unsubscribe = subscribeToSession(listener);

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh rejected'));
    axiosInstance.defaults.adapter = vi.fn(unauthorized);

    await expect(axiosInstance.get('protected/')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ access: null, refresh: null });

    unsubscribe();
  });

  test('a retried request that is still unauthorized stops after one refresh', async () => {
    persistSession({ access: 'expired-access', refresh: 'valid-refresh' });
    const listener = vi.fn();
    const unsubscribe = subscribeToSession(listener);

    const refreshPost = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { access: 'new-but-rejected-access', refresh: 'rotated-refresh' },
    });
    const adapter = vi.fn(unauthorized);
    axiosInstance.defaults.adapter = adapter;

    await expect(axiosInstance.get('still-unauthorized/')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(refreshPost).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(listener).toHaveBeenNthCalledWith(1, {
      access: 'new-but-rejected-access',
      refresh: 'rotated-refresh',
    });
    expect(listener).toHaveBeenNthCalledWith(2, { access: null, refresh: null });

    unsubscribe();
  });
});
