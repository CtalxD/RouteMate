import axios from 'axios';
import { ACCESS_TOKEN_KEY, API_URL, REFRESH_TOKEN_KEY } from '@/constants';
import { asyncStore } from '@/helper/async.storage.helper';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    
  },
});

// Request interceptor - Add access token to requests
api.interceptors.request.use(async (config) => {
  const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await asyncStore.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error('Invalid Email or Password');

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, newRefreshToken } = response.data;

        // Store new tokens
        await asyncStore.setItem(ACCESS_TOKEN_KEY, accessToken);
        await asyncStore.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        await asyncStore.deleteItem();
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
