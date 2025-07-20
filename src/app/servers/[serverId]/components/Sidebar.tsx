"use client";

import { UserButton } from "@/features/auth/components/UserButton";
import { useGetServers } from "@/features/servers/api/useGetServers";
import { useCreateServerModal } from "@/features/servers/store/useCreateServerModal";
import { motion } from "framer-motion";
import { MessageCircleIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { SidebarButton } from "./SidebarButton";

export const Sidebar = () => {
  const { serverData: servers } = useGetServers();
  const { setIsOpen } = useCreateServerModal();

  const router = useRouter();

  return (
    <aside className="w-[70px] h-full bg-white border-r-4 border-black flex flex-col gap-y-4 items-center pt-4 pb-4">
      <motion.div
        className="flex flex-col items-center justify-center gap-y-1 cursor-pointer group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/friends")}>
        <div className="size-12 relative overflow-hidden bg-[#7ed957] text-black font-mono font-black text-xl rounded-xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:bg-[#7ed957] transition-all duration-200">
          <MessageCircleIcon className="size-6" />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-wide text-black group-hover:text-[#7ed957] transition-colors">
          DM
        </span>
      </motion.div>
      {/* Server List */}
      <div className="flex flex-col gap-y-3">
        {servers?.map(
          (server) =>
            server && <SidebarButton key={server._id} server={server} />
        )}
      </div>

      {/* Create Server Button */}
      <motion.div
        className="flex flex-col items-center justify-center gap-y-1 cursor-pointer group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}>
        <div className="size-12 relative overflow-hidden bg-[#7ed957] text-black font-mono font-black text-xl rounded-xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:bg-[#6ec947] transition-all duration-200">
          <PlusIcon className="size-6" />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-wide text-black group-hover:text-[#7ed957] transition-colors">
          New
        </span>
      </motion.div>

      {/* User Button */}
      <div className="flex flex-col items-center justify-center gap-y-1 mt-auto">
        <UserButton />
      </div>
    </aside>
  );
};
