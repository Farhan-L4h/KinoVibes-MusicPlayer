import { create } from 'zustand';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user) => 
    set({ 
      user, 
      isAuthenticated: !!user, 
      loading: false 
    }),

  setLoading: (loading) => set({ loading }),

  initializeAuth: () => {
    return onAuthStateChanged(auth, (user) => {
      set({ 
        user, 
        isAuthenticated: !!user, 
        loading: false 
      });
    });
  },

  logout: () => 
    set({ 
      user: null, 
      isAuthenticated: false, 
      loading: false 
    })
}));