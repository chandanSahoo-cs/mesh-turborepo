"use client";

import { useGetChannelById } from "@/features/channels/api/useGetChannelById";
import { useChannelId } from "@/hooks/useChannelId";
import { LoaderIcon, TriangleAlertIcon } from "lucide-react";
import { Header } from "./components/Header";

const ChannelIdPage = () => {
  const channelId = useChannelId();
  console.log("channelId:", channelId);
  const { data: channel, isLoading: channelLoading } = useGetChannelById({
    channelId: channelId,
  });

  console.log("channel", channel);
  if (channelLoading) {
    return (
      <div className="h-full flex flex-1 items-center justify-center">
        <LoaderIcon className="animate-spin size-5 text-muted-foreground" />
      </div>
    );
  }
  if (!channel) {
    return (
      <div className="h-full flex flex-1 flex-col gap-y-2 items-center justify-center">
        <TriangleAlertIcon className="size-5 text-destructive" />
        <span className="text-sm text-muted-foreground">Channel not found</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <Header channelName={channel.name} />
      <div className="flex-1" />
    </div>
  );
};

export default ChannelIdPage;
