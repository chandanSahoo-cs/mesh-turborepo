import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useSelf } from "@liveblocks/react";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

export const PresenceTracker = () => {
  const self = useSelf();
  // console.log("self: ", self);

  const markStatus = useMutation(api.users.updateEffectiveStatus);
  const { userData } = useCurrentUser();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  

  useEffect(() => {
    if (!userData) return;

    if (self) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      markStatus({ status: "online", userId: userData._id });
    } else {
      timeoutRef.current = setTimeout(() => {
        markStatus({ status: "offline", userId: userData._id });
        timeoutRef.current = null;
      }, 10000);
    }

    const handleUnload = () => {
      markStatus({ status: "offline", userId: userData._id });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [self]);

  return null;
};
