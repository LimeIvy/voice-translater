import { create } from "zustand";

export type TranslationSegment = {
  createdAt: number;
  text: string;
  translation: string;
};

type TranslationStore = {
  segments: TranslationSegment[];
  addSegment: (text: string) => void;
  setTranslation: (index: number, translation: string) => void;
  clear: () => void;
};

export const useTranslationStore = create<TranslationStore>((set) => ({
  segments: [],
  addSegment: (text) =>
    set((state) => ({
      segments: [
        ...state.segments,
        { text, translation: "", createdAt: Date.now() },
      ],
    })),
  setTranslation: (index, translation) => set((state) => ({
    segments: state.segments.map((segment, i) =>
      i === index ? { ...segment, translation } : segment,
    ),
  })),
  clear: () => set({ segments: [] }),
}));
