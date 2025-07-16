//   channelName={channel.name}
//   channelCreationTime={channel._creationTime}
//   data={results}
//   loadMore={loadMore}
//   isLoadingMore={status === "LoadingMore"}
//   canLoadMore=

import { GetMessagesReturnType } from "@/features/messages/api/useGetMessages";
import { format, isToday, isYesterday } from "date-fns";
import { Message } from "./Message";

interface MessageListProps {
  memberName?: string;
  memberImage?: string;
  channelName: string;
  channelCreationTime: number;
  variant?: "channel" | "thread" | "conversation";
  data: GetMessagesReturnType | undefined;
  loadMore: () => void;
  isLoadingMore: boolean;
  canLoadMore: boolean;
}

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  return format(date, "EEEE, MMMM d");
};

export const MessageList = ({
  memberName,
  memberImage,
  channelName,
  channelCreationTime,
  variant = "channel",
  data,
  loadMore,
  isLoadingMore,
  canLoadMore,
}: MessageListProps) => {
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
    <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
      {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
        <div key={dateKey}>
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
              {formatDateLabel(dateKey)}
            </span>
          </div>
          {messages.map((message, index) => {
            return (
              <Message
                key={message._id}
                id={message._id}
                serverMemberId={message.serverMemberId}
                authorImage={message.user.image}
                authorName={message.user.name}
                // isAuthor={message.memberId === currentMember?._id}
                isAuthor={false}
                reactions={message.reactions}
                body={message.body}
                image={message.image}
                updatedAt={message.updatedAt}
                createdAt={message._creationTime}
                // isEditing={editingId === message._id}
                isEditing={false}
                // setEditingId={setEditingId}
                setEditingId={() => {}}
                // isCompact={isCompact}
                isCompact={false}
                hideThreadButton={variant === "thread"}
                threadCount={message.threadCount}
                threadImage={message.threadImage}
                // threadName={message.threadName}
                threadTimestamp={message.threadTimestamp}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
