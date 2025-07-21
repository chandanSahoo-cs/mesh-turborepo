"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { Loader } from "../Loader";
import { PresenceTracker } from "../PresenceTracker";

export const Room = ({ children }: { children: React.ReactNode }) => {
  const { userData, isLoading } = useCurrentUser();

  if (isLoading) {
    return <Loader message="Loading user data" />;
  }

  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint={async () => {
        const endpoint = "/api/liveblock-friend-auth";
        const body = JSON.stringify({ userData });
        const response = await fetch(endpoint, { method: "POST", body: body });

        return await response.json();
      }}>
      <RoomProvider id={String(userData?._id)}>
        <ClientSideSuspense
          fallback={<Loader message="Loading your session" />}>
          <PresenceTracker />
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
};
