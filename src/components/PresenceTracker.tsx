"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useEffect } from "react";

const PresenceTracker = () => {
  const { userData } = useCurrentUser();

  const wssurl = process.env.WEBSOCKET_SERVER_URL;
  useEffect(() => {
    if (!userData) return;
    const connect = async () => {
      const ws = new WebSocket(`${wssurl}?userId=${userData?._id}`);
      ws.onopen = () => console.log("Connected to [WSS]");
      ws.onmessage = (msg) => console.log("Message:", msg.data);
      ws.onclose = () => console.log("Disconnected");
    };

    connect();
  }, [userData?._id]);

  return null;
};

export default PresenceTracker;
