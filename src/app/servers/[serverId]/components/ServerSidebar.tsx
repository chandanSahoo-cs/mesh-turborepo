import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useServerId } from "@/hooks/useServerId";
import { AlertTriangleIcon, LoaderIcon } from "lucide-react";
import { ServerHeader } from "./ServerHeader";

export const ServerSidebar = () => {
  const serverId = useServerId();

  const { data: member, isLoading: memberLoading } = useCurrentMember({
    serverId,
  });
  const { data: server, isLoading: serverLoading } = useGetServerById({
    id: serverId,
  });

  if (serverLoading || memberLoading) {
    return (
      <div className="flex flex-col bg-[#5E2C5F] h-full items-center justify-center">
        <LoaderIcon className="size-5 animate-spin text-white" />
      </div>
    );
  }

  if (!server || !member) {
    return (
      <div className="flex flex-col gap-y-2 bg-[#5E2C5F] h-full items-center justify-center">
        <AlertTriangleIcon className="size-5  text-white" />
        <p className="text-white text-sm">Workspace not found</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col bg-[#5e2c5f] h-full">
      <ServerHeader server={server} member={member}/>
    </div>
  );
};
