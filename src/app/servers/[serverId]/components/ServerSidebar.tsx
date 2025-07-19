import { useGetChannels } from "@/features/channels/api/useGetChannels";
import { useCreateChannelModal } from "@/features/channels/store/useCreateChannelModal";
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useGetMembers } from "@/features/serverMembers/api/useGetMembers";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useChannelId } from "@/hooks/useChannelId";
import { useMemberId } from "@/hooks/useMemberId";
import { useServerId } from "@/hooks/useServerId";
import {
  AlertTriangleIcon,
  HashIcon,
  LoaderIcon,
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

  const { data: channels} = useGetChannels({
    serverId,
  });

  const { data: serverMembers} =
    useGetMembers({
      serverId,
    });

  // const { data: isPermitted, isLoading } = useHasPermission({
  //   serverMemberId: currentMember?._id,
  //   permission: "MANAGE_CHANNELS",
  // });

  const { setIsOpen } = useCreateChannelModal();

  if (serverLoading || currentMemberLoading) {
    return (
      <div className="flex flex-col bg-[#5E2C5F] h-full items-center justify-center">
        <LoaderIcon className="size-5 animate-spin text-white" />
      </div>
    );
  }

  if (!server || !currentMember) {
    return (
      <div className="flex flex-col gap-y-2 bg-[#5E2C5F] h-full items-center justify-center">
        <AlertTriangleIcon className="size-5  text-white" />
        <p className="text-white text-sm">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#5e2c5f] h-full">
      <ServerHeader server={server} member={currentMember} />
      <div className="flex flex-col px-2 mt-3">
        <SidebarItem
          label="Threads"
          icon={MessageSquareTextIcon}
          id="threads"
        />
        <SidebarItem
          label="Drafts & sent"
          icon={SendHorizonalIcon}
          id="drafts"
        />
      </div>
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
