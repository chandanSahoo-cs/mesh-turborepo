import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useEffect, useState } from "react";
import { Loader } from "../Loader";

import { useVoiceRoom } from "@/features/voice/store/useControl";
import { useVoiceRoomProps } from "@/features/voice/store/useVoiceRoomProps";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { Room } from "livekit-client";
import {
  ChevronDownIcon,
  LogOut,
  MessageCircleIcon,
  XIcon,
} from "lucide-react";

export const VoiceRoom = () => {
  const { userData } = useCurrentUser();
  const [token, setToken] = useState("");

  const { props, setProps } = useVoiceRoomProps();

  const { channelId, serverId, friendId, type, video, audio } = props;
  const [isIndicatorDismissed, setIsIndicatorDismissed] = useState(false);

  const handleDismissIndicator = () => {
    setIsIndicatorDismissed(true);
  };

  const [room, setRoom] = useState<Room | null>(null);

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

    const email = userData.email;
    const r = new Room();
    setRoom(r);

    (async () => {
      try {
        if (r.state === "connected") {
          await r.localParticipant.setCameraEnabled(false);
          await r.disconnect();
        }
        const response = await fetch(
          `/api/livekit?room=${roomName}&useremail=${email}`
        );
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [props.channelId, props.serverId, props.friendId, props.type]);

  const { setIsActive: roomActive } = useVoiceRoom();

  useEffect(() => {
    if (!room) {
      roomActive(false);
      return;
    }
    roomActive(true);
  }, [room]);

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
    room && (
      <div
        className="relative h-[100vh] bg-black border-[#ffee81] border-5"
        data-lk-theme="default">
        <LiveKitRoom
          token={token}
          video={video}
          audio={audio}
          room={room}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}>
          <button
            onClick={() => {
              if (!(room.state === "connected")) return;
              setRoom(null);
              room.disconnect();
              handleLeave();
            }}
            className="absolute top-4 left-4 z-50 bg-[#ff5252] hover:bg-[#fd3b3b] h-[40px] border-3 px-3 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] flex items-center gap-2 text-white hover:shadow-[4px_4px_0px_0px_#000000] transition-all">
            <LogOut className="size-4" />
            Leave
          </button>

          {!isIndicatorDismissed && (
            <div className="absolute bottom-5 right-4 z-40 animate-bounce cursor-pointer">
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

          {/* Hidden Element */}
          <div
            onClick={() =>
              room.localParticipant.setMicrophoneEnabled(
                !room.localParticipant.isMicrophoneEnabled
              )
            }
            className="hidden"
          />
          <div
            onClick={() => {
              room.localParticipant.setCameraEnabled(
                !room.localParticipant.isCameraEnabled
              );
            }}
            className="hidden"
          />
          <div
            onClick={() => {
              room.localParticipant.setScreenShareEnabled(
                !room.localParticipant.isScreenShareEnabled
              );
            }}
            className="hidden"
          />
          <VideoConference />
        </LiveKitRoom>
      </div>
    )
  );
};
