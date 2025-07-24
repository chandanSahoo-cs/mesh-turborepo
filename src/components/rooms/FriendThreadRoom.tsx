"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useGetFriendMessageById } from "@/features/friendMessages/api/useGetFriendMessageById";
import { useParentMessageId } from "@/features/messages/store/useParentMessageId";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader } from "../Loader";
import { PresenceTracker } from "../PresenceTracker";

export const FriendThreadRoom = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userData, isLoading: isLoadingUserData } = useCurrentUser();

  const [parentMessageId, _] = useParentMessageId();

  const { data: parentMessageData, isLoading: isLoadingParentMessageData } =
    useGetFriendMessageById({
      friendMessageId: parentMessageId as Id<"friendMessages">,
    });

  const isLoading = isLoadingUserData || isLoadingParentMessageData;

  if (isLoading) {
    return <Loader message="Loading channel" />;
  }

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblock-friend-thread-auth";
        const body = JSON.stringify({ userData, parentMessageData });
        const response = await fetch(endpoint, { method: "POST", body: body });

        return await response.json();
      }}>
      <RoomProvider
        initialPresence={{ isTyping: false }}
        id={"friendThreadMessage" + String(parentMessageData?._id)}>
        <ClientSideSuspense
          fallback={<Loader message="Loading your session" />}>
          <PresenceTracker />
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};
