"use client";

import { Button } from "@/components/ui/button";
import { useVoiceRoom } from "@/features/voice/store/useVoiceRoom";
import { useVoiceRoomProps } from "@/features/voice/store/useVoiceRoomProps";
import { useServerId } from "@/hooks/useServerId";
import { livekitRoomRef } from "@/lib/liveKitRoomRef";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { IconType } from "react-icons/lib";
import { Doc } from "../../../../../convex/_generated/dataModel";

interface SidebarItemProps {
  label: string;
  icon: LucideIcon | IconType;
  channelItem?: Doc<"channels">;
  variant?: VariantProps<typeof sidebarItemVariants>["variant"];
}

const sidebarItemVariants = cva(
  "flex items-center justify-start text-sm font-mono font-bold gap-2 h-9 px-3 overflow-hidden rounded-xl border-2 transition-all duration-200 mb-1",
  {
    variants: {
      variant: {
        default:
          "text-black border-transparent hover:border-[#5170ff] hover:bg-[#5170ff]/20 hover:shadow-[2px_2px_0px_0px_#5170ff]",
        active:
          "bg-[#5170ff] hover:bg-[#5170ff] text-white border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:scale-102",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const SidebarItem = ({
  label,
  icon: Icon,
  channelItem,
  variant,
}: SidebarItemProps) => {
  const serverId = useServerId();

  const { setIsOpen } = useVoiceRoom();
  const { setProps } = useVoiceRoomProps();

  // const {room} = useCustomLiveKitRoom()

  const handleVoiceChannel = async () => {
    setIsOpen(true);
    setProps({
      type: "server",
      serverId: serverId,
      channelId: channelItem?._id,
      audio: true,
      video: true,
    });
  };

  return (
    <motion.div
      whileHover={{ scale: variant === "active" ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}>
      <Button
        variant="transparent"
        size="sm"
        className={cn(sidebarItemVariants({ variant }))}
        asChild>
        {channelItem ? (
          channelItem.type === "text" ? (
            <Link
              onClick={() => setIsOpen(false)}
              href={`/servers/${serverId}/channel/${channelItem._id}`}>
              <Icon className="size-4 mr-1 shrink-0" />
              <span className="text-sm truncate uppercase tracking-wide">
                {label}
              </span>
            </Link>
          ) : (
            <div
              onClick={() => handleVoiceChannel()}
              className="cursor-pointer">
              <Icon className="size-4 mr-1 shrink-0" />
              <span className="text-sm truncate uppercase tracking-wide">
                {label}
              </span>
            </div>
          )
        ) : (
          <div>
            <Icon className="size-4 mr-1 shrink-0" />
            <span className="text-sm truncate uppercase tracking-wide">
              {label}
            </span>
          </div>
        )}
      </Button>
    </motion.div>
  );
};
