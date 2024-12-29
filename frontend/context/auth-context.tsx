import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/services/api';
import { secureStore } from '@/helper/secure.storage.helper';
import type { ErrorResponse, LoginFormData, LoginResponse } from '@/types/form';
import { ACCESS_TOKEN_KEY, API_URL, REFRESH_TOKEN_KEY } from '@/constants';
import axios, { type AxiosError } from 'axios';

interface AuthProps {
  authState: { token: string | null; authenticated: boolean | null };
  onLogin: (data: LoginFormData) => Promise<LoginResponse | ErrorResponse>;
  onLogout: () => void;
}

const AuthContext = createContext<AuthProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<{ token: string | null; authenticated: boolean }>({
    token: null,
    authenticated: false,
  });

  useEffect(() => {
    const loadTokens = async () => {
      const token = await secureStore.getItem(ACCESS_TOKEN_KEY);

      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        setAuthState({
          authenticated: true,
          token: token,
        });
      }
    };
    loadTokens();
  }, []);

  const login = async (data: LoginFormData): Promise<LoginResponse | ErrorResponse> => {
    try {
      const result = await api.post(`${API_URL}/login`, data);

      await secureStore.setItem(ACCESS_TOKEN_KEY, result.data.accessToken);
      await secureStore.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken);
      axios.defaults.headers.common.Authorization = `Bearer ${result.data.accessToken}`;
      setAuthState({ authenticated: true, token: result.data.accessToken });

      return result.data;
    } catch (e) {
      const error = e as AxiosError;
      console.error(error);
      return { error: true, msg: error.message || 'An unknown error occurred' };
    }
  };

  const logout = async () => {
    await secureStore.deleteItem(ACCESS_TOKEN_KEY);
    await secureStore.deleteItem(REFRESH_TOKEN_KEY);

    axios.defaults.headers.common.Authorization = '';
    setAuthState({ authenticated: false, token: null });
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
