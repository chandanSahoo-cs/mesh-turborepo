import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useEffect, useState } from "react";
import { Loader } from "../Loader";

import { useVoiceRoom } from "@/features/voice/store/useVoiceRoom";
import { useVoiceRoomProps } from "@/features/voice/store/useVoiceRoomProps";
import { livekitRoomRef } from "@/lib/livekitRoomRef";
import { cn } from "@/lib/utils";
import { RoomContext, VideoConference } from "@livekit/components-react";
import { Room } from "livekit-client";

export const VoiceRoom = () => {
  const { userData } = useCurrentUser();
  const [token, setToken] = useState("");

  const { props } = useVoiceRoomProps();
  const { isOpen } = useVoiceRoom();

  const { channelId, serverId, friendId, type, video, audio } = props;

  const [room] = useState(() => {
    const r = new Room();
    livekitRoomRef.current = r;
    return r;
  });

  useEffect(() => {
    console.log("mounted");

    return ()=>{
      console.log("unmounted");
    }
  },[]);

  useEffect(() => {
    if (!userData) return;
    let roomName;
    if (type === "server") {
      roomName = type + String(serverId) + String(channelId);
    } else {
      const [u1, u2] = [friendId, userData._id].sort();
      roomName = type + String(u1) + String(u2);
    }

    const name = userData.name;

    (async () => {
      try {
        const response = await fetch(
          `/api/livekit?room=${roomName}&username=${name}`
        );
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [userData, props.channelId, props.serverId, props.friendId, props.type]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      if (room.state === "connected") {
        await room.disconnect();
      }
      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

      if (video) {
        await room.localParticipant.setCameraEnabled(true);
      }

      if (audio) {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
    })();
  }, [token, audio, video]);

  if ((!props.channelId || !props.serverId) && !props.friendId) {
    return null;
  }

  if (token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader message="Creating a room for your call..." />
      </div>
    );
  }

  return (
    <div
      className={cn("h-[100vh]", !isOpen && "hidden")}
      data-lk-theme="default">
      <RoomContext.Provider value={room}>
        <VideoConference />
      </RoomContext.Provider>
    </div>
  );
};
