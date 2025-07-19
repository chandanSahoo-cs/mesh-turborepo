"use client";

import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useGetServers } from "@/features/servers/api/useGetServers";
import { useCreateServerModal } from "@/features/servers/store/useCreateServerModal";
import { useServerId } from "@/hooks/useServerId";
import { motion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export const ServerSwitcher = () => {
  const router = useRouter();
  const serverId = useServerId();
  const { setIsOpen } = useCreateServerModal();

  const { data: server, isLoading: serverLoading } = useGetServerById({
    id: serverId,
  });
  const { serverData: servers } = useGetServers();

  const filteredServers = servers?.filter((server) => server?._id !== serverId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="size-12 relative overflow-hidden bg-[#5170ff] hover:bg-[#4060ef] text-white font-mono font-black text-xl border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all duration-200">
            {serverLoading ? <Loader /> : server?.name.charAt(0).toUpperCase()}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-64 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-xl">
        <DropdownMenuItem
          onClick={() => router.push(`/servers/${serverId}`)}
          className="cursor-pointer flex-col justify-start items-start capitalize p-3 hover:bg-[#fffce9] rounded-lg">
          <span className="font-mono font-bold text-black uppercase tracking-wide">
            {server?.name}
          </span>
          <span className="text-xs font-mono text-gray-700 uppercase">
            Active server
          </span>
        </DropdownMenuItem>
        {filteredServers?.map(
          (server) =>
            server && (
              <DropdownMenuItem
                onClick={() => router.push(`/servers/${server._id}`)}
                key={server._id}
                className="cursor-pointer capitalize p-3 hover:bg-[#5170ff] hover:text-white rounded-lg">
                <div className="size-10 relative overflow-hidden bg-[#7ed957] text-black font-mono font-black text-lg rounded-xl flex items-center justify-center mr-3 border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono font-bold uppercase tracking-wide">
                  {server.name}
                </span>
              </DropdownMenuItem>
            )
        )}
        <DropdownMenuItem
          className="cursor-pointer p-3 hover:bg-[#7ed957] hover:text-black rounded-lg"
          onClick={() => setIsOpen(true)}>
          <div className="size-10 relative overflow-hidden bg-white text-black font-mono font-black text-lg rounded-xl flex items-center justify-center mr-3 border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
            <PlusIcon />
          </div>
          <span className="font-mono font-bold uppercase tracking-wide">
            Create new server
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
