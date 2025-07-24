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
import { useState } from "react";
import { useCreateChannel } from "../api/useCreateChannel";

interface CreateCategoryModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const CreateCategoryModal = ({
  isOpen,
  setIsOpen,
}: CreateCategoryModalProps) => {
  const serverId = useServerId();
  const [name, setName] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setName(value);
  };

  const handleClose = () => {
    setName("");
    setIsOpen(false);
  };

  const { createChannel, isPending } = useCreateChannel();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createChannel(
      { serverId, name, type: "category" },
      {
        onSuccess: () => {
          successToast(`${name} category created`);
          handleClose();
        },
        onError: () => {
          errorToast("Failed to create category");
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
            Add a Category
          </DialogTitle>
          <p className="text-sm font-mono font-bold text-gray-700 mt-2 normal-case tracking-normal">
            Create a new category to organize channels
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Channel Name Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-mono font-black text-black uppercase tracking-wide">
                Category Name
              </label>
              <div className="relative">
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
