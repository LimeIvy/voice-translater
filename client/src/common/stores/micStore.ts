import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type MicStore = {
  micDeviceId: string;
  setMicDeviceId: (micDeviceId: string) => void;
  clearMicDeviceId: () => void;
};

export const useMicStore = create<MicStore>()(
  persist(
    (set) => ({
      micDeviceId: "",

      setMicDeviceId: (micDeviceId) => {
        set({ micDeviceId });
      },

      clearMicDeviceId: () => {
        set({ micDeviceId: "" });
      },
    }),
    {
      name: "mic-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        micDeviceId: state.micDeviceId,
      }),
    },
  ),
);
