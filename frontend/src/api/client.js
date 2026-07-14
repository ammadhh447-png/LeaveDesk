import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    const headers = { ...config.headers };
    delete headers['Content-Type'];
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthAttempt = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/signup');

    const responseData = error.response?.data;
    let message = typeof responseData === 'string'
      ? responseData
      : responseData?.message;

    if (!message) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        message = 'Cannot reach the server. Run the backend (npm run dev in backend/) and open the app at http://localhost:5173.';
      } else if (status === 502 || status === 503) {
        message = 'Backend is unavailable. Start it with npm run dev in the backend folder.';
      } else if (status) {
        message = `Request failed (${status}). Check that both frontend and backend are running.`;
      } else if (error.message) {
        message = error.message;
      } else {
        message = 'Login failed. Please try again.';
      }
    }

    if (status === 401 && onUnauthorized && !isAuthAttempt) {
      onUnauthorized(message);
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
