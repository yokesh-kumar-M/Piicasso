import axios from 'axios';

// Use the configured API URL while keeping local development on the Vite/Nginx
// /api proxy. Normalising the trailing slash prevents refresh URLs such as
// ".../apiuser/token/refresh/" when an environment value omits it.
const configuredBaseURL = process.env.REACT_APP_API_URL || '/api/';
const defaultBaseURL = configuredBaseURL.endsWith('/')
  ? configuredBaseURL
  : `${configuredBaseURL}/`;

const axiosInstance = axios.create({
  baseURL: defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const sessionListeners = new Set();
let refreshPromise = null;

const notifySessionListeners = (session) => {
  sessionListeners.forEach((listener) => listener(session));
};

/** Read the current browser session without caching stale token values. */
export const readSession = () => ({
  access: localStorage.getItem('access_token'),
  refresh: localStorage.getItem('refresh_token'),
});

/**
 * Persist an access/refresh pair and synchronously notify React consumers.
 * Refresh-token rotation is optional in SimpleJWT responses, so callers may
 * omit `refresh` to retain the currently stored token.
 */
export const persistSession = ({ access, refresh }) => {
  if (!access) {
    throw new Error('Token response did not include an access token.');
  }

  const current = readSession();
  const next = {
    access,
    refresh: refresh || current.refresh || null,
  };

  localStorage.setItem('access_token', next.access);
  if (next.refresh) {
    localStorage.setItem('refresh_token', next.refresh);
  } else {
    localStorage.removeItem('refresh_token');
  }

  axiosInstance.defaults.headers.common.Authorization = `Bearer ${next.access}`;
  notifySessionListeners(next);
  return next;
};

/** Clear credentials and notify every mounted auth provider. */
export const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  delete axiosInstance.defaults.headers.common.Authorization;
  notifySessionListeners({ access: null, refresh: null });
};

/** Subscribe to token changes made by login, startup refresh, or interceptors. */
export const subscribeToSession = (listener) => {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
};

/**
 * Refresh the browser session through one shared in-flight promise.
 *
 * Auth bootstrap and every concurrent 401 call this same function, ensuring a
 * rotating refresh token is submitted exactly once. Both tokens from the
 * response are committed atomically before callers retry their requests.
 */
export const refreshSession = () => {
  if (refreshPromise) return refreshPromise;

  const { refresh } = readSession();
  if (!refresh) {
    clearSession();
    return Promise.reject(new Error('No refresh token is available.'));
  }

  refreshPromise = axios
    .post(`${defaultBaseURL}user/token/refresh/`, { refresh })
    .then(({ data }) => persistSession({ access: data?.access, refresh: data?.refresh || refresh }))
    .catch((error) => {
      clearSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// Always attach the latest access token rather than a value captured when the
// module or AuthProvider first mounted.
axiosInstance.interceptors.request.use(
  (config) => {
    const { access } = readSession();
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const errorMsg = error.response?.data?.detail || error.response?.data?.error;
    const errorCode = error.response?.data?.code;

    if (
      errorMsg === 'Your account has been suspended due to a policy violation' ||
      errorCode === 'user_inactive' ||
      errorMsg === 'User is inactive'
    ) {
      clearSession();
      alert('Your account has been suspended due to a policy violation. Please contact support.');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401 || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // A request that still receives 401 after one refreshed retry must not
    // recurse. Treat the refreshed session as invalid and log out cleanly.
    if (originalRequest._retry) {
      clearSession();
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      const session = await refreshSession();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${session.access}`;
      return axiosInstance(originalRequest);
    } catch {
      // refreshSession owns credential cleanup and session notification.
      return Promise.reject(error);
    }
  },
);

export default axiosInstance;
