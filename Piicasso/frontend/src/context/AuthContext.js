import { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

export const AuthContext = createContext();

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
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
  // Add 30-second buffer to account for clock skew
  return decoded.exp > (Date.now() / 1000) + 30;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    // 3.2 fix: On initial load, check if stored token is still valid
    const stored = localStorage.getItem('access_token');
    if (stored && isTokenValid(stored)) {
      return stored;
    }
    // Token is expired — don't treat user as authenticated
    // We'll attempt refresh below if refresh token exists
    return null;
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attempt to refresh an expired access token using the refresh token
  const attemptTokenRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      // No refresh token, clear everything
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const defaultBaseURL = process.env.REACT_APP_API_URL || 'https://piicasso.onrender.com/api/';
      const identityBaseURL = process.env.REACT_APP_IDENTITY_API_URL || 'http://localhost:8001/api/';
      const refreshUrl = defaultBaseURL.includes('localhost:8000') 
        ? `${identityBaseURL}user/token/refresh/` 
        : `${defaultBaseURL}user/token/refresh/`;

      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        setToken(data.access);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
      } else {
        // Refresh failed — full logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({ username: decoded.username, is_superuser: decoded.is_superuser });
      }
      setLoading(false);
    } else {
      // No valid token — try refreshing
      const stored = localStorage.getItem('access_token');
      if (stored && !isTokenValid(stored)) {
        // Token exists but is expired — try refresh
        attemptTokenRefresh();
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, [token, attemptTokenRefresh]);

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
    } catch (e) {
      console.log('IP Location fallback, trying browser geolocation');
    }

    try {
      const pos = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Location prompt timeout')), 3000);
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(timer); resolve(pos); },
          (err) => { clearTimeout(timer); reject(err); },
          { timeout: 3000, maximumAge: 10000 }
        );
      });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, city: 'Unknown', country_code: 'UNK' };
    } catch {
      return { lat: null, lng: null, city: 'Unknown', country_code: 'UNK' };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const { lat, lng, city, country_code } = await getLocationData();
      const res = await axiosInstance.post('user/auth/google/', { token: googleToken, lat, lng, city, country_code });
      const access = res.data.access;
      const refresh = res.data.refresh;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);

      const decoded = parseJwt(access);
      if (decoded) {
        setUser({ username: decoded.username, is_superuser: decoded.is_superuser });
      }

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      return { success: true };
    } catch (e) {
      console.error('Google Login error:', e);
      return { success: false, error: e.response?.data?.error || e.message };
    }
  };

  const login = async (username, password) => {
    try {
      const { lat, lng, city, country_code } = await getLocationData();
      const res = await axiosInstance.post('user/token/', { username, password, lat, lng, city, country_code });
      const access = res.data.access;
      const refresh = res.data.refresh;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);

      const decoded = parseJwt(access);
      if (decoded) {
        setUser({ username: decoded.username, is_superuser: decoded.is_superuser });
      }

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      return { success: true };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: e.response?.data?.detail || e.response?.data?.error || e.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      isAuthenticated: !!token && isTokenValid(token),
      login,
      googleLogin,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
