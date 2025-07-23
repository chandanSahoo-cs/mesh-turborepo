import { create } from "zustand";

interface VoiceRoom {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useVoiceRoom = create<VoiceRoom>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
