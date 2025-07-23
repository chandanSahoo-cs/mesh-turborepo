import { create } from "zustand";
import { Id } from "../../../../convex/_generated/dataModel";

type PropsType = {
  serverId?: Id<"servers">;
  channelId?: Id<"channels">;
  friendId?: Id<"users">;
  type?: "server" | "dm";
  video?: boolean;
  audio?: boolean;
};

interface VoiceRoomProps {
  props: PropsType;
  setProps: (props: PropsType) => void;
}

export const useVoiceRoomProps = create<VoiceRoomProps>((set) => ({
  props: {
    serverId: undefined,
    channelId: undefined,
    friendId: undefined,
    type: undefined,
    video: undefined,
    audio: undefined,
  },
  setProps: (props) => set({ props }),
}));
