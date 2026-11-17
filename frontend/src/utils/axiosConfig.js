import axios from 'axios';
import toast from 'react-hot-toast';

// Backend URL comes from REACT_APP_API_URL (set it on your hosting platform).
// The fallbacks keep the current Render deployment and local dev working.
export const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://mern-hsms-backend.onrender.com'
    : 'http://localhost:5000')
).replace(/\/$/, '');

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  // Free hosting can take up to a minute to wake up, so allow more than 10s
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // The public demo blocks destructive actions (see backend/middleware/demoGuard.js)
    if (error.response?.status === 403 && error.response?.data?.demo) {
      toast.error(error.response.data.message, { id: 'demo-mode' });
    }

    if (error.response?.status === 401) {
      // Clear token and redirect to login on unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

