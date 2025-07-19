"use client";

import type React from "react";

import { Hint } from "@/components/Hint";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { FaCaretDown } from "react-icons/fa";
import { useToggle } from "react-use";

interface ServerSectionProps {
  children: React.ReactNode;
  label: string;
  hint: string;
  onNew?: () => void;
}

export const ServerSection = ({
  children,
  label,
  hint,
  onNew,
}: ServerSectionProps) => {
  const [on, toggle] = useToggle(true);

  return (
    <div className="flex flex-col mt-4 px-3">
      <div className="flex items-center px-2 group mb-2">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            onClick={toggle}
            variant="transparent"
            className="text-sm text-black shrink-0 size-6 p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <FaCaretDown
              className={cn("size-3 transition-transform", !on && "-rotate-90")}
            />
          </Button>
        </motion.div>
        <Button
          variant="transparent"
          size="sm"
          className="group h-8 px-2 items-center justify-start text-sm text-black overflow-hidden font-mono font-bold uppercase tracking-wide hover:bg-gray-100 rounded-lg transition-colors">
          <span className="truncate">{label}</span>
        </Button>
        {onNew && (
          <Hint label={hint} side="top" align="center">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={onNew}
                variant="transparent"
                size="iconSm"
                className="ml-auto size-6 p-1 shrink-0 text-sm text-black opacity-0 transition-all group-hover:opacity-100 hover:bg-[#7ed957] hover:text-black border-2 border-transparent hover:border-black hover:rounded-lg hover:shadow-[2px_2px_0px_0px_#000000]">
                <PlusIcon className="size-4" />
              </Button>
            </motion.div>
          </Hint>
        )}
      </div>
      {on && <div className="space-y-1">{children}</div>}
    </div>
  );
};
