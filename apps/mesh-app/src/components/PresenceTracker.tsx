"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useEffect } from "react";
import 'dotenv/config'

const PresenceTracker = () => {
  const { userData } = useCurrentUser();

  const wssurl = process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL || "";
  console.log("wssurl:", wssurl);

  useEffect(() => {
    if (!userData) return;
    const connect = async () => {
      const ws = new WebSocket(
        `wss://mesh-turborepo.onrender.com?userId=${userData?._id}`
      );
      ws.onopen = () => console.log("Connected to [WSS]");
      ws.onmessage = (msg) => console.log("Message:", msg.data);
      ws.onclose = () => console.log("Disconnected");
    };

    connect();
  }, [userData?._id]);

  return null;
};

export default PresenceTracker;
