"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { AlertTriangleIcon } from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";

export const useConfirm = (
  title: string,
  message: string
): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () =>
    new Promise((resolve) => {
      setPromise({ resolve });
    });

  const handleClose = () => {
    setPromise(null);
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const ConfirmDialog = () => (
    <Dialog open={promise !== null} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl p-0 overflow-hidden max-w-md">
        <DialogHeader className="p-6 border-b-4 border-black bg-[#fffce9]">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <motion.div
              className="bg-orange-100 border-2 border-black rounded-xl p-2 shadow-[2px_2px_0px_0px_#000000]"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}>
              <AlertTriangleIcon className="size-6 text-orange-600" />
            </motion.div>
            <div>
              <DialogTitle className="font-mono font-black text-xl text-black uppercase tracking-wide">
                {title}
              </DialogTitle>
              <DialogDescription className="font-mono text-gray-700 text-sm mt-1">
                {message}
              </DialogDescription>
            </div>
          </motion.div>
        </DialogHeader>

        <motion.div
          className="p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}>
          <DialogFooter className="gap-3 sm:gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCancel}
                className="bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-gray-50">
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleConfirm}
                className="bg-red-400 text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-red-500">
                Confirm
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.div>

        {/* Decorative floating elements */}
        <motion.div
          className="absolute top-4 right-4 w-3 h-3 bg-[#5170ff] border-2 border-black rounded-full opacity-40"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-4 left-4 w-2 h-2 bg-[#7ed957] border-2 border-black rounded-lg opacity-50"
          animate={{
            y: [0, -5, 0],
            x: [0, 5, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </DialogContent>
    </Dialog>
  );

  return [ConfirmDialog, confirm];
};
