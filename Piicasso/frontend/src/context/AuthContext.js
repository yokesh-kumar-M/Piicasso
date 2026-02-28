import { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';

export const AuthContext = createContext();

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({ username: decoded.username, is_superuser: decoded.is_superuser });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
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
          return { lat: data.latitude, lng: data.longitude };
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
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return { lat: null, lng: null };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const { lat, lng } = await getLocationData();
      const res = await axiosInstance.post('auth/google/', { token: googleToken, lat, lng });
      const access = res.data.access;
      const refresh = res.data.refresh;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);

      // Decode and set user immediately
      const decoded = parseJwt(access);
      if (decoded) {
        // Handle extra fields if backend returns them in JWT, or just stick to username/superuser
        // Backend now returns them directly in response too, but decoding token is safer source of truth for auth state
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
      const { lat, lng } = await getLocationData();
      const res = await axiosInstance.post('token/', { username, password, lat, lng });
      const access = res.data.access;
      const refresh = res.data.refresh;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);

      // Decode and set user immediately
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
    <AuthContext.Provider value={{ token, user, loading, isAuthenticated: !!token, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
