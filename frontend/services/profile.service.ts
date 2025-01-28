import { useMutation, useQuery } from '@tanstack/react-query';
import api from './api';

interface ProfileData {
  fullName: string;
  email: string;
  profilePic?: string;
}

export const useGetProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await api.get('/profile');
        return response.data.user as ProfileData;
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized access. Please login again.');
        }
        throw error;
      }
    },
  });
};

interface UpdateProfileData {
  fullName: string;
  profilePic?: string | null;
}

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      try {
        let formData = new FormData();
        formData.append('fullName', data.fullName);
        
        if (data.profilePic) {
          const filename = data.profilePic.split('/').pop();
          const match = /\.(\w+)$/.exec(filename || '');
          const type = match ? `image/${match[1]}` : 'image';
          
          formData.append('profilePic', {
            uri: data.profilePic,
            name: filename,
            type,
          } as any);
        }

        const response = await api.put('/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.user;
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized access. Please login again.');
        }
        throw error;
      }
    },
  });
};
