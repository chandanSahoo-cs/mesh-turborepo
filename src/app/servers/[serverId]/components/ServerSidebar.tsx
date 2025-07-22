"use client";

import { Loader } from "@/components/Loader";
import { useGetChannels } from "@/features/channels/api/useGetChannels";
import { useCreateChannelModal } from "@/features/channels/store/useCreateChannelModal";
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useGetMembers } from "@/features/serverMembers/api/useGetMembers";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useChannelId } from "@/hooks/useChannelId";
import { useMemberId } from "@/hooks/useMemberId";
import { useServerId } from "@/hooks/useServerId";
import { motion } from "framer-motion";
import {
  AlertTriangleIcon,
  HashIcon,
  MessageSquareTextIcon,
  SendHorizonalIcon,
} from "lucide-react";
import { ServerHeader } from "./ServerHeader";
import { ServerSection } from "./ServerSection";
import { SidebarItem } from "./SidebarItem";
import { UserItem } from "./UserItem";

export const ServerSidebar = () => {
  const serverId = useServerId();
  const channelID = useChannelId();
  const memberId = useMemberId();

  const { data: currentMember, isLoading: currentMemberLoading } =
    useCurrentMember({
      serverId,
    });
  const { data: server, isLoading: serverLoading } = useGetServerById({
    id: serverId,
  });

  const { data: channels } = useGetChannels({
    serverId,
  });

  const { data: serverMembers } = useGetMembers({
    serverId,
  });

  const { setIsOpen } = useCreateChannelModal();

  if (serverLoading || currentMemberLoading) {
    return <Loader />;
  }

  if (!server || !currentMember) {
    return (
      <div className="flex flex-col gap-y-4 bg-white h-full items-center justify-center p-6">
        <motion.div
          className="bg-red-100 border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000000]"
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}>
          <AlertTriangleIcon className="size-8 text-red-600" />
        </motion.div>
        <p className="text-black text-sm font-mono font-bold uppercase tracking-wide text-center">
          Server not found
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white h-full border-r-4 border-black">
      <ServerHeader server={server} member={currentMember} />
      <ServerSection
        label="Channels"
        hint="New channel"
        onNew={() => setIsOpen(true)}>
        {channels?.map(
          (channelItem) =>
            channelItem.type !== "category" && (
              <SidebarItem
                key={channelItem._id}
                icon={HashIcon}
                label={channelItem.name}
                id={channelItem._id}
                variant={channelID === channelItem._id ? "active" : "default"}
              />
            )
        )}
      </ServerSection>
      <ServerSection label="Members" hint="Members">
        {serverMembers?.map((serverMember) => (
          <div key={serverMember._id}>
            <UserItem
              id={serverMember._id}
              label={serverMember.memberInfo?.name}
              image={serverMember.memberInfo?.image}
              variant={serverMember._id === memberId ? "active" : "default"}
            />
          </div>
        ))}
      </ServerSection>
    </div>
  );
};
