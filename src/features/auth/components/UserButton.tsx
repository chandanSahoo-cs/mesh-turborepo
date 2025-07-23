"use client";
import { Loader } from "@/components/Loader";
import { handleScreenShare } from "@/components/rooms/VoiceRoom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useVoiceRoomProps } from "@/features/voice/store/useVoiceRoomProps";
import { livekitRoomRef } from "@/lib/livekitRoomRef";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion } from "framer-motion";
import {
  LogOut,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  Video,
  VideoOff,
} from "lucide-react";
import { useState } from "react";
import { ImExit } from "react-icons/im";
import { useCurrentUser } from "../api/useCurrentUser";

export const UserButton = () => {
  const { signOut } = useAuthActions();
  const { isLoading, userData } = useCurrentUser();

  // Voice control states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(true); // Set to true to show the indicator

  const { setProps } = useVoiceRoomProps();

  const room = livekitRoomRef.current;

  const handleLeaveRoom = () => {
    setProps({
      channelId: undefined,
      serverId: undefined,
      friendId: undefined,
      type: undefined,
      audio: undefined,
      video: undefined,
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!userData) {
    return null;
  }

  const { image, name } = userData;
  const avatarFallback = name?.charAt(0).toUpperCase();

  const nameToNumber = (name || "Anonymous")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const hue = Math.abs(nameToNumber) % 360;
  const color = `hsl(${hue},80%,60%)`;

  const handleMicToggle = () => {
    setIsMuted(!isMuted);
    console.log("Mic toggled:", !isMuted);
  };

  const handleVideoToggle = () => {
    setIsVideoOn(!isVideoOn);
    console.log("Video toggled:", !isVideoOn);
  };

  const handleScreenShareToggle = async () => {
    setIsScreenSharing(!isScreenSharing);
    handleScreenShare();
    console.log("Screen share toggled:", !isScreenSharing);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn("outline-none relative ", isInCall && "mr-2")}>
        <div className="relative">
          {/* Call Indicator */}
          {isInCall && (
            <motion.div
              className="absolute -top-2 -right-2 size-6 bg-[#7ed957] border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000000] flex items-center justify-center z-10"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}>
              <Phone className="size-3 text-black" />
            </motion.div>
          )}

          <Avatar className="size-12 relative overflow-hidden font-mono font-black text-xl rounded-xl flex items-center justify-center border-4 border-black transition-all duration-200 shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:border-black">
            <AvatarImage
              alt={name}
              src={image || "/placeholder.svg"}
              className="rounded-lg"
            />
            <AvatarFallback
              className="text-white font-mono font-black text-lg rounded-lg"
              style={{ backgroundColor: color }}>
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        side="top"
        className="w-72 ml-2 bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-2xl p-4 mb-4">
        {/* User Info Section */}
        <div className="flex items-center gap-3 p-3 bg-[#fffce9] border-4 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] mb-4">
          <Avatar className="size-14 border-3 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000]">
            <AvatarImage
              src={image || "/placeholder.svg"}
              className="rounded-lg"
            />
            <AvatarFallback
              className="text-white font-mono font-black text-lg rounded-lg"
              style={{ backgroundColor: color }}>
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-mono font-black text-black uppercase tracking-wide text-base">
              {name}
            </p>
            <p className="font-mono font-bold text-gray-600 text-sm normal-case">
              {isInCall ? "In a call" : "Online"}
            </p>
          </div>
        </div>

        {isInCall && (
          <div className="space-y-3 mb-4">
            <h3 className="font-mono font-black text-black uppercase tracking-wide text-sm px-2">
              Voice Controls
            </h3>

            {/* Microphone Control */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleMicToggle}
                className={`w-full flex items-center justify-between p-4 border-4 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 ${
                  isMuted
                    ? "bg-red-400 hover:bg-red-500 text-black"
                    : "bg-white hover:bg-gray-50 text-black"
                }`}>
                <div className="flex items-center gap-3">
                  {isMuted ? (
                    <MicOff className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                  <span className="font-mono font-black uppercase tracking-wide text-sm">
                    {isMuted ? "Unmute" : "Mute"}
                  </span>
                </div>
              </Button>
            </motion.div>

            {/* Video Control */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleVideoToggle}
                className={`w-full flex items-center justify-between p-4 border-4 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 ${
                  isVideoOn
                    ? "bg-[#5170ff] hover:bg-[#4060ef] text-white"
                    : "bg-white hover:bg-gray-50 text-black"
                }`}>
                <div className="flex items-center gap-3">
                  {isVideoOn ? (
                    <Video className="size-5" />
                  ) : (
                    <VideoOff className="size-5" />
                  )}
                  <span className="font-mono font-black uppercase tracking-wide text-sm">
                    {isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
                  </span>
                </div>
              </Button>
            </motion.div>

            {/* Screen Share Control */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleScreenShareToggle}
                className={`w-full flex items-center justify-between p-4 border-4 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 ${
                  isScreenSharing
                    ? "bg-[#7ed957] hover:bg-[#6bc946] text-black"
                    : "bg-white hover:bg-gray-50 text-black"
                }`}>
                <div className="flex items-center gap-3">
                  {isScreenSharing ? (
                    <Monitor className="size-5" />
                  ) : (
                    <MonitorOff className="size-5" />
                  )}
                  <span className="font-mono font-black uppercase tracking-wide text-sm">
                    {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                  </span>
                </div>
              </Button>
            </motion.div>
            {/*Leave Call */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleLeaveRoom()}
                className="w-full bg-red-400 hover:bg-red-500 flex items-center justify-between p-4 border-4 border-black rounded-xl shadow-[3px_3px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200">
                <div className="flex items-center gap-3">
                  <ImExit />
                  <span className="font-mono font-black uppercase tracking-wide text-sm">
                    Leave Call
                  </span>
                </div>
              </Button>
            </motion.div>
          </div>
        )}

        <Separator className="border-2 border-black my-4" />

        {/* Logout Section */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <DropdownMenuItem
            onClick={() => signOut()}
            className="font-mono font-bold text-black hover:bg-red-100 rounded-xl p-4 cursor-pointer transition-colors border-3 border-transparent hover:border-black hover:shadow-[3px_3px_0px_0px_#000000] w-full">
            <LogOut className="size-5 mr-3" />
            <span className="uppercase tracking-wide">Log out</span>
          </DropdownMenuItem>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
