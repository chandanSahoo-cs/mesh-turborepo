"use client";

import { Loader } from "@/components/Loader";
import { useCreateOrGetFriendConversation } from "@/features/conversations/api/useCreateOrGetFriendConversation";
import { useFriendId } from "@/hooks/useFriendId";
import { motion } from "framer-motion";
import { TriangleAlertIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { Conversation } from "./components/Conversation";
import { errorToast } from "@/lib/toast";

const MemberIdPage = () => {
  const friendId = useFriendId();
  const [friendConversationId, setFriendConversationId] =
    useState<Id<"friendConversations"> | null>(null);
  const { createOrGetFriendConversation, isPending } =
    useCreateOrGetFriendConversation();

  useEffect(() => {
    createOrGetFriendConversation(
      {
        userId: friendId,
      },
      {
        onSuccess({ friendConversation }) {
          if (friendConversation)
            setFriendConversationId(friendConversation?._id);
        },
        onError() {
          errorToast("Failed to get conversation");
        },
      }
    );
  }, [friendId, createOrGetFriendConversation]);

  if (isPending) {
    return <Loader />;
  }

  if (!friendConversationId) {
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
            Conversation not found
          </span>
        </motion.div>
      </div>
    );
  }

  return <Conversation friendConversationId={friendConversationId} />;
};

export default MemberIdPage;
