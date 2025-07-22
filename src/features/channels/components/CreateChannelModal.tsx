"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useServerId } from "@/hooks/useServerId";
import { errorToast, successToast } from "@/lib/toast";
import { motion } from "framer-motion";
import { HashIcon, Volume2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useCreateChannel } from "../api/useCreateChannel";

interface CreateChannelModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  categoryId: Id<"channels">;
}

export const CreateChannelModal = ({
  isOpen,
  setIsOpen,
  categoryId,
}: CreateChannelModalProps) => {
  const router = useRouter();
  const serverId = useServerId();
  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<"text" | "voice">("text");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setName(value);
  };

  const handleClose = () => {
    setName("");
    setChannelType("text");
    setIsOpen(false);
  };

  const { createChannel, isPending } = useCreateChannel();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createChannel(
      { serverId, name, categoryId, type: channelType },
      {
        onSuccess: ({ id }) => {
          successToast(`${name} channel created`);
          router.push(`/servers/${serverId}/channel/${id}`);
          handleClose();
        },
        onError: () => {
          errorToast("Failed to create channel");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-6 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000000] p-0 max-w-md">
        {/* Header */}
        <DialogHeader className="bg-[#fffce9] border-b-4 border-black p-6 rounded-t-2xl relative">
          <DialogTitle className="text-2xl font-mono font-black text-black uppercase tracking-wide text-left">
            Add a Channel
          </DialogTitle>
          <p className="text-sm font-mono font-bold text-gray-700 mt-2 normal-case tracking-normal">
            Create a new channel to organize conversations
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Channel Type Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-black text-black uppercase tracking-wide">
              Channel Type
            </h3>

            {/* Text Channel Option */}
            <motion.div
              className={`border-4 border-black rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                channelType === "text"
                  ? "bg-[#5170ff] shadow-[4px_4px_0px_0px_#000000]"
                  : "bg-white shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000]"
              }`}
              onClick={() => setChannelType("text")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-3">
                <div
                  className={`size-6 rounded-full border-3 border-black flex items-center justify-center ${
                    channelType === "text" ? "bg-white" : "bg-gray-200"
                  }`}>
                  {channelType === "text" && (
                    <div className="size-3 bg-[#5170ff] rounded-full border border-black" />
                  )}
                </div>
                <HashIcon
                  className={`size-6 ${channelType === "text" ? "text-white" : "text-black"}`}
                />
                <div>
                  <h4
                    className={`font-mono font-black uppercase tracking-wide text-sm ${
                      channelType === "text" ? "text-white" : "text-black"
                    }`}>
                    Text
                  </h4>
                  <p
                    className={`text-xs font-mono font-bold normal-case tracking-normal ${
                      channelType === "text" ? "text-gray-100" : "text-gray-600"
                    }`}>
                    Send messages, images, GIFs, emoji, and more
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Voice Channel Option */}
            <motion.div
              className={`border-4 border-black rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                channelType === "voice"
                  ? "bg-[#5170ff] shadow-[4px_4px_0px_0px_#000000]"
                  : "bg-white shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000]"
              }`}
              onClick={() => setChannelType("voice")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-3">
                <div
                  className={`size-6 rounded-full border-3 border-black flex items-center justify-center ${
                    channelType === "voice" ? "bg-white" : "bg-gray-200"
                  }`}>
                  {channelType === "voice" && (
                    <div className="size-3 bg-[#5170ff] rounded-full border border-black" />
                  )}
                </div>
                <Volume2Icon
                  className={`size-6 ${channelType === "voice" ? "text-white" : "text-black"}`}
                />
                <div>
                  <h4
                    className={`font-mono font-black uppercase tracking-wide text-sm ${
                      channelType === "voice" ? "text-white" : "text-black"
                    }`}>
                    Voice
                  </h4>
                  <p
                    className={`text-xs font-mono font-bold normal-case tracking-normal ${
                      channelType === "voice"
                        ? "text-gray-100"
                        : "text-gray-600"
                    }`}>
                    Hang out together with voice, video, and screen share
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Channel Name Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-mono font-black text-black uppercase tracking-wide">
                Channel Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-mono font-black text-lg">
                  #
                </div>
                <Input
                  value={name}
                  onChange={handleChange}
                  disabled={isPending}
                  required
                  autoFocus
                  minLength={3}
                  maxLength={80}
                  placeholder="new-channel"
                  className="pl-8 bg-white border-4 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#5170ff] font-mono font-bold text-black placeholder:text-gray-500 h-12 transition-all duration-200"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="w-full bg-white hover:bg-white text-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] font-mono font-black uppercase tracking-wide py-3 h-12 transition-all duration-200">
                  Cancel
                </Button>
              </motion.div>
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="w-full bg-[#7ed957] hover:bg-[#7ed957] text-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] disabled:opacity-50 disabled:cursor-not-allowed font-mono font-black uppercase tracking-wide py-3 h-12 transition-all duration-200">
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </motion.div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
