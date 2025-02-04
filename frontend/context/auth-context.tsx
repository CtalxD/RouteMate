import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/services/api';
import { asyncStore } from '@/helper/async.storage.helper';
import type { ErrorResponse, LoginFormData, LoginResponse } from '@/types/form';
import { ACCESS_TOKEN_KEY, API_URL, REFRESH_TOKEN_KEY } from '@/constants';
import axios, { type AxiosError } from 'axios';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  authenticated: boolean;
}

interface AuthProps {
  authState: AuthState;
  onLogin: (data: LoginFormData) => Promise<LoginResponse | ErrorResponse>;
  onLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    authenticated: false,
  });

  const refreshAccessToken = async () => {
    try {
      const currentRefreshToken = await asyncStore.getItem(REFRESH_TOKEN_KEY);
      if (!currentRefreshToken) throw new Error('No refresh token');

      const response = await api.post<{ accessToken: string; refreshToken: string }>(`${API_URL}/refresh-token`, {
        refreshToken: currentRefreshToken
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      await Promise.all([
        asyncStore.setItem(ACCESS_TOKEN_KEY, newAccessToken),
        asyncStore.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
      ]);

      axios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      
      setAuthState(prev => ({ 
        ...prev, 
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }));

      return newAccessToken;
    } catch (error) {
      await logout();
      throw error;
    }
  };

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const [accessToken, refreshToken] = await Promise.all([
          asyncStore.getItem(ACCESS_TOKEN_KEY),
          asyncStore.getItem(REFRESH_TOKEN_KEY),
        ]);

        if (accessToken && refreshToken) {
          axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          setAuthState({
            authenticated: true,
            accessToken,
            refreshToken,
          });
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
      }
    };
    loadTokens();
  }, []);

  const login = async (data: LoginFormData): Promise<LoginResponse | ErrorResponse> => {
    try {
      const result = await api.post<LoginResponse>(`${API_URL}/login`, data);
      const { accessToken, refreshToken,  } = result.data;

      await Promise.all([
        asyncStore.setItem(ACCESS_TOKEN_KEY, accessToken),
        asyncStore.setItem(REFRESH_TOKEN_KEY, refreshToken)
      ]);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setAuthState({ 
        authenticated: true, 
        accessToken, 
        refreshToken,
      });

      return result.data;
    } catch (e) {
      const error = e as AxiosError<ErrorResponse>;
      return { 
        error: true, 
        msg: error.message || 'An unknown error occurred' 
      };
    }
  };

  const logout = async () => {
    try {
      await asyncStore.deleteItem();
      axios.defaults.headers.common.Authorization = '';
      setAuthState({ 
        authenticated: false, 
        accessToken: null, 
        refreshToken: null 
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        onLogin: login,
        onLogout: logout,
        authState,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
