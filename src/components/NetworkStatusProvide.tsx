"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

const PING_URL = "/api/ping";

async function checkOnline(): Promise<boolean> {
  try {
    const res = await fetch(PING_URL, {
      method: "HEAD",
      cache: "no-store",
    });
    return res.status === 204;
  } catch (error) {
    return false;
  }
}

export const NetworkStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const updateStatus = useMutation(api.users.updateEffectiveStatus);
  const { userData } = useCurrentUser();

  useEffect(() => {
    if (!userData) return;

    const poll = async () => {
      const online = (await checkOnline()) && !!userData;

      updateStatus({
        status: online ? "online" : "offline",
        userId: userData._id,
      });
    };

    poll();

    const intervalId = setInterval(poll, 30000);

    const data = JSON.stringify({ userId: userData._id });
    const blob = new Blob([data], { type: "application/json" });

    const unload = () => {
      navigator.sendBeacon("/api/status/offline", blob);
    };

    window.addEventListener("online", poll);
    window.addEventListener("offline", poll);
    window.addEventListener("beforeunload", unload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", poll);
      window.removeEventListener("offline", poll);
      window.removeEventListener("beforeunload", unload);
    };
  }, [userData?._id, updateStatus]);

  return <>{children}</>;
};
