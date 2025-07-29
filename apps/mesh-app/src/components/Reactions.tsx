"use client"

import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember"
import { useServerId } from "@/hooks/useServerId"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import type { DedupedReaction } from "../../convex/messages"
import { Hint } from "./Hint"
import { EmojiPopover } from "./EmojiPopover"
import { MdOutlineAddReaction } from "react-icons/md"

interface ReactionProps {
  data: DedupedReaction[]
  onChange: (value: string) => void
}

export const Reactions = ({ data, onChange }: ReactionProps) => {
  const serverId = useServerId()
  const { data: currentMember } = useCurrentMember({ serverId })

  const currentMemberId = currentMember?._id

  if (data.length === 0 || !currentMemberId) {
    return null
  }

  return (
    <motion.div
      className="flex items-center gap-2 mt-2 mb-1 flex-wrap"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {data.map((reaction) => (
        <Hint
          key={reaction.reactionDetails._id}
          label={`${reaction.count} ${reaction.count === 1 ? "person" : "people"} reacted with ${reaction.value}`}
        >
          <motion.button
            onClick={() => onChange(reaction.value)}
            className={cn(
              "h-8 px-3 rounded-xl border-2 border-black font-mono font-bold text-sm flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 uppercase tracking-wide",
              reaction.memberIds.includes(currentMemberId)
                ? "bg-[#5170ff] text-white hover:bg-[#4060ef]"
                : "bg-white text-black hover:bg-[#fffce9]",
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-base">{reaction.value}</span>
            <span
              className={cn(
                "text-xs font-black",
                reaction.memberIds.includes(currentMemberId) ? "text-white" : "text-gray-600",
              )}
            >
              {reaction.count}
            </span>
          </motion.button>
        </Hint>
      ))}
      <EmojiPopover hint="Add reaction" onEmojiSelect={(emojiValue) => onChange(emojiValue)}>
        <motion.button
          className="h-8 px-3 rounded-xl bg-white border-2 border-black hover:border-[#7ed957] hover:bg-[#7ed957] text-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200 font-mono font-bold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MdOutlineAddReaction className="size-4" />
        </motion.button>
      </EmojiPopover>
    </motion.div>
  )
}
