"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useGetChannels } from "@/features/channels/api/useGetChannels";
import { useGetMembers } from "@/features/serverMembers/api/useGetMembers";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useMemberPanel } from "@/features/servers/store/useMemberPanel";
import { useVoiceRoomProps } from "@/features/voice/store/useVoiceRoomProps";
import { usePanel } from "@/hooks/usePanel";
import { useServerId } from "@/hooks/useServerId";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  HashIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
  Volume2Icon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";

export const Toolbar = () => {
  const serverId = useServerId();
  const { data } = useGetServerById({ id: serverId });
  const { data: channels } = useGetChannels({
    serverId,
  });
  const { data: members } = useGetMembers({
    serverId,
  });
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { onOpenMemberPanel } = usePanel();
  const { isOpen } = useMemberPanel();

  // Filter channels and members based on search query

  const categoryMap = new Map<Id<"channels">, string>();

  for (const category of channels || []) {
    const entry = categoryMap.get(category._id);
    if (!entry) {
      categoryMap.set(category._id, category.name);
    }
  }

  const filteredChannels = useMemo(() => {
    if (!channels || !searchQuery)
      return channels?.filter((channel) => channel.parentId) || [];
    return channels.filter(
      (channel) =>
        channel.parentId &&
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const filteredMembers = useMemo(() => {
    if (!members || !searchQuery) return members || [];
    return members.filter((member) =>
      member.memberInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const hasResults = filteredChannels.length > 0 || filteredMembers.length > 0;
  const { setProps } = useVoiceRoomProps();

  return (
    <>
      <div className="bg-[#fffce9] border-b-4 border-black flex items-center justify-between h-16 p-4">
        <div className="flex-1" />
        <div className="min-w-[280px] max-w-[642px] grow-[2] shrink">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setOpen(true)}
              className="bg-white hover:bg-white text-black font-mono font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#7ed957] hover:border-[#7ed957] w-full justify-start h-10 px-4 rounded-xl transition-all duration-200 uppercase tracking-wide">
              <SearchIcon className="size-4 text-black mr-3" />
              <span className="text-sm">Search {data?.name}</span>
            </Button>
          </motion.div>
        </div>
        <div className="ml-auto flex-1 flex items-center justify-end">
          <Button
            onClick={() => {
              onOpenMemberPanel(!isOpen);
            }}
            className={cn(
              "bg-transparent hover:bg-transparent text-black size-10 p-2 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000]",
              isOpen && "bg-[#5170ff] hover:bg-[#5170ff] text-white"
            )}>
            <UsersIcon className="size-5" />
          </Button>
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle/>
        <DialogContent className="p-0 border-6 border-black shadow-[12px_12px_0px_0px_#000000] rounded-3xl overflow-hidden messages-scrollbar max-w-2xl bg-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}>
            {/* Header with Input */}
            <div className="bg-[#fffce9] border-b-4 border-black p-8">
              <Input
                placeholder="Type a command or search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-4 border-black font-mono font-bold text-black placeholder:text-gray-500 rounded-xl bg-white shadow-[2px_2px_0px_0px_#000000] focus:shadow-[4px_4px_0px_0px_#5170ff] h-12 px-4 transition-all duration-200"
                autoFocus
              />
            </div>

            <div className="bg-white max-h-96 overflow-y-auto">
              {!hasResults && searchQuery && (
                <div className="font-mono font-bold text-black uppercase tracking-wide p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-16 bg-gray-100 border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#000000]">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <span>No results found</span>
                  </div>
                </div>
              )}

              {/* Channels Section */}
              {filteredChannels.length > 0 && (
                <>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b-3 border-black">
                      <div className="size-6 bg-[#5170ff] border-2 border-black rounded-lg flex items-center justify-center shadow-[1px_1px_0px_0px_#000000]">
                        <HashIcon className="size-3 text-white" />
                      </div>
                      <h3 className="font-mono font-black text-black uppercase tracking-wide text-sm">
                        Channels
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {filteredChannels.map((channel) => (
                        <div key={channel._id}>
                          {channel.type === "text" ? (
                            <Link
                              key={channel._id}
                              onClick={() => setOpen(false)}
                              href={`/servers/${serverId}/channel/${channel._id}`}
                              className="flex items-center gap-3 p-3 hover:bg-[#5170ff] hover:text-white rounded-xl hover:shadow-[3px_3px_0px_0px_#000000] transition-all duration-200 group border-3 border-transparent hover:border-black font-mono font-bold">
                              <div className="size-8 bg-white group-hover:bg-[#4060ef] border-2 border-black rounded-lg flex items-center justify-center shadow-[1px_1px_0px_0px_#000000] transition-all duration-200">
                                <HashIcon className="size-4 text-black group-hover:text-white" />
                              </div>
                              <div className="flex gap-5">
                                <span className="uppercase tracking-wide">
                                  {channel.name}
                                </span>
                                <span className="uppercase text-gray-500 text-[12px] ">
                                  @
                                  {channel.parentId &&
                                    categoryMap.get(channel.parentId)}
                                </span>
                              </div>
                            </Link>
                          ) : (
                            <div
                              key={channel._id}
                              onClick={() => {
                                setProps({
                                  channelId: channel._id,
                                  serverId,
                                  type: "server",
                                  audio: true,
                                  video: true,
                                });
                                setOpen(false);
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-[#5170ff] hover:text-white rounded-xl hover:shadow-[3px_3px_0px_0px_#000000] transition-all duration-200 group border-3 border-transparent hover:border-black font-mono font-bold">
                              <div className="size-8 bg-white group-hover:bg-[#4060ef] border-2 border-black rounded-lg flex items-center justify-center shadow-[1px_1px_0px_0px_#000000] transition-all duration-200">
                                <Volume2Icon className="size-4 text-black group-hover:text-white" />
                              </div>
                              <div className="flex gap-5">
                                <span className="uppercase tracking-wide">
                                  {channel.name}
                                </span>
                                <span className="uppercase text-gray-500 text-[12px] ">
                                  @
                                  {channel.parentId &&
                                    categoryMap.get(channel.parentId)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Members Section */}
              {filteredMembers.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b-3 border-black">
                    <div className="size-6 bg-[#7ed957] border-2 border-black rounded-lg flex items-center justify-center shadow-[1px_1px_0px_0px_#000000]">
                      <UserIcon className="size-3 text-black" />
                    </div>
                    <h3 className="font-mono font-black text-black uppercase tracking-wide text-sm">
                      Members
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <Link
                        key={member._id}
                        onClick={() => setOpen(false)}
                        href={`/servers/${serverId}/member/${member._id}`}
                        className="flex items-center gap-3 p-3 hover:bg-[#7ed957] hover:text-black rounded-xl hover:shadow-[3px_3px_0px_0px_#000000] transition-all duration-200 group border-3 border-transparent hover:border-black font-mono font-bold">
                        <div className="size-8 bg-white group-hover:bg-[#6bc946] border-2 border-black rounded-lg flex items-center justify-center shadow-[1px_1px_0px_0px_#000000] transition-all duration-200">
                          <UserIcon className="size-4 text-black" />
                        </div>
                        <span className="uppercase tracking-wide">
                          @{member.memberInfo?.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};
