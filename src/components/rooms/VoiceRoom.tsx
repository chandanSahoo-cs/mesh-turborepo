import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useEffect, useState } from "react";
import { Loader } from "../Loader";

import { useVoiceRoomProps } from "@/features/voice/store/useVoiceRoomProps";
import { livekitRoomRef } from "@/lib/livekitRoomRef";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { Room } from "livekit-client";
import {
  ChevronDownIcon,
  LogOut,
  MessageCircleIcon,
  XIcon,
} from "lucide-react";

const room = livekitRoomRef.current;

export const handleScreenShare = () => {
  if (room?.localParticipant.isScreenShareEnabled) {
    room?.localParticipant.setScreenShareEnabled(false);
  } else room?.localParticipant.setScreenShareEnabled(true);
};

export const VoiceRoom = () => {
  const { userData } = useCurrentUser();
  const [token, setToken] = useState("");

  const { props, setProps } = useVoiceRoomProps();

  const { channelId, serverId, friendId, type, video, audio } = props;
  const [isIndicatorDismissed, setIsIndicatorDismissed] = useState(false);

  const handleDismissIndicator = () => {
    setIsIndicatorDismissed(true);
  };

  const [room] = useState(() => {
    const r = new Room();
    livekitRoomRef.current = r;
    return r;
  });

  console.log("renders");

  const handleLeave = () => {
    setProps({
      channelId: undefined,
      serverId: undefined,
      friendId: undefined,
      type: undefined,
      audio: undefined,
      video: undefined,
    });
  };

  useEffect(() => {
    if (!userData) return;
    if ((!props.channelId || !props.serverId) && !props.friendId) return;
    console.log("props:", props);

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
        if (room.state === "connected") {
          await room.disconnect();
        }
        const response = await fetch(
          `/api/livekit?room=${roomName}&username=${name}`
        );
        const data = await response.json();
        setToken(data.token);
      } catch (error) {}
    })();
  }, [props.channelId, props.serverId, props.friendId, props.type, token]);

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
    <div className="relative h-[100vh] bg-black" data-lk-theme="default">
      <LiveKitRoom
        token={token}
        video={video}
        audio={audio}
        room={room}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}>
        <button
          onClick={handleLeave}
          className="absolute top-4 left-4 z-50 bg-[#ff5252] hover:bg-[#fd3b3b] h-[40px] px-3 rounded-[12px] flex items-center gap-2 text-white">
          <LogOut className="size-4" />
          Leave
        </button>

        {!isIndicatorDismissed && (
          <div className="absolute bottom-20 right-4 z-40 animate-bounce">
            <div className="bg-[#5170ff] border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] p-3 flex items-center gap-2 text-white font-mono font-black uppercase tracking-wide text-sm relative">
              <MessageCircleIcon className="size-4" />
              <span>Scroll down for chat</span>
              <ChevronDownIcon className="size-4 animate-pulse" />

              {/* Close button */}
              <button
                onClick={handleDismissIndicator}
                className="ml-2 size-5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-md flex items-center justify-center transition-all duration-200">
                <XIcon className="size-3" />
              </button>
            </div>
          </div>
        )}
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};
