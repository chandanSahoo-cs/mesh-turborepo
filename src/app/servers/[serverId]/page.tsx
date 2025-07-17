"use client";

import { useGetChannels } from "@/features/channels/api/useGetChannels";
import { useCreateChannelModal } from "@/features/channels/store/useCreateChannelModal";
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useMemberPermissions } from "@/features/serverMembers/api/useMemberPermissions";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useServerId } from "@/hooks/useServerId";
import { LoaderIcon, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const ServerIdPage = () => {
  const router = useRouter();
  const serverId = useServerId();
  const { isOpen, setIsOpen } = useCreateChannelModal();

  const { data: member, isLoading: memberLoading } = useCurrentMember({
    serverId,
  });

  const { data: server, isLoading: serverLoading } = useGetServerById({
    id: serverId,
  });
  const { data: channels, isLoading: channelsLoading } = useGetChannels({
    serverId,
  });

  const { isPermitted } = useMemberPermissions({
    memberId: member?._id,
    permission: "MANAGE_CHANNELS",
  });

  const firstChannelId = useMemo(() => channels?.[1]?._id, [channels]);

  useEffect(() => {
    console.log("Inside useEffect");
    if (serverLoading || channelsLoading || !server || !member || memberLoading)
      return;
    if (firstChannelId) {
      router.replace(`/servers/${serverId}/channel/${firstChannelId}`);
      console.log("Router is working");
    } else if (!isOpen && isPermitted) {
      setIsOpen(true);
    }
  }, [
    isPermitted,
    member,
    memberLoading,
    channelsLoading,
    serverLoading,
    server,
    router,
    firstChannelId,
    isOpen,
    setIsOpen,
  ]);

  if (serverLoading || channelsLoading || memberLoading) {
    return (
      <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!server || !member) {
    return (
      <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
        <TriangleAlertIcon className="size-6 text-destructive" />
        <span className="text-sm text-muted-foreground">Server not found</span>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
      <TriangleAlertIcon className="size-6 text-destructive" />
      <span className="text-sm text-muted-foreground">No channel found</span>
    </div>
  );
};

export default ServerIdPage;
