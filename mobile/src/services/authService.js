import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('authToken', access_token);
      
      return { success: true, token: access_token };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  async register(email, password, name) {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('authToken', access_token);
      
      return { success: true, token: access_token };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  },

  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Logout failed' };
    }
  },

  async getStoredToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  },

  async isAuthenticated() {
    const token = await this.getStoredToken();
    return !!token;
  }
};
