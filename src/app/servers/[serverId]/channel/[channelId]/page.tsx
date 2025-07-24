"use client";

import { Loader } from "@/components/Loader";
import { MessageList } from "@/components/MessageList";
import { useGetChannelById } from "@/features/channels/api/useGetChannelById";
import { useGetMessages } from "@/features/messages/api/useGetMessages";
import { useChannelId } from "@/hooks/useChannelId";
import { motion } from "framer-motion";
import { TriangleAlertIcon } from "lucide-react";
import { ChatInput } from "./components/ChatInput";
import { Header } from "./components/Header";

const ChannelIdPage = () => {
  const channelId = useChannelId();
  const { data: channel, isLoading: channelLoading } = useGetChannelById({
    channelId: channelId,
  });
  const { results, status, loadMore } = useGetMessages({ channelId });

  if (channelLoading || status === "LoadingFirstPage") {
    return <Loader message="Loading channel..." />;
  }

  if (!channel) {
    return (
      <div className="h-full flex flex-1 flex-col gap-y-6 items-center justify-center bg-[#fffce9] p-8">
        <motion.div
          className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl p-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}>
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}>
            <TriangleAlertIcon className="size-16 text-red-500 border-4 border-black rounded-xl p-2 bg-red-100 shadow-[4px_4px_0px_0px_#000000]" />
          </motion.div>
          <span className="text-lg font-mono font-bold text-black uppercase tracking-wide text-center">
            Channel not found
          </span>
          <p className="text-sm font-mono text-gray-700 text-center">
            The channel you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header channelName={channel.name} />

      {channel.type === "text" && (
        <>
          <MessageList
            channelName={channel.name}
            channelCreationTime={channel._creationTime}
            data={results}
            loadMore={loadMore}
            isLoadingMore={status === "LoadingMore"}
            canLoadMore={status === "CanLoadMore"}
          />
          <ChatInput placeholder={`Message # ${channel.name}`} />
        </>
      )}
    </div>
  );
};

export default ChannelIdPage;
