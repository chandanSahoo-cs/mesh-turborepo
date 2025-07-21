import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useSelf } from "@liveblocks/react";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export const PresenceTracker = () => {
  const self = useSelf();

  const markStatus = useMutation(api.users.updateEffectiveStatus);
  const { userData } = useCurrentUser();

  useEffect(() => {
    if (!userData) return;

    if (self) {
      markStatus({ status: "online", userId: userData?._id });
    }
    console.log("self: ", self);

    const handleUnload = () => {
      markStatus({ status: "offline", userId: userData?._id });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [self]);

  return null;
};
