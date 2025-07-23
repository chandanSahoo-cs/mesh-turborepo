"use client";

import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetChannels } from "@/features/channels/api/useGetChannels";
import { CreateCategoryModal } from "@/features/channels/components/CreateCategoryModal";
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useGetMembers } from "@/features/serverMembers/api/useGetMembers";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useChannelId } from "@/hooks/useChannelId";
import { useMemberId } from "@/hooks/useMemberId";
import { useServerId } from "@/hooks/useServerId";
import { motion } from "framer-motion";
import {
  AlertTriangleIcon,
  HashIcon,
  PlusIcon,
  Volume2Icon,
} from "lucide-react";
import { useState } from "react";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { ServerHeader } from "./ServerHeader";
import { ServerSection } from "./ServerSection";
import { SidebarItem } from "./SidebarItem";
import { UserItem } from "./UserItem";

export const ServerSidebar = () => {
  const serverId = useServerId();
  const channelID = useChannelId();
  const memberId = useMemberId();

  const { data: currentMember, isLoading: currentMemberLoading } =
    useCurrentMember({
      serverId,
    });
  const { data: server, isLoading: serverLoading } = useGetServerById({
    id: serverId,
  });

  const { data: channels } = useGetChannels({
    serverId,
  });

  const { data: serverMembers } = useGetMembers({
    serverId,
  });

  const [isOpen, setIsOpen] = useState(false);

  const categoryInfoMap = new Map<Id<"channels">, Doc<"channels">>();
  const categoryChannelMap = new Map<Id<"channels">, Array<Doc<"channels">>>();

  for (const category of channels || []) {
    if (category.type !== "category") continue;
    categoryInfoMap.set(category._id, category);
    categoryChannelMap.set(category._id, []);
  }

  for (const channel of channels || []) {
    if (channel.type === "category") continue;
    categoryChannelMap.get(channel.parentId!)?.push(channel);
  }

  if (serverLoading || currentMemberLoading) {
    return <Loader message="Loading channel list..." />;
  }

  if (!server || !currentMember) {
    return (
      <div className="flex flex-col gap-y-4 bg-white h-full items-center justify-center p-6">
        <motion.div
          className="bg-red-100 border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000000]"
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}>
          <AlertTriangleIcon className="size-8 text-red-600" />
        </motion.div>
        <p className="text-black text-sm font-mono font-bold uppercase tracking-wide text-center">
          Server not found
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white h-full border-r-4 border-black">
      <ServerHeader server={server} member={currentMember} />
      <div className="p-3 space-y-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => {
              setIsOpen(true);
            }}
            className="w-full bg-[#7ed957] text-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:bg-[#7ed957] font-mono font-black uppercase tracking-wide py-2 h-10 transition-all duration-200 flex items-center justify-center gap-2 text-xs">
            <PlusIcon className="size-4" />
            Create Category
          </Button>
        </motion.div>
      </div>
      <CreateCategoryModal isOpen={isOpen} setIsOpen={setIsOpen} />
      {Array.from(categoryChannelMap.entries()).map(
        ([categoryId, channels]) => (
          <div key={categoryId}>
            <ServerSection
              label={categoryInfoMap.get(categoryId)?.name || "Category"}
              hint="New channel"
              categoryId={categoryId}>
              {channels?.map((channelItem) => (
                <SidebarItem
                  key={channelItem._id}
                  icon={channelItem.type === "text" ? HashIcon : Volume2Icon}
                  label={channelItem.name}
                  id={channelItem._id}
                  variant={channelID === channelItem._id ? "active" : "default"}
                />
              ))}
            </ServerSection>
            <Separator className="border-2 border-black" />
          </div>
        )
      )}
    </div>
  );
};
