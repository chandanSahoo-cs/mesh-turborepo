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

import { Loader, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export const ServerSwitcher = () => {
  const router = useRouter();
  const serverId = useServerId();
  const { setIsOpen } = useCreateServerModal();

  const { data: server, isLoading: serverLoading } = useGetServerById({
    id: serverId,
  });
  const { serverData: servers, isLoading: worksapcesLoading } =
    useGetServers();

  const filteredServers = servers?.filter(
    (server) => server?._id !== serverId
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-9 relative overflow-hidden bg-[#ABABAD] hover:bg-[#ABABAD]/80 text-slate-800 font-semibold text-xl">
          {serverLoading ? (
            <Loader className="size-5 animate-spin shrink-0" />
          ) : (
            server?.name.charAt(0).toUpperCase()
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-64">
        <DropdownMenuItem
          onClick={() => router.push(`/servers/${serverId}`)}
          className="cursor-pointer flex-col justify-start items-start capitalize">
          {server?.name}
          <span className="text-xs text-muted-foreground">
            Active server
          </span>
        </DropdownMenuItem>
        {filteredServers?.map((server) => (
          <DropdownMenuItem
            onClick={() => router.push(`/servers/${server._id}`)}
            key={server._id}
            className="cursor-pointer capitalize">
            <div className="size-9 relative overflow-hidden bg-[#616061] text-white font-semibold text-lg rounded-md flex items-center justify-center mr-2">
              {server.name.charAt(0).toUpperCase()}
            </div>
            {server.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setIsOpen(true)}>
          <div className="size-9 relative overflow-hidden bg-[#f2f2f2] text-slate-800 font-semibold text-lg rounded-md flex items-center justify-center mr-2">
            <PlusIcon />
          </div>
          Create a new server
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
