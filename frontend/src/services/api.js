import axios from 'axios';
import { expireSession, hasUsableSession, readStoredUser } from './session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

const isAuthCall = (config) =>
  ['/staff/login/', '/staff/token/refresh/', '/staff/invite/'].some((path) => config?.url?.includes(path));

api.interceptors.request.use((config) => {
  if (!isAuthCall(config) && readStoredUser() && !hasUsableSession()) {
    expireSession();
    return Promise.reject(new axios.Cancel('Session expired'));
  }
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

function refreshAccessToken(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/staff/token/refresh/`, { refresh: refreshToken })
      .then(({ data }) => {
        localStorage.setItem('access_token', data.access);
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthCall(originalRequest)) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      expireSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccess = await refreshAccessToken(refreshToken);
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Only a rejected refresh token ends the session; a network blip or server error should not log anyone out.
      const refreshStatus = refreshError?.response?.status;
      if (refreshStatus === 401 || refreshStatus === 400) {
        expireSession();
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
