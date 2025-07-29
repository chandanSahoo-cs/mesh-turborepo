"use client";
import { Hint } from "@/components/Hint";
import { useServerId } from "@/hooks/useServerId";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Doc } from "../../../../../convex/_generated/dataModel";

interface SidebarButtonProps {
  server: Doc<"servers">;
}

export const SidebarButton = ({ server }: SidebarButtonProps) => {
  const currentServerId = useServerId();
  const router = useRouter();
  const isActive = server._id === currentServerId;

  return (
    <Hint label={server.name} side="right" >
      <motion.div
        className="flex flex-col items-center justify-center gap-y-1 cursor-pointer group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push(`/servers/${server._id}`)}>
        <div
          className={cn(
            "size-12 relative overflow-hidden font-mono font-black text-xl rounded-xl flex items-center justify-center border-4 border-black transition-all duration-200",
            isActive
              ? "bg-[#5170ff] text-white shadow-[4px_4px_0px_0px_#000000]"
              : "bg-white text-black shadow-[2px_2px_0px_0px_#000000] hover:bg-[#5170ff] hover:text-white hover:shadow-[4px_4px_0px_0px_#000000]"
          )}>
          {server.name.charAt(0).toUpperCase()}
        </div>
      </motion.div>
    </Hint>
  );
};
