import axios from 'axios';

// Centralized Axios API instance for Gowtham Tex
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Attach JWT Bearer token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gtex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Standardize error extraction and handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid or expired (401), clean up stored auth state
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('gtex_token');
        localStorage.removeItem('gtex_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
