"use client";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useGetChannels } from "@/features/channels/api/useGetChannels";
import { useGetMembers } from "@/features/serverMembers/api/useGetMembers";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useServerId } from "@/hooks/useServerId";
import { CommandItem } from "cmdk";
import { motion } from "framer-motion";
import { InfoIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

  return (
    <div className="bg-[#fffce9] border-b-4 border-black flex items-center justify-between h-12 px-4">
      <div className="flex-1" />
      <div className="min-w-[280px] max-w-[642px] grow-[2] shrink">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setOpen(true)}
            className="bg-white text-black font-mono font-bold border-4 border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#5170ff] hover:border-[#5170ff] w-full justify-start h-10 px-4 rounded-xl transition-all duration-200 uppercase tracking-wide">
            <SearchIcon className="size-4 text-black mr-3" />
            <span className="text-sm">Search {data?.name}</span>
          </Button>
        </motion.div>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <div className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl overflow-hidden">
            <CommandInput
              placeholder="Type a command or search..."
              className="border-0 border-b-4 border-black font-mono font-bold text-black placeholder:text-gray-500 rounded-none bg-[#fffce9]"
            />
            <CommandList className="bg-white">
              <CommandEmpty className="font-mono font-bold text-black uppercase tracking-wide p-4">
                No results found
              </CommandEmpty>
              <CommandGroup
                heading="Channels"
                className="font-mono font-black text-black uppercase tracking-wide border-b-2 border-black">
                {channels?.map(
                  (channel) =>
                    channel.parentId && (
                      <CommandItem
                        key={channel._id}
                        asChild
                        className="font-mono font-bold hover:bg-[#5170ff] hover:text-white rounded-lg mx-2 my-1">
                        <Link
                          onClick={() => setOpen(false)}
                          href={`/servers/${serverId}/channel/${channel._id}`}>
                          # {channel.name}
                        </Link>
                      </CommandItem>
                    )
                )}
              </CommandGroup>
              <CommandSeparator className="border-2 border-black" />
              <CommandGroup
                heading="Members"
                className="font-mono font-black text-black uppercase tracking-wide">
                {members?.map((member) => (
                  <CommandItem
                    key={member._id}
                    asChild
                    className="font-mono font-bold hover:bg-[#7ed957] hover:text-black rounded-lg mx-2 my-1">
                    <Link
                      onClick={() => setOpen(false)}
                      href={`/servers/${serverId}/member/${member._id}`}>
                      @ {member.memberInfo?.name}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        </CommandDialog>
      </div>
      <div className="ml-auto flex-1 flex items-center justify-end">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="transparent"
            className="size-10 p-2 hover:bg-[#5170ff] hover:text-white border-2 border-transparent hover:border-black hover:rounded-xl hover:shadow-[2px_2px_0px_0px_#000000] transition-all duration-200">
            <InfoIcon className="size-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
