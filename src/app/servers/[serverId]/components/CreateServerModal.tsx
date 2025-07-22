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
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateServer } from "../../../../features/servers/api/useCreateServer";
import { useCreateServerModal } from "../../../../features/servers/store/useCreateServerModal";
import { successToast } from "@/lib/toast";

export const CreateServerModal = () => {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCreateServerModal();
  const [name, setName] = useState("");
  const { createServer, isPending } = useCreateServer();

  const handleClose = () => {
    setIsOpen(false);
    setName("");
  };

  const handleCreateServer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createServer(
      { name },
      {
        onSuccess({ id }) {
          setIsOpen(false);
          successToast("Server created");
          setName("");
          router.push(`/servers/${id}`);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b-4 border-black bg-[#fffce9]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <DialogTitle className="font-mono font-black text-2xl text-black uppercase tracking-wide">
              Add a server
            </DialogTitle>
            <p className="font-mono text-gray-700 text-sm mt-2">
              Create a new server to chat with friends and communities
            </p>
          </motion.div>
        </DialogHeader>

        <motion.div
          className="p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}>
          <form className="space-y-6" onSubmit={handleCreateServer}>
            <div className="space-y-2">
              <label className="text-sm font-mono font-bold text-black uppercase tracking-wide">
                Server Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
                autoFocus
                minLength={3}
                placeholder="Server name e.g. 'Work', 'Personal', 'Home'"
                className="border-4 border-black rounded-xl font-mono font-bold shadow-[4px_4px_0px_0px_#000000] focus:shadow-[6px_6px_0px_0px_#7ed957] focus:border-[#7ed957] transition-all duration-200 h-12"
              />
            </div>

            <div className="flex justify-end gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-gray-50">
                  Cancel
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="bg-[#7ed957] text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#6ec947] disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </motion.div>
            </div>
          </form>
        </motion.div>
        <motion.div
          className="absolute bottom-4 left-4 w-4 h-4 bg-[#7ed957] border-2 border-black rounded-full"
          animate={{
            y: [0, -5, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
