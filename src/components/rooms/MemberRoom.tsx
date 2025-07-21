"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useUserDetailsById } from "@/features/auth/api/useUserDetailsById";
import { useGetMemberById } from "@/features/serverMembers/api/useGetMemberById";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useMemberId } from "@/hooks/useMemberId";
import { useServerId } from "@/hooks/useServerId";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { Loader } from "../Loader";
import { PresenceTracker } from "../PresenceTracker";

export const MemberRoom = ({ children }: { children: React.ReactNode }) => {
  const { userData, isLoading: isLoadingUserData } = useCurrentUser();

  const serverId = useServerId();
  const memberId = useMemberId();

  const { data: memberData, isLoading: isLoadingMemberData } = useGetMemberById(
    { serverMemberId: memberId }
  );

  const { data: otherUserData, isLoading: isLoadingOtherUserData } =
    useUserDetailsById({ userId: memberData?.userId });

  const { data: serverData, isLoading: isLoadingServerData } = useGetServerById(
    { id: serverId }
  );

  const [id1, id2] = [userData?._id, otherUserData?._id].sort();

  const isLoading =
    isLoadingUserData ||
    isLoadingMemberData ||
    isLoadingOtherUserData ||
    isLoadingServerData;

  if (isLoading) {
    return <Loader message="Loading channel" />;
  }

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblock-server-member-auth";
        const body = JSON.stringify({ userData, otherUserData, serverData });
        const response = await fetch(endpoint, { method: "POST", body: body });

        return await response.json();
      }}>
      <RoomProvider
        initialPresence={{ isTyping: false }}
        id={String(serverId) + String(id1) + String(id2)}>
        <ClientSideSuspense
          fallback={<Loader message="Loading your session" />}>
          <PresenceTracker />
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};
