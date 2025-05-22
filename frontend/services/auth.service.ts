import { useMutation } from '@tanstack/react-query';
import api from './api';
import { RegisterFormData } from '@/types/form';

// API functions
export const signUp = async (credentials: RegisterFormData) => {
  try {
    const response = await api.post('/register', credentials);
    return response.data;
  } catch (error: any) {
    // Enhance error handling to properly capture and forward the backend error message
    if (error.response && error.response.data) {
      throw {
        ...error,
        message: error.response.data.message || 'Registration failed'
      };
    }
    throw error;
  }
};

// React Query mutation hooks
export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      console.log('Signup successful:', data);
    },
    onError: (error: any) => {
      console.error('Signup failed:', error);
      // Let the component handle the specific error
    },
  });
};

export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw {
        ...error,
        message: error.response.data.message || 'Login failed'
      };
    }
    throw error;
  }
};

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log('Login successful');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};