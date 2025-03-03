import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./api";
import { DocumentFormData } from "@/types/form";
import { asyncStore } from "@/helper/async.storage.helper";
import { ACCESS_TOKEN_KEY } from "@/constants";

export const useFetchDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      try {
        const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
        const response = await api.get('/document', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return response.data.data as DocumentFormData[];
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized access. Please login again.');
        }
        throw error;
      }
    },
  });
};

// Fetch a single document by ID
export const useFetchDocument = (id: number) => {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: async () => {
      try {
        const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
        const response = await api.get(`/document/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return response.data.data as DocumentFormData;
      } catch (error: any) {
        if (error.response?.status === 401) {
          throw new Error('Unauthorized access. Please login again.');
        }
        throw error;
      }
    },
    enabled: !!id, // Prevent query from running if `id` is undefined or null
  });
};

// Create a new document
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: DocumentFormData) => {
      const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
      const response = await api.post('/document', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onError: (error: any) => {
      console.error("Error creating document:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] }); // Consistent query key
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<DocumentFormData> }) => {
      const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
      const response = await api.put(`/document/${id}`, updates, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] }); // Consistent query key
    },
    onError: (error: any) => {
      console.error("Error updating document:", error);
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);
      await api.delete(`/document/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] }); // Consistent query key
    },
    onError: (error: any) => {
      console.error("Error deleting document:", error);
    },
  });
};