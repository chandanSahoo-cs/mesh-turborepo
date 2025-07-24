import { Loader } from "@/components/Loader";
import { useUserDetailsById } from "@/features/auth/api/useUserDetailsById";
import { useGetFriendMessages } from "@/features/friendMessages/api/useGetFriendMessages";
import { useFriendId } from "@/hooks/useFriendId";
import { usePanel } from "@/hooks/usePanel";
import { motion } from "framer-motion";
import { TriangleAlertIcon } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ChatInput } from "./ChatInput";
import { Header } from "./Header";
import { MessageList } from "./MessageList";

interface ConversationProps {
  friendConversationId: Id<"friendConversations">;
}

export const Conversation = ({ friendConversationId }: ConversationProps) => {
  const friendId = useFriendId();

  const { onOpenFriendProfile } = usePanel();

  const { data: friendUser, isLoading: isLoadingFriendUser } =
    useUserDetailsById({ userId: friendId });

  const { results, status, loadMore } = useGetFriendMessages({
    friendConversationId: friendConversationId,
  });

  if (isLoadingFriendUser || status === "LoadingFirstPage") {
    return <Loader message="Loading messages..." />;
  }

  if (!friendUser) {
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
            User not found
          </span>
          <p className="text-sm font-mono text-gray-700 text-center">
            The user you&apos;re looking for doesn&apos;t exist.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        friendImage={friendUser.image}
        friendName={friendUser.name}
        onClick={() => onOpenFriendProfile(friendId)}
      />
      <MessageList
        data={results}
        variant="friend"
        friendImage={friendUser.image}
        friendName={friendUser.name}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput
        placeholder={`Message ${friendUser.name as string}`}
        conversationId={friendConversationId}
      />
    </div>
  );
};
