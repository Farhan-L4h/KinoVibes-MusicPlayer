import { create } from 'zustand';
import { onAuthStateChange, getUserProfile, signOut } from '../services/supabaseAuth';

let profileReq = 0;

const gateNoticeFor = (profile) => {
  if (!profile) return 'Gagal memverifikasi status akun. Coba masuk lagi.';
  if (profile.is_banned) return 'Akun kamu dibanned. Hubungi admin untuk info lebih lanjut.';
  const status = profile.status || 'approved';
  if (status === 'rejected') return 'Pendaftaran akun kamu ditolak admin.';
  if (status !== 'approved') return 'Akun kamu menunggu persetujuan admin. Kamu bisa masuk setelah disetujui.';
  return '';
};

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  profile: null,
  gateNotice: '',

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  clearGateNotice: () => set({ gateNotice: '' }),

  refreshProfile: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    const profile = await getUserProfile(user.id);
    set({ profile });
    return profile;
  },

  initializeAuth: () => {
    return onAuthStateChange(async (user) => {
      const req = ++profileReq;
      if (!user) {
        set({ user: null, profile: null, loading: false });
        return;
      }
      set({ user, loading: false });
      const profile = await getUserProfile(user.id);
      if (req !== profileReq) return;
      const notice = gateNoticeFor(profile);
      if (notice) {
        await signOut().catch(() => {});
        if (req !== profileReq) return;
        set({ user: null, profile: null, gateNotice: notice });
        return;
      }
      set({ profile });
    });
  },

  logout: () => set({ user: null, profile: null })
}));

export const selectIsAdmin = (s) => s.profile?.role === 'admin' || s.profile?.role === 'superadmin';
export const selectIsSuperadmin = (s) => s.profile?.role === 'superadmin';