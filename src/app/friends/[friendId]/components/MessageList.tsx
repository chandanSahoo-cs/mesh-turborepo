"use client";

import { FriendHero } from "@/components/FriendHero";
import { Loader } from "@/components/Loader";
import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { GetFriendMessagesReturnType } from "@/features/friendMessages/api/useGetFriendMessages";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Message } from "./Message";

const TIME_THRESHOLD = 5;

interface MessageListProps {
  friendName?: string;
  friendImage?: string;
  data: GetFriendMessagesReturnType | undefined;
  variant: "friend" | "thread";
  loadMore: () => void;
  isLoadingMore: boolean;
  canLoadMore: boolean;
}

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d");
};

export const MessageList = ({
  friendName,
  friendImage,
  variant = "friend",
  data,
  loadMore,
  isLoadingMore,
  canLoadMore,
}: MessageListProps) => {
  const { userData, isLoading: isLoadingUserData } = useCurrentUser();
  const [editingId, setEditingId] = useState<Id<"friendMessages"> | null>(null);

  const groupedMessages = data?.reduce(
    (groups, message) => {
      const date = new Date(message._creationTime);
      const dateKey = format(date, "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof data>
  );

  return (
    <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar bg-[#fffce9]">
      {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
        <div key={dateKey}>
          <motion.div
            className="text-center my-4 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}>
            <hr className="absolute top-1/2 left-0 right-0 border-t-2 border-black" />
            <motion.span
              className="relative inline-block bg-white px-4 py-2 rounded-xl text-sm font-mono font-black text-black border-4 border-black shadow-[4px_4px_0px_0px_#000000] uppercase tracking-wide"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}>
              {formatDateLabel(dateKey)}
            </motion.span>
          </motion.div>
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const isCompact =
              prevMessage &&
              prevMessage.user._id === message.user._id &&
              differenceInMinutes(
                new Date(message._creationTime),
                new Date(prevMessage._creationTime)
              ) < TIME_THRESHOLD;
            return (
              <Message
                key={message._id}
                id={message._id}
                authorId={message.userId}
                authorImage={message.user.image}
                authorName={message.user.name}
                isAuthor={message.userId === userData?._id}
                reactions={message.friendReactions}
                body={message.body}
                image={message.image}
                updatedAt={message.updatedAt}
                createdAt={message._creationTime}
                isEditing={editingId === message._id}
                setEditingId={setEditingId}
                isCompact={isCompact}
                hideThreadButton={variant === "thread"}
                threadCount={message.threadCount}
                threadImage={message.threadImage}
                threadName={message.threadName}
                threadTimestamp={message.threadTimestamp}
              />
            );
          })}
        </div>
      ))}
      <div
        className="h-1"
        ref={(el) => {
          if (el) {
            const observer = new IntersectionObserver(
              ([entry]) => {
                if (entry.isIntersecting && canLoadMore) {
                  loadMore();
                }
              },
              { threshold: 1.0 }
            );
            observer.observe(el);
            return () => observer.disconnect();
          }
        }}
      />
      {isLoadingMore && <Loader message="Loading more messages..." />}
      {variant === "friend" && friendName && (
        <FriendHero name={friendName} image={friendImage} />
      )}
    </div>
  );
};
