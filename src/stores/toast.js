import { create } from 'zustand';

let nextId = 1;
const timers = new Map();

const arm = (id, timeout) => {
  if (timeout <= 0) return;
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => {
    timers.delete(id);
    useToastStore.getState().dismiss(id);
  }, timeout));
};

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (message, tone = 'green', timeout = 3500) => {
    // Auto-skip chains fire the same error per track; refresh one toast
    // instead of stacking identical copies.
    const existing = get().toasts.find((t) => t.message === message && t.tone === tone);
    if (existing) {
      arm(existing.id, timeout);
      return existing.id;
    }
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    arm(id, timeout);
    return id;
  },
  dismiss: (id) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (msg) => useToastStore.getState().push(msg, 'green'),
  error: (msg) => useToastStore.getState().push(msg, 'red', 5000),
  info: (msg) => useToastStore.getState().push(msg, 'blue'),
};