"use client";

import type React from "react";

import { Hint } from "@/components/Hint";
import { Button } from "@/components/ui/button";
import { useRemoveChannel } from "@/features/channels/api/useRemoveChannel";
import { CreateChannelModal } from "@/features/channels/components/CreateChannelModal";
import { useConfirm } from "@/hooks/useConfirm";
import { errorToast, successToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { FaCaretDown } from "react-icons/fa";
import { useToggle } from "react-use";
import { Id } from "../../../../../convex/_generated/dataModel";

interface ServerSectionProps {
  children: React.ReactNode;
  label: string;
  hint: string;
  categoryId?: Id<"channels">;
}

export const ServerSection = ({
  children,
  label,
  hint,
  categoryId,
}: ServerSectionProps) => {
  const [on, toggle] = useToggle(true);
  const [isOpen, setIsOpen] = useState(false);

  const { removeChannel} = useRemoveChannel();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action is irreversible"
  );

  const handleRemoveChannel = async () => {
    const ok = await confirm();

    if (!ok) return;

    removeChannel(
      {
        channelId: categoryId as Id<"channels">,
      },
      {
        onSuccess() {
          successToast("Category removed");
        },
        onError() {
          errorToast("Failed to remove category");
        },
      }
    );
  };

  return (
    <>
      <ConfirmDialog />
      <div className="flex flex-col mt-4 px-3 ">
        <div className="flex items-center group mb-2">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={toggle}
              variant="transparent"
              className="text-sm text-black shrink-0 size-6 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <FaCaretDown
                className={cn(
                  "size-3 transition-transform",
                  !on && "-rotate-90"
                )}
              />
            </Button>
          </motion.div>
          <Button
            variant="transparent"
            size="sm"
            className="group h-8 px-2 items-center justify-start text-sm text-black overflow-hidden font-mono font-bold uppercase tracking-wide hover:bg-gray-100 rounded-lg transition-colors">
            <span className="truncate">{label}</span>
          </Button>
          {categoryId && (
            <>
              <CreateChannelModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                categoryId={categoryId}
              />
              <div className="flex">
                <Hint label={hint} side="top" align="center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={() => setIsOpen(true)}
                      variant="transparent"
                      size="iconSm"
                      className="ml-auto size-6 p-1 shrink-0 text-sm text-black opacity-0 transition-all group-hover:opacity-100 hover:bg-[#7ed957] hover:text-black border-2 border-transparent hover:border-black hover:rounded-lg hover:shadow-[2px_2px_0px_0px_#000000]">
                      <PlusIcon className="size-4" />
                    </Button>
                  </motion.div>
                </Hint>
                <Hint label="Delete category" side="top" align="center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={handleRemoveChannel}
                      variant="transparent"
                      size="iconSm"
                      className="ml-auto size-6 p-1 shrink-0 text-sm text-black opacity-0 transition-all group-hover:opacity-100 hover:bg-red-400 hover:text-black border-2 border-transparent hover:border-black hover:rounded-lg hover:shadow-[2px_2px_0px_0px_#000000]">
                      <TrashIcon className="size-4" />
                    </Button>
                  </motion.div>
                </Hint>
              </div>
            </>
          )}
        </div>
        {on && <div className="space-y-1">{children}</div>}
      </div>
    </>
  );
};
