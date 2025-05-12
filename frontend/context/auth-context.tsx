import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/services/api';
import { asyncStore } from '@/helper/async.storage.helper';
import type { ErrorResponse, LoginFormData, LoginResponse } from '@/types/form';
import { ACCESS_TOKEN_KEY, API_URL, REFRESH_TOKEN_KEY } from '@/constants';
import axios, { type AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  age?: number;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  authenticated: boolean;
  user: User | null;
}

interface AuthProps {
  authState: AuthState;
  user: User | null;
  onLogin: (data: LoginFormData) => Promise<LoginResponse | ErrorResponse>;
  onLogout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    authenticated: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshAccessToken = async () => {
    try {
      setIsLoading(true);
      const currentRefreshToken = await asyncStore.getItem(REFRESH_TOKEN_KEY);
      if (!currentRefreshToken) throw new Error('Invalid Email or Password');

      const response = await api.post<{ accessToken: string; refreshToken: string }>(
        `${API_URL}/refresh-token`,
        { refreshToken: currentRefreshToken }
      );

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoading(true);
        const [accessToken, refreshToken, userData] = await Promise.all([
          asyncStore.getItem(ACCESS_TOKEN_KEY),
          asyncStore.getItem(REFRESH_TOKEN_KEY),
          asyncStore.getItem('user_data'),
        ]);

        if (accessToken && refreshToken) {
          axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          
          let user = null;
          if (userData) {
            try {
              user = JSON.parse(userData);
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }
          
          setAuthState({
            authenticated: true,
            accessToken,
            refreshToken,
            user,
          });
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTokens();
  }, []);

  const login = async (data: LoginFormData): Promise<LoginResponse | ErrorResponse> => {
    try {
      const result = await api.post<LoginResponse>(`${API_URL}/login`, data);
      const { accessToken, refreshToken } = result.data;

      let user = null;
      if ('user' in result.data) {
        user = (result.data as any).user;
      } else {
        try {
          axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        } catch (userError) {
          console.error("Error fetching user data:", userError);
        }
      }

      await Promise.all([
        asyncStore.setItem(ACCESS_TOKEN_KEY, accessToken),
        asyncStore.setItem(REFRESH_TOKEN_KEY, refreshToken),
        user ? asyncStore.setItem('user_data', JSON.stringify(user)) : Promise.resolve()
      ]);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      setAuthState({ 
        authenticated: true, 
        accessToken, 
        refreshToken,
        user,
      });

      return result.data;
    } catch (e) {
      const error = e as AxiosError<ErrorResponse>;
      let errorMessage = error.message || 'An unknown error occurred';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (error.response.data?.msg) {
          errorMessage = error.response.data.msg;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid request data";
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again later";
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your connection";
      }
      
      return { 
        error: true, 
        msg: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await asyncStore.deleteItem();
      axios.defaults.headers.common.Authorization = '';
      setAuthState({ 
        authenticated: false, 
        accessToken: null, 
        refreshToken: null,
        user: null,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        onLogin: login,
        onLogout: logout,
        authState,
        user: authState.user,
        isLoading,
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