import {create} from "zustand"

interface ModalStore {
    isOpen: boolean;
    setIsOpen: (isOpen:boolean) => void;
} 

export const useCreateChannelModal = create<ModalStore>((set)=>({
    isOpen: false,
    setIsOpen : (isOpen) => set({isOpen})
}));