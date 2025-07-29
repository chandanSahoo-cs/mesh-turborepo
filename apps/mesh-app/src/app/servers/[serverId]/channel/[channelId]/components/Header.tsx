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
import { useRemoveChannel } from "@/features/channels/api/useRemoveChannel";
import { useRenameChannel } from "@/features/channels/api/useUpdateChannel";
import { useHasPermission } from "@/features/roles/api/useHasPermission";
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useChannelId } from "@/hooks/useChannelId";
import { useConfirm } from "@/hooks/useConfirm";
import { useServerId } from "@/hooks/useServerId";
import { errorToast, successToast } from "@/lib/toast";
import { DialogClose } from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { HashIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

interface HeaderProps {
  channelName: string;
}

export const Header = ({ channelName }: HeaderProps) => {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [value, setValue] = useState(channelName);

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this channel",
    "You are about to delete this channel. This action is irreversible."
  );

  const channelId = useChannelId();
  const serverId = useServerId();
  const { data: member } = useCurrentMember({
    serverId,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setValue(value);
  };

  const { data: isPermitted } = useHasPermission({
    serverMemberId: member?._id,
    permission: "MANAGE_CHANNELS",
  });

  const { renameChannel, isPending: isRenamePending } = useRenameChannel();
  const { removeChannel, isPending: isRemovePending } = useRemoveChannel();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    renameChannel(
      { channelId, name: value },
      {
        onSuccess: () => {
          successToast("Channel renamed");
          setEditOpen(false);
        },
        onError: () => {
          errorToast("Failed to rename channel");
        },
      }
    );
  };

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;
    removeChannel(
      { channelId },
      {
        onSuccess: () => {
          router.replace(`/servers/${serverId}`);
          successToast("Channel Deleted");
        },
        onError: () => {
          errorToast("Failed to delete channel");
        },
      }
    );
  };

  const handleEditOpen = () => {
    if (!isPermitted) return;
    setEditOpen(true);
  };

  return (
    <div className="bg-[#fffce9] border-b-4 border-black h-16 flex items-center px-6 overflow-hidden">
      {!isPermitted ? (
        <div className="flex items-center gap-2">
          <HashIcon className="size-5 text-[#5170ff]" />
          <h1 className="text-lg font-mono font-black text-black uppercase tracking-wide truncate">
            {channelName}
          </h1>
        </div>
      ) : (
        <>
          <ConfirmDialog />
          <Dialog>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  variant="transparent"
                  className="text-lg font-mono font-black text-black uppercase tracking-wide px-3 py-2 overflow-hidden w-auto hover:bg-white hover:border-4 hover:border-black hover:rounded-xl hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200">
                  <HashIcon className="size-5 text-[#5170ff] mr-2" />
                  <span className="truncate">{channelName}</span>
                  <FaChevronDown className="size-3 ml-2 shrink-0" />
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="p-0 bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl overflow-hidden">
              <DialogHeader className="p-6 border-b-4 border-black bg-[#fffce9]">
                <DialogTitle className="font-mono font-black text-xl text-black uppercase tracking-wide flex items-center gap-2">
                  <HashIcon className="size-5 text-[#5170ff]" />
                  {channelName}
                </DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 flex flex-col gap-y-4">
                <Dialog open={editOpen} onOpenChange={handleEditOpen}>
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-4 bg-white rounded-xl border-4 border-black cursor-pointer hover:shadow-[4px_4px_0px_0px_#5170ff] hover:border-[#5170ff] transition-all duration-200 shadow-[4px_4px_0px_0px_#000000]">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-mono font-bold text-black uppercase tracking-wide">
                          Channel name
                        </p>
                        <p className="text-sm font-mono font-bold text-[#5170ff] hover:text-[#4060ef] uppercase tracking-wide">
                          Edit
                        </p>
                      </div>
                      <p className="text-sm font-mono text-gray-700 mt-1 flex items-center gap-1">
                        <HashIcon className="size-3" />
                        {channelName}
                      </p>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="font-mono font-black text-xl text-black uppercase tracking-wide">
                        Rename this channel
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <Input
                        value={value}
                        disabled={isRenamePending}
                        onChange={handleChange}
                        required
                        autoFocus
                        minLength={3}
                        maxLength={80}
                        placeholder="plan-anniversary"
                        className="border-4 border-black rounded-xl font-mono font-bold shadow-[4px_4px_0px_0px_#000000] focus:shadow-[6px_6px_0px_0px_#5170ff] focus:border-[#5170ff] transition-all duration-200"
                      />
                      <DialogFooter className="gap-3">
                        <DialogClose asChild>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}>
                            <Button
                              disabled={isRenamePending}
                              className="bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-gray-50">
                              Cancel
                            </Button>
                          </motion.div>
                        </DialogClose>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}>
                          <Button
                            disabled={isRenamePending}
                            className="bg-[#5170ff] text-white font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#4060ef]">
                            {isRenamePending ? "Saving..." : "Save"}
                          </Button>
                        </motion.div>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleDelete}
                    disabled={isRemovePending}
                    className="w-full flex items-center gap-x-3 px-5 py-4 bg-red-100 text-red-600 font-mono font-bold rounded-xl border-4 border-black cursor-pointer hover:bg-red-200 hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 shadow-[4px_4px_0px_0px_#000000] uppercase tracking-wide">
                    <TrashIcon className="size-5" />
                    <span className="text-sm">Delete Channel</span>
                  </Button>
                </motion.div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
