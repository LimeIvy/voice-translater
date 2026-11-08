import { create } from "zustand";
import { createJSONStorage, persist } from
  "zustand/middleware";

import type { SpeechLanguageCode } from "@/common/data/speechLanguages";

  type LanguageStore = {
    sourceLanguage: SpeechLanguageCode;
    targetLanguage: SpeechLanguageCode;
    setSourceLanguage: (language: SpeechLanguageCode)
    => void;
    setTargetLanguage: (language: SpeechLanguageCode)
    => void;
  };

  export const useLanguageStore =
  create<LanguageStore>()(
    persist(
      (set) => ({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",

        setSourceLanguage: (sourceLanguage) => {
          set({ sourceLanguage });
        },

        setTargetLanguage: (targetLanguage) => {
          set({ targetLanguage });
        },
      }),
      {
        name: "language-settings",
        storage: createJSONStorage(() =>
        localStorage),
      },
    ),
  );