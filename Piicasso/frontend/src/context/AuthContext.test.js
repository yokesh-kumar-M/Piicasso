import axios from 'axios';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import axiosInstance, { clearSession, persistSession } from '../api/axios';
import { AuthContext, AuthProvider } from './AuthContext';

const originalAdapter = axiosInstance.defaults.adapter;

const makeToken = (username) => {
  const payload = btoa(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 3600,
      is_superuser: false,
      username,
    }),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.signature`;
};

const response = (config, data = {}) =>
  Promise.resolve({
    config,
    data,
    headers: {},
    status: 200,
    statusText: 'OK',
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

const SessionProbe = () => {
  const { isAuthenticated, loading, token } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="token">{token || 'signed-out'}</span>
    </div>
  );
};

describe('AuthProvider session synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    delete axiosInstance.defaults.headers.common.Authorization;
    axiosInstance.defaults.adapter = (config) =>
      response(config, { email: 'operator@example.com', username: 'operator' });
  });

  afterEach(() => {
    cleanup();
    clearSession();
    axiosInstance.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  test('restores a refresh-only startup and persists both rotated tokens', async () => {
    const access = makeToken('restored-user');
    localStorage.setItem('refresh_token', 'startup-refresh');
    const refreshPost = vi
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: { access, refresh: 'startup-rotated-refresh' } });

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('token')).toHaveTextContent(access);
    expect(refreshPost).toHaveBeenCalledTimes(1);
    expect(refreshPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/user\/token\/refresh\/$/),
      {
        refresh: 'startup-refresh',
      },
    );
    expect(localStorage.getItem('access_token')).toBe(access);
    expect(localStorage.getItem('refresh_token')).toBe('startup-rotated-refresh');
  });

  test('updates React state when an interceptor rotates the session', async () => {
    const oldAccess = makeToken('old-user');
    const newAccess = makeToken('rotated-user');
    persistSession({ access: oldAccess, refresh: 'old-refresh' });
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { access: newAccess, refresh: 'new-refresh' },
    });

    axiosInstance.defaults.adapter = (config) => {
      if (config.url === 'profile/' || config._retry) return response(config, { ok: true });
      return unauthorized(config);
    };

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      await axiosInstance.get('protected/');
    });

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent(newAccess));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
  });

  test('logs the provider out after a failed interceptor refresh', async () => {
    const access = makeToken('expired-user');
    persistSession({ access, refresh: 'invalid-refresh' });
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh rejected'));

    axiosInstance.defaults.adapter = (config) => {
      if (config.url === 'profile/') return response(config, { username: 'expired-user' });
      return unauthorized(config);
    };

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      await expect(axiosInstance.get('protected/')).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('signed-out'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
