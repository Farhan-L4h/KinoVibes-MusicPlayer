import { create } from 'zustand';
import { onAuthStateChange } from '../services/auth';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  
  initializeAuth: () => {
    return onAuthStateChange((user) => {
      set({ user, loading: false });
    });
  },
  
  logout: () => set({ user: null })
}));