import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./api";
import { asyncStore } from "@/helper/async.storage.helper";
import { ACCESS_TOKEN_KEY } from "@/constants";
import { Alert } from 'react-native';
import { DocumentFormData } from "@/types/form";

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
    enabled: !!id,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const accessToken = await asyncStore.getItem(ACCESS_TOKEN_KEY);      
      try {
        const response = await api.post('/document', formData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          
        });
        
        return response.data;
      } catch (error: any) {
        console.error("API request error:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
          throw new Error(error.response?.data?.message || "Failed to upload documents");
        }
        throw error;
      }
    },
    onError: (error: any) => {
      console.error("Error creating document:", error);
      Alert.alert(
        "Document Upload Failed", 
        error.message || "Failed to upload documents. Please try again."
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      Alert.alert(
        "Success",
        "Your documents have been submitted successfully and are pending review."
      );
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
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      console.error("Error updating document:", error);
      Alert.alert(
        "Update Failed", 
        error.message || "Failed to update document. Please try again."
      );
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
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      console.error("Error deleting document:", error);
      Alert.alert(
        "Deletion Failed", 
        error.message || "Failed to delete document. Please try again."
      );
    },
  });
};