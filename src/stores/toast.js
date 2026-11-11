import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set) => ({
  toasts: [],
  push: (message, tone = 'green', timeout = 3500) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    if (timeout > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, timeout);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg) => useToastStore.getState().push(msg, 'green'),
  error: (msg) => useToastStore.getState().push(msg, 'red', 5000),
  info: (msg) => useToastStore.getState().push(msg, 'blue'),
};