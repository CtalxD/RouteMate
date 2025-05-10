import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/services/api';
import { asyncStore } from '@/helper/async.storage.helper';
import type { ErrorResponse, LoginFormData, LoginResponse } from '@/types/form';
import { ACCESS_TOKEN_KEY, API_URL, REFRESH_TOKEN_KEY } from '@/constants';
import axios, { type AxiosError } from 'axios';

// Add User interface definition
interface User {
  id: string;
  // Add other user properties as needed
}

// Update the LoginResponse type to include user information
// Note: This is assuming you can modify the types. If not, you'll need to handle this differently
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  authenticated: boolean;
  user: User | null; // Add user to AuthState
}

interface AuthProps {
  authState: AuthState;
  user: User | null; // Add user property to AuthProps for easier access
  onLogin: (data: LoginFormData) => Promise<LoginResponse | ErrorResponse>;
  onLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    authenticated: false,
    user: null, // Initialize user as null
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
        const [accessToken, refreshToken, userData] = await Promise.all([
          asyncStore.getItem(ACCESS_TOKEN_KEY),
          asyncStore.getItem(REFRESH_TOKEN_KEY),
          asyncStore.getItem('user_data'), // Assuming user data is stored with this key
        ]);

        if (accessToken && refreshToken) {
          axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          
          // Parse user data if available
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
      }
    };
    loadTokens();
  }, []);

  const login = async (data: LoginFormData): Promise<LoginResponse | ErrorResponse> => {
    try {
      const result = await api.post<LoginResponse>(`${API_URL}/login`, data);
      const { accessToken, refreshToken } = result.data;

      // Extract user data from the response if available, or fetch it separately
      let user = null;
      if ('user' in result.data) {
        // If the API returns user info directly
        user = (result.data as any).user;
      } else {
        // If we need to fetch user info separately
        try {
          // Set auth token first
          axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          // Then fetch user profile
          const userResponse = await api.get(`${API_URL}/me`);
          user = userResponse.data;
        } catch (userError) {
          console.error("Error fetching user data:", userError);
        }
      }

      // Store auth tokens and user data
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
        refreshToken: null,
        user: null,
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
        user: authState.user, // Expose user directly from authState
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