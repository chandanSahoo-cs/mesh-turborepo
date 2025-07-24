"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useGetMessageById } from "@/features/messages/api/useGetMessageById";
import { useParentMessageId } from "@/features/messages/store/useParentMessageId";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader } from "../Loader";

export const ServerThreadRoom = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userData, isLoading: isLoadingUserData } = useCurrentUser();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [parentMessageId, _] = useParentMessageId();

  const { data: parentMessageData, isLoading: isLoadingParentMessageData } =
    useGetMessageById({ messageId: parentMessageId as Id<"messages"> });

  const isLoading = isLoadingUserData || isLoadingParentMessageData;

  if (isLoading) {
    return <Loader message="Loading channel" />;
  }

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblock-server-thread-auth";
        const body = JSON.stringify({ userData, parentMessageData });
        const response = await fetch(endpoint, { method: "POST", body: body });

        return await response.json();
      }}>
      <RoomProvider
        initialPresence={{ isTyping: false }}
        id={"parentMessage" + String(parentMessageData?._id)}>
        <ClientSideSuspense
          fallback={<Loader message="Loading your session" />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};
