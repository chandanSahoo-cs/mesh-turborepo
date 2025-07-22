"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useUserDetailsById } from "@/features/auth/api/useUserDetailsById";
import { useFriendId } from "@/hooks/useFriendId";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { Loader } from "../Loader";
import { PresenceTracker } from "../PresenceTracker";

export const FriendRoom = ({ children }: { children: React.ReactNode }) => {
  const { userData, isLoading: isLoadingUserData } = useCurrentUser();

  const friendId = useFriendId();

  const { data: otherUserData, isLoading: isLoadingOtherUserData } =
    useUserDetailsById({ userId: friendId });

  const isLoading = isLoadingUserData || isLoadingOtherUserData;

  if (isLoading) {
    return <Loader message="Loading channel" />;
  }
  const [u1, u2] = [userData?._id, otherUserData?._id].sort();

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblock-friend-message-auth";
        const body = JSON.stringify({ userData, otherUserData });
        const response = await fetch(endpoint, { method: "POST", body: body });

        return await response.json();
      }}>
      <RoomProvider
        initialPresence={{ isTyping: false }}
        id={"friendMessage" + String(u1) + String(u2)}>
        <ClientSideSuspense
          fallback={<Loader message="Loading your session" />}>
          <PresenceTracker />
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};
