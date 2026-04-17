import axios from 'axios';

// Use environment variable for API base URL with production fallback
const defaultBaseURL = process.env.REACT_APP_API_URL || '/api/';

const axiosInstance = axios.create({
  baseURL: defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    const errorMsg = err.response?.data?.detail || err.response?.data?.error;
    const errorCode = err.response?.data?.code;

    if (
      errorMsg === 'Your account has been suspended due to a policy violation' ||
      errorCode === 'user_inactive' ||
      errorMsg === 'User is inactive'
    ) {
      alert("Your account has been suspended due to a policy violation. You are being redirected to your inbox.");
      // Prevent infinite redirect loops for routes like '/inbox/'
      if (!window.location.pathname.startsWith('/inbox')) {
        window.location.href = '/inbox';
      }
      return Promise.reject(err);
    }

    const originalRequest = err.config;
    if (!originalRequest) return Promise.reject(err);

    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      // Don't retry token refresh endpoint itself
      if (originalRequest.url && originalRequest.url.includes('token/refresh')) {
        return Promise.reject(err);
      }

      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axiosInstance(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        const refreshUrl = \`\${defaultBaseURL}user/token/refresh/\`;

        axios.post(refreshUrl, { refresh })
          .then(({ data }) => {
            localStorage.setItem('access_token', data.access);
            axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + data.access;
            originalRequest.headers.Authorization = 'Bearer ' + data.access;
            processQueue(null, data.access);
            resolve(axiosInstance(originalRequest));
          })
          .catch((error) => {
            processQueue(error, null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            delete axiosInstance.defaults.headers.common['Authorization'];
            // Redirect to login to stop all polling and force re-auth
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            reject(error);
          })
          .finally(() => { isRefreshing = false; });
      });
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
