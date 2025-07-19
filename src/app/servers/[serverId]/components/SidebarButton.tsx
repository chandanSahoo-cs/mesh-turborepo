"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons/lib";

interface SidebarButtonProps {
  icon: LucideIcon | IconType;
  label: string;
  isActive?: boolean;
}

export const SidebarButton = ({
  icon: Icon,
  label,
  isActive,
}: SidebarButtonProps) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-y-1 cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}>
      <Button
        variant="transparent"
        className={cn(
          "size-12 p-3 border-2 border-transparent rounded-xl transition-all duration-200",
          isActive
            ? "bg-[#5170ff] text-white border-black shadow-[4px_4px_0px_0px_#000000]"
            : "hover:bg-[#5170ff] hover:text-white hover:border-black hover:shadow-[2px_2px_0px_0px_#000000]"
        )}>
        <Icon className="size-6 transition-all" />
      </Button>
      <span
        className={cn(
          "text-xs font-mono font-bold uppercase tracking-wide transition-colors",
          isActive ? "text-[#5170ff]" : "text-black group-hover:text-[#5170ff]"
        )}>
        {label}
      </span>
    </motion.div>
  );
};
