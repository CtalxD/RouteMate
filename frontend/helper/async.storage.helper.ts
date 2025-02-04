import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

export const asyncStore = {
  // Corrected parameter order: key first with default, then value
  setItem: async (key: string = ACCESS_TOKEN_KEY, value: string) => {
    try {
      if (!value) {
        throw new Error('Token is required');
      }
      await AsyncStorage.setItem(key, value);
      
      // Verify by checking stored value matches input
      const storedToken = await AsyncStorage.getItem(key);
      if (storedToken !== value) {
        throw new Error('Token storage verification failed');
      }
      console.log(`Token stored successfully for ${key}`);
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      throw new Error(`Failed to store ${key}`);
    }
  },

  getItem: async (key: string = ACCESS_TOKEN_KEY) => {
    try {
      const token = await AsyncStorage.getItem(key);
      console.log(`Token ${key} retrieval:`, token ? 'success' : 'not found');
      return token;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return null;
    }
  },

  deleteItem: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY)
      ]);
      
      // Verify deletion by checking both tokens
      const [accessToken, refreshToken] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY)
      ]);
      
      if (accessToken || refreshToken) {
        throw new Error('Token deletion verification failed');
      }
      console.log('Tokens deleted successfully');
    } catch (error) {
      console.error('Failed to remove tokens:', error);
      throw new Error('Failed to remove tokens');
    }
  }
};