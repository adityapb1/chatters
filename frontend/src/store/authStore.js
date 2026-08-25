import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true // Important for HttpOnly cookies
});

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isCheckingAuth: true,

  login: async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      set({ user: res.data.user, isAuthenticated: true, error: null });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Login failed' });
      return false;
    }
  },

  register: async (username, password, display_name) => {
    try {
      const res = await api.post('/auth/register', { username, password, display_name });
      set({ user: res.data.user, isAuthenticated: true, error: null });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Registration failed' });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error(error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await api.put('/users/profile', data);
      set({ user: res.data });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Update failed' };
    }
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch (err) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  }
}));

export { useAuthStore, api };
