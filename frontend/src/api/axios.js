import axios from 'axios';

// Create an Axios instance
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor — add Authorization token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token'); // ✅ CORRECT KEY
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor — handle expired or invalid token
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token'); // Clear token
      localStorage.removeItem('refresh_token');
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default instance;
