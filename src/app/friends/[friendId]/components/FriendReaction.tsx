"use client";

import { EmojiPopover } from "@/components/EmojiPopover";
import { Hint } from "@/components/Hint";
import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MdOutlineAddReaction } from "react-icons/md";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";

interface FriendReactionProps {
  data: Array<Doc<"friendReactions">>;
  onChange: (value: string) => void;
}

type ReactionMap = {
  reaction: Doc<"friendReactions">;
  count: number;
  users: Id<"users">[];
};

export const FriendReactions = ({ data, onChange }: FriendReactionProps) => {
  const { userData } = useCurrentUser();

  if (data.length === 0) {
    return null;
  }

  const reactionMap = new Map<string, ReactionMap>();

  for (const reaction of data) {
    const entry = reactionMap.get(reaction.value);

    if (entry) {
      entry.count++;
      entry.users.push(reaction.userId);
    } else {
      reactionMap.set(reaction.value, {
        users: [reaction.userId],
        reaction: reaction,
        count: 1,
      });
    }
  }

  const parsedReaction = [];

  for (const [key, value] of reactionMap) {
    const reaction = {
      reactionDetails: value.reaction,
      value: key,
      count: value.count,
      userIds: value.users,
    };
    parsedReaction.push(reaction);
  }

  return (
    <motion.div
      className="flex items-center gap-2 mt-2 mb-1 flex-wrap"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      {parsedReaction.map((reaction) => (
        <Hint
          key={reaction.reactionDetails._id}
          label={`Reacted with ${reaction.value}`}>
          <motion.button
            onClick={() => onChange(reaction.value)}
            className={cn(
              "h-8 px-3 rounded-xl border-2 border-black font-mono font-bold text-sm flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 uppercase tracking-wide",
              reaction.userIds.includes(userData?._id as Id<"users">)
                ? "bg-[#5170ff] text-white hover:bg-[#4060ef]"
                : "bg-white text-black hover:bg-[#fffce9]"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}>
            <span className="text-base">{reaction.value}</span>
            <span
              className={cn(
                "text-xs font-black",
                reaction.userIds.includes(userData?._id as Id<"users">)
                  ? "text-white"
                  : "text-gray-600"
              )}>
              {reaction.count}
            </span>
          </motion.button>
        </Hint>
      ))}
      <EmojiPopover
        hint="Add reaction"
        onEmojiSelect={(emoji) => onChange(emoji.native)}>
        <motion.button
          className="h-8 px-3 rounded-xl bg-white border-2 border-black hover:border-[#7ed957] hover:bg-[#7ed957] text-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 font-mono font-bold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          <MdOutlineAddReaction className="size-4" />
        </motion.button>
      </EmojiPopover>
    </motion.div>
  );
};
