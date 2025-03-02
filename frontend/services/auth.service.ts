import { useMutation } from '@tanstack/react-query';
import api from './api';
import { RegisterFormData } from '@/types/form';

// API functions
export const signUp = async (credentials: RegisterFormData) => {
  const response = await api.post('/register', credentials);
  return response.data;
};

// React Query mutation hooks
export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      console.log('Signup successful:', data);
    },
    onError: (error) => {
      console.error('Signup failed:', error);
    },
  });
};
