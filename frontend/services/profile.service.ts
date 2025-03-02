import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import {asyncStore  } from '@/helper/async.storage.helper';  // Add this import
import { ACCESS_TOKEN_KEY } from '@/constants';

interface ProfileData {
  firstName: string;
  age:Number,
  lastName:string,
  email: string;
  profilePic?: string;
}

export const useGetProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
        const response = await api.get('/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log(response)
        return response.data.data as ProfileData;
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized access. Please login again.');
        }
        throw error;
      }
    },
  });
};

export interface UpdateProfileData {
  firstName: string;
  lastName:string;
  profilePic?: string | null;  // Make profilePic optional
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
      const response = await api.put('/profile', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onError: (error: any) => {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};