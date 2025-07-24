import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

export const DefaultPresenceTracker = () => {
  const markStatus = useMutation(api.users.updateEffectiveStatus);
  const { userData } = useCurrentUser();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userData) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    markStatus({ status: "online", userId: userData._id });

    const handleUnload = () => {
      if (userData?._id) {
        navigator.sendBeacon(
          "/api/set-offline",
          new Blob([JSON.stringify({ userId: userData._id })], {
            type: "application/json",
          })
        );
      }
    };

    return () => {
      handleUnload();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [userData]);

  return null;
};
