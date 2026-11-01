// Editor state: the open template (with undo history), the selection and the zoom.
import { create } from 'zustand';
import { commit, initHistory, redo, undo } from './history';
import { removeElement, reorderElement, updateElement } from '@/model/elements';

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 8;

export const useEditor = create((set, get) => ({
  history: null,
  selectedId: null,
  zoom: 1, // 1 = the whole frame fits the canvas area

  open: (doc) => set({ history: initHistory(doc), selectedId: null, zoom: 1 }),
  close: () => set({ history: null, selectedId: null }),

  /** Apply `updater(doc) → doc` as one undo step (or merge into the last step with the same key). */
  change: (updater, key = null) =>
    set((s) => ({ history: commit(s.history, updater(s.history.present), { key }) })),

  updateElement: (id, patch, key = null) =>
    get().change((doc) => ({ ...doc, elements: updateElement(doc.elements, id, patch) }), key),

  addElement: (el) => {
    get().change((doc) => ({ ...doc, elements: [...doc.elements, el] }));
    set({ selectedId: el.id });
  },

  removeElement: (id) => {
    get().change((doc) => ({ ...doc, elements: removeElement(doc.elements, id) }));
    if (get().selectedId === id) set({ selectedId: null });
  },

  reorderElement: (id, beforeIndex) =>
    get().change((doc) => {
      const elements = reorderElement(doc.elements, id, beforeIndex);
      return elements === doc.elements ? doc : { ...doc, elements };
    }),

  select: (id) => set({ selectedId: id }),
  undo: () => set((s) => ({ history: undo(s.history) })),
  redo: () => set((s) => ({ history: redo(s.history) })),
  setZoom: (zoom) => set({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) }),
}));

export const useDoc = () => useEditor((s) => s.history?.present ?? null);

export const useSelected = () =>
  useEditor((s) => s.history?.present.elements.find((el) => el.id === s.selectedId) ?? null);

export const selectedOf = (state) =>
  state.history?.present.elements.find((el) => el.id === state.selectedId) ?? null;
