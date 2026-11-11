import { create } from 'zustand';

const THEME_KEY = 'kv-theme';

const getInitial = () => {
  try {
    return localStorage.getItem(THEME_KEY) || 'system';
  } catch {
    return 'system';
  }
};

const applyTheme = (theme) => {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
};

const useThemeStore = create((set) => ({
  theme: getInitial(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch { /* ignore */ }
    applyTheme(theme);
    set({ theme });
  },
}));

applyTheme(useThemeStore.getState().theme);

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system');
  });
}

export { useThemeStore };