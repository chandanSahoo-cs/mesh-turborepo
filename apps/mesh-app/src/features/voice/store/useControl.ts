import { create } from "zustand";

interface Control {
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

export const useVoiceRoom = create<Control>((set) => ({
  isActive: false,
  setIsActive: (isActive) => set({ isActive }),
}));
