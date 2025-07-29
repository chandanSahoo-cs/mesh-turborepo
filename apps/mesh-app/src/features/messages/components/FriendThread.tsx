import { Loader } from "@/components/Loader";
import { FriendThreadRoom } from "@/components/rooms/FriendThreadRoom";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { useCreateFriendMessage } from "@/features/friendMessages/api/useCreateFriendMessage";
import { useGetFriendMessageById } from "@/features/friendMessages/api/useGetFriendMessageById";
import { useGetFriendMessages } from "@/features/friendMessages/api/useGetFriendMessages";
import { useGenerateUploadUrl } from "@/features/upload/api/useGenerateUploadUrl";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { AlertTriangleIcon, XIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useRef, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { Message } from "../../../app/friends/[friendId]/components/Message";

import { errorToast } from "@/lib/toast";
import { motion } from "framer-motion";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface ThreadProps {
  friendMessageId: Id<"friendMessages">;
  onClose: () => void;
}

type CreateMessageValue = {
  body?: string;
  image: Id<"_storage"> | undefined;
  parentMessageId: Id<"friendMessages">;
};

const TIME_THRESHOLD = 5;

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  return format(date, "EEEE, MMMM d");
};

export const FriendThread = ({ friendMessageId, onClose }: ThreadProps) => {
  const { userData } = useCurrentUser();

  const { createFriendMessage } = useCreateFriendMessage();
  const { generateUploadUrl } = useGenerateUploadUrl();

  const [editingId, setEditingId] = useState<Id<"friendMessages"> | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [editorKey, setEditorKey] = useState(0);

  const { data: parentMessage, isLoading: parentMessageLoading } =
    useGetFriendMessageById({ friendMessageId });

  const { results, status, loadMore } = useGetFriendMessages({
    parentMessageId: friendMessageId,
  });

  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  const editorRef = useRef<Quill | null>(null);

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    try {
      setIsPending(true);
      editorRef?.current?.enable(false);

      const values: CreateMessageValue = {
        parentMessageId: friendMessageId,
        body,
        image: undefined,
      };

      if (image) {
        const url = await generateUploadUrl();

        if (!url) {
          throw new Error("URL not found");
        }

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });

        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await result.json();

        values.image = storageId;
      }

      await createFriendMessage(values, { throwError: true });

      setEditorKey((prevKey) => prevKey + 1);
    } catch {
      errorToast("Failed to send message");
    } finally {
      setIsPending(false);
      editorRef?.current?.enable(true);
    }
  };

  const groupedMessages = results?.reduce(
    (groups, message) => {
      const date = new Date(message?._creationTime as number);
      const dateKey = format(date, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof results>
  );

  if (parentMessageLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button onClick={onClose} size="iconSm" variant="ghost">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <Loader message="Loading friend thread..."/>
      </div>
    );
  }

  if (!parentMessage) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-16 flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Thread
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onClose}
              className="size-10 p-2 bg-white text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 transition-all duration-200">
              <XIcon className="size-5" />
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-col gap-y-2 h-full items-center justify-center">
          <AlertTriangleIcon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Message not found</p>
        </div>
      </div>
    );
  }

  return (
    <FriendThreadRoom>
      <div className="h-full flex flex-col">
        <div className="h-16 flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Thread
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onClose}
              className="size-10 p-2 bg-white text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 transition-all duration-200">
              <XIcon className="size-5" />
            </Button>
          </motion.div>
        </div>
        <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
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
                const previousMessage = messages[index - 1];
                const isCompact =
                  previousMessage &&
                  previousMessage.user?._id === message.user?._id &&
                  differenceInMinutes(
                    new Date(message._creationTime),
                    new Date(previousMessage._creationTime)
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
                    hideThreadButton
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
          {isLoadingMore && <Loader />}
          <Message
            hideThreadButton
            authorId={parentMessage.userId}
            authorImage={parentMessage.user.image}
            authorName={parentMessage.user.name}
            isAuthor={parentMessage.userId === userData?._id}
            body={parentMessage.body}
            image={parentMessage.image}
            createdAt={parentMessage._creationTime}
            updatedAt={parentMessage.updatedAt}
            id={parentMessage._id}
            reactions={parentMessage.friendReactions}
            isEditing={editingId === parentMessage._id}
            setEditingId={setEditingId}
          />
        </div>
        <motion.div
          className="px-6 py-4 bg-[#fffce9] border-t-4 border-black"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          <Editor
            key={editorKey}
            onSubmit={handleSubmit}
            innerRef={editorRef}
            disabled={isPending}
            placeholder="Reply.."
          />
        </motion.div>
      </div>
    </FriendThreadRoom>
  );
};
