import { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define logout first to avoid circular dependency
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setUserProfile(null);
  }, []);

  // Fetch user profile with email verification status
  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get('/profile/');
      setUserProfile(response.data);
      setUser({
        username: response.data.username,
        email: response.data.email,
        emailVerified: response.data.email_verified,
        emailVerifiedAt: response.data.email_verified_at,
        dateJoined: response.data.date_joined
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // If unauthorized, clear tokens
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]); // Now logout is properly included

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (username, password) => {
    try {
      const res = await axiosInstance.post('/login/', { username, password });
      const access = res.data.access;
      const refresh = res.data.refresh;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Fetch user profile after successful login
      await fetchUserProfile();
      
      return { success: true };
    } catch (e) {
      return { 
        success: false, 
        error: e.response?.data?.error || e.response?.data?.details?.message || e.message,
        emailNotVerified: e.response?.data?.details?.email_not_verified || false,
        email: e.response?.data?.details?.email
      };
    }
  };

  const refreshUserProfile = useCallback(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile]);

  // Check if user is authenticated and email is verified
  const isFullyAuthenticated = useCallback(() => {
    return !!token && user?.emailVerified;
  }, [token, user?.emailVerified]);

  // Check if user needs email verification
  const needsEmailVerification = useCallback(() => {
    return !!token && user && !user.emailVerified;
  }, [token, user]);

  const value = {
    token,
    user,
    userProfile,
    loading,
    isAuthenticated: !!token,
    isEmailVerified: user?.emailVerified || false,
    isFullyAuthenticated: isFullyAuthenticated(),
    needsEmailVerification: needsEmailVerification(),
    login,
    logout,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};