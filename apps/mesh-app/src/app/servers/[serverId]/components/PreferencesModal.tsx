"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDeleteServer } from "@/features/servers/api/useDeleteServer";
import { useRenameServer } from "@/features/servers/api/useRenameServer";
import { useConfirm } from "@/hooks/useConfirm";
import { useServerId } from "@/hooks/useServerId";
import { errorToast, successToast } from "@/lib/toast";
import { DialogClose } from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PreferencesModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialValue: string;
}

export const PreferencesModal = ({
  open,
  setOpen,
  initialValue,
}: PreferencesModalProps) => {
  const serverId = useServerId();
  const [value, setValue] = useState(initialValue);
  const [editOpen, setEditOpen] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action is irreversible"
  );

  const router = useRouter();

  const { renameServer, isPending: isUpdatingWorkspace } = useRenameServer();
  const { deleteServer, isPending: isDeletingWorkspace } = useDeleteServer();

  const handleRename = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    renameServer(
      {
        serverId: serverId,
        name: value,
      },
      {
        onSuccess: () => {
          successToast("Renamed Server");
          setEditOpen(false);
        },
        onError: () => {
          errorToast("Failed to rename workspace");
        },
      }
    );
  };

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;
    deleteServer(
      {
        serverId: serverId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          router.replace("/");
          successToast("Server Deleted");
        },
        onError: () => {
          errorToast("Failed to delete server");
        },
      }
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 bg-[#fffce9] overflow-hidden border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl">
          <DialogHeader className="p-6 border-b-4 border-black bg-white">
            <DialogTitle className="font-mono font-black text-xl text-black uppercase tracking-wide">
              {value}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 flex flex-col gap-y-4">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-4 bg-white rounded-xl border-4 border-black cursor-pointer hover:shadow-[4px_4px_0px_0px_#5170ff] hover:border-[#5170ff] transition-all duration-200 shadow-[4px_4px_0px_0px_#000000]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono font-bold text-black uppercase tracking-wide">
                      Server name
                    </p>
                    <p className="text-sm font-mono font-bold text-[#5170ff] hover:text-[#4060ef] uppercase tracking-wide">
                      Edit
                    </p>
                  </div>
                  <p className="text-sm font-mono text-gray-700 mt-1">
                    {value}
                  </p>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-mono font-black text-xl text-black uppercase tracking-wide">
                    Rename this server
                  </DialogTitle>
                </DialogHeader>
                <form className="space-y-6" onSubmit={handleRename}>
                  <Input
                    value={value}
                    disabled={isUpdatingWorkspace}
                    required
                    autoFocus
                    minLength={3}
                    maxLength={80}
                    placeholder="Server name e.g. 'Personal','Home'"
                    onChange={(e) => setValue(e.target.value)}
                    className="border-4 border-black rounded-xl font-mono font-bold shadow-[4px_4px_0px_0px_#000000] focus:shadow-[6px_6px_0px_0px_#5170ff] focus:border-[#5170ff] transition-all duration-200"
                  />
                  <DialogFooter className="gap-3">
                    <DialogClose asChild>
                      <Button
                        className="bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:scale-102 hover:bg-gray-50"
                        disabled={isUpdatingWorkspace}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      className="bg-[#5170ff] text-white font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:scale-102 hover:bg-[#4060ef]"
                      disabled={isUpdatingWorkspace}>
                      {isUpdatingWorkspace ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                disabled={isDeletingWorkspace}
                onClick={handleDelete}
                className="w-full flex items-center gap-x-3 px-5 py-4 bg-red-100 text-red-600 font-mono font-bold rounded-xl border-4 border-black cursor-pointer hover:bg-red-200 hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 shadow-[4px_4px_0px_0px_#000000] uppercase tracking-wide">
                <TrashIcon className="size-5" />
                <span className="text-sm">Delete Server</span>
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
