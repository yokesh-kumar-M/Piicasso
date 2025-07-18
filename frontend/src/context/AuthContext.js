import { createContext, useState, useEffect } from 'react';
import axios from '../api/axios';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
            const response = await axios.post('/api/token/', { username, password });
      const access = response.data.access;
      const refresh = response.data.refresh;

      if (access) {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setToken(access);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        return { success: true };
      } else {
        return { success: false, error: 'No access token received' };
      }
    } catch (error) {
      console.error('Login failed:', error);
            return { success: false, error: error.response?.data?.detail || error.message || 'Login failed' };
        }
    };
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
        <AuthContext.Provider value={{ token, user, loading, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
