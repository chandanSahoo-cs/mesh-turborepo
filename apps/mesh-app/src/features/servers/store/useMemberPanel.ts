import { create } from "zustand";

interface PanelStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useMemberPanel = create<PanelStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
