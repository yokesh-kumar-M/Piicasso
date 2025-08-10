import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/';

const axiosInstance = axios.create({
  baseURL,
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
    const originalRequest = err.config;
    if (!originalRequest) return Promise.reject(err);

    if (err.response && err.response.status === 401 && !originalRequest._retry) {
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
        axios.post(`${baseURL}token/refresh/`, { refresh })
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
            reject(error);
          })
          .finally(() => { isRefreshing = false; });
      });
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
