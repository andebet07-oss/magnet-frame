import { create } from 'zustand';

const TOAST_MS = 5000;
let nextId = 1;

export const useToasts = create((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Show a short Hebrew message to the user. `tone`: 'error' | 'info'. */
export function notify(message, tone = 'error') {
  const id = nextId++;
  useToasts.setState((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
  setTimeout(() => useToasts.getState().dismiss(id), TOAST_MS);
}
