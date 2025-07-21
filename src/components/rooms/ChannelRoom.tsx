"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useGetChannelById } from "@/features/channels/api/useGetChannelById";
import { useChannelId } from "@/hooks/useChannelId";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { Loader } from "../Loader";
import { PresenceTracker } from "../PresenceTracker";

export const ChannelRoom = ({ children }: { children: React.ReactNode }) => {
  const { userData, isLoading: isLoadingUserData } = useCurrentUser();
  const channelId = useChannelId();
  const { data: channelData, isLoading: isLoadingChannelData } =
    useGetChannelById({ channelId });

  const isLoading = isLoadingChannelData || isLoadingUserData;

  if (isLoading) {
    return <Loader message="Loading channel" />;
  }

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblock-server-channel-auth";
        const body = JSON.stringify({ userData, channelData });
        const response = await fetch(endpoint, { method: "POST", body: body });

        return await response.json();
      }}>
      <RoomProvider
        initialPresence={{ isTyping: false }}
        id={String(channelData?._id)}>
        <ClientSideSuspense
          fallback={<Loader message="Loading your session" />}>
          <PresenceTracker />
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};
