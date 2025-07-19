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
    <div className="bg-[#481349] flex items-center justify-between h-10 p-1.5">
      <div className="flex-1" />
      <div className="min-w-[280px] max-[642px] grow-[2] shrink">
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="bg-accent/25 hover:bg-accent-25 w-full justify-start h-7 px-2">
          <SearchIcon className="size-4 text-white mr-2" />
          <span className="text-white text-xs">Search {data?.name}</span>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Typea a command or search..." />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
            <CommandGroup heading="Channels">
              {channels?.map(
                (channel) =>
                  channel.parentId && (
                    <CommandItem key={channel._id} asChild>
                      <Link
                        onClick={() => setOpen(false)}
                        href={`/servers/${serverId}/channel/${channel._id}`}>
                        {channel.name}
                      </Link>
                    </CommandItem>
                  )
              )}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Members">
              {members?.map((member) => (
                <CommandItem key={member._id} asChild>
                  <Link
                    onClick={() => setOpen(false)}
                    href={`/servers/${serverId}/member/${member._id}`}>
                    {member.memberInfo?.name}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
      <div className="ml-auto flex-1 flex items-center justify-end">
        <Button variant="transparent">
          <InfoIcon className="size-5 text-white" />
        </Button>
      </div>
    </div>
  );
};
