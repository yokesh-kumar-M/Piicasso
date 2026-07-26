import { createContext, useEffect, useState } from 'react';
import axiosInstance, {
  clearSession,
  persistSession,
  readSession,
  refreshSession,
  subscribeToSession,
} from '../api/axios';

export const AuthContext = createContext();

const parseJwt = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

/**
 * Check if a JWT token is expired or about to expire (within 30s buffer).
 * Returns true if the token is still valid.
 */
const isTokenValid = (token) => {
  if (!token) return false;
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return false;
  return decoded.exp > Date.now() / 1000 + 30;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const stored = readSession().access;
    return stored && isTokenValid(stored) ? stored : null;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interceptor and login refreshes flow through this subscription so React
  // never keeps an expired access token after storage has already rotated.
  useEffect(
    () =>
      subscribeToSession(({ access }) => {
        setToken(access && isTokenValid(access) ? access : null);
        if (!access) setUser(null);
      }),
    [],
  );

  // A refresh token alone is enough to restore a session. refreshSession is
  // shared with the Axios interceptor and single-flight under StrictMode or
  // concurrent 401 responses.
  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      const session = readSession();
      if (session.access && isTokenValid(session.access)) {
        persistSession(session);
      } else if (session.refresh) {
        try {
          await refreshSession();
        } catch {
          // refreshSession clears credentials and notifies this provider.
        }
      } else {
        clearSession();
      }

      if (!cancelled) setLoading(false);
    };

    bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Claims provide an immediate identity; the canonical profile response then
  // enriches it. Stale responses after logout/rotation are ignored.
  useEffect(() => {
    if (!token || !isTokenValid(token)) {
      setUser(null);
      return undefined;
    }

    let cancelled = false;
    const decoded = parseJwt(token);
    if (decoded) {
      setUser({ username: decoded.username, is_superuser: decoded.is_superuser });
    }

    axiosInstance
      .get('profile/')
      .then((res) => {
        if (!cancelled) {
          setUser((current) => ({
            ...current,
            ...res.data,
            username: res.data.username || current?.username,
            is_superuser: res.data.is_superuser ?? current?.is_superuser,
          }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token]);

  const getLocationData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const ipRes = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (ipRes.ok) {
        const data = await ipRes.json();
        if (data.latitude && data.longitude) {
          return {
            lat: data.latitude,
            lng: data.longitude,
            city: data.city || 'Unknown',
            country_code: data.country_code || 'UNK',
          };
        }
      }
    } catch (error) {
      console.warn('IP Location fallback, trying browser geolocation', error);
    }

    try {
      const pos = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Location prompt timeout')), 3000);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timer);
            resolve(position);
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          },
          { timeout: 3000, maximumAge: 10000 },
        );
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        city: 'Unknown',
        country_code: 'UNK',
      };
    } catch {
      return { lat: null, lng: null, city: 'Unknown', country_code: 'UNK' };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const { lat, lng, city, country_code } = await getLocationData();
      const res = await axiosInstance.post(
        'user/auth/google/',
        {
          token: googleToken,
          lat,
          lng,
          city,
          country_code,
        },
        { skipAuthRefresh: true },
      );
      const session = persistSession({
        access: res.data.access,
        refresh: res.data.refresh,
      });

      const decoded = parseJwt(session.access);
      if (decoded) {
        setUser({ username: decoded.username, is_superuser: decoded.is_superuser });
      }
      return { success: true };
    } catch (error) {
      console.error('Google Login error:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  };

  const login = async (username, password) => {
    try {
      const { lat, lng, city, country_code } = await getLocationData();
      const res = await axiosInstance.post(
        'user/token/',
        {
          username,
          password,
          lat,
          lng,
          city,
          country_code,
        },
        { skipAuthRefresh: true },
      );
      const session = persistSession({
        access: res.data.access,
        refresh: res.data.refresh,
      });

      const decoded = parseJwt(session.access);
      if (decoded) {
        setUser({ username: decoded.username, is_superuser: decoded.is_superuser });
      }
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.error || error.message,
      };
    }
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token && isTokenValid(token),
        login,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
