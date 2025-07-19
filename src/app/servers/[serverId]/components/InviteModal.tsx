"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNewJoinCode } from "@/features/servers/api/useNewJoinCode";
import { useConfirm } from "@/hooks/useConfirm";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";
import type { Doc } from "../../../../../convex/_generated/dataModel";

interface InviteModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  server: Doc<"servers">;
}

export const InviteModal = ({ open, setOpen, server }: InviteModalProps) => {
  const { generateNewJoinCode, isPending } = useNewJoinCode();

  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/join/${server._id}`;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => toast.success("Invite link copied to clipboard"));
  };

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure",
    "This will deactivate the current invite code and generate a new one."
  );

  const handleNewCode = async () => {
    const ok = await confirm();
    if (!ok) return;
    generateNewJoinCode(
      {
        serverId: server._id,
      },
      {
        onSuccess: () => {
          toast.success("New join code generated");
        },
        onError: () => {
          toast.error("Failed to generate new join code");
        },
      }
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono font-black text-xl text-black uppercase tracking-wide">
              Invite people to {server.name}
            </DialogTitle>
            <DialogDescription className="font-mono text-gray-700">
              Use the code below to invite people to your server
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center gap-y-6 py-8">
            <motion.div
              className="bg-[#fffce9] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}>
              <p className="text-4xl font-mono font-black uppercase tracking-widest text-black">
                {server.joinCode}
              </p>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCopy}
                className="bg-[#7ed957] text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#6ec947] flex items-center gap-2">
                Copy Link
                <CopyIcon className="size-4" />
              </Button>
            </motion.div>
          </div>

          <div className="flex w-full items-center justify-between gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleNewCode}
                className="bg-[#5170ff] text-white font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#4060ef] flex items-center gap-2">
                New code
                <RefreshCcwIcon
                  className={cn("size-4", isPending && "animate-spin")}
                />
              </Button>
            </motion.div>

            <DialogClose asChild>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button className="bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-gray-50">
                  Close
                </Button>
              </motion.div>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
