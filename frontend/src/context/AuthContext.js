// src/context/AuthContext.js
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Optionally verify token and get user info
      verifyToken();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      // You can add a token verification endpoint here
      // const response = await axios.get('http://127.0.0.1:8000/api/verify-token/');
      // setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });

      const access = response.data.access;
      
      if (access) {
        localStorage.setItem('token', access);
        setToken(access);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        return { success: true };
      } else {
        return { success: false, error: 'No access token received' };
      }

    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/register/', userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = !!token;

  const value = {
    token,
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};