import {create} from "zustand"

interface ModalStore {
    isOpen: boolean;
    setIsOpen: (isOpen:boolean) => void;
} 

export const useCreateServerModal = create<ModalStore>((set)=>({
    isOpen: false,
    setIsOpen : (isOpen) => set({isOpen})
}));