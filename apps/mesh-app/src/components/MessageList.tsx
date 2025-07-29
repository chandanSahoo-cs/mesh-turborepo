"use client"

import type { GetMessagesReturnType } from "@/features/messages/api/useGetMessages"
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember"
import { useServerId } from "@/hooks/useServerId"
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns"
import { useState } from "react"
import { motion } from "framer-motion"
import type { Id } from "../../convex/_generated/dataModel"
import { ChannelHero } from "./ChannelHero"
import { ConversationHero } from "./ConversationHero"
import { Loader } from "./Loader"
import { Message } from "./Message"

const TIME_THRESHOLD = 5

interface MessageListProps {
  memberName?: string
  memberImage?: string
  channelName?: string
  channelCreationTime?: number
  variant?: "channel" | "thread" | "conversation"
  data: GetMessagesReturnType | undefined
  loadMore: () => void
  isLoadingMore: boolean
  canLoadMore: boolean
}

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "EEEE, MMMM d")
}

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
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null)
  const serverId = useServerId()
  const { data: currentMember } = useCurrentMember({ serverId })

  const groupedMessages = data?.reduce(
    (groups, message) => {
      const date = new Date(message._creationTime)
      const dateKey = format(date, "yyyy-MM-dd")
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }

      groups[dateKey].unshift(message)
      return groups
    },
    {} as Record<string, typeof data>,
  )

  return (
    <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar bg-[#fffce9]">
      {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
        <div key={dateKey}>
          <motion.div
            className="text-center my-4 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <hr className="absolute top-1/2 left-0 right-0 border-t-2 border-black" />
            <motion.span
              className="relative inline-block bg-white px-4 py-2 rounded-xl text-sm font-mono font-black text-black border-4 border-black shadow-[4px_4px_0px_0px_#000000] uppercase tracking-wide"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {formatDateLabel(dateKey)}
            </motion.span>
          </motion.div>
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1]
            const isCompact =
              prevMessage &&
              prevMessage.user._id === message.user._id &&
              differenceInMinutes(new Date(message._creationTime), new Date(prevMessage._creationTime)) < TIME_THRESHOLD
            return (
              <Message
                key={message._id}
                id={message._id}
                serverMemberId={message.serverMemberId}
                authorImage={message.user.image}
                authorName={message.user.name}
                isAuthor={message.serverMemberId === currentMember?._id}
                reactions={message.reactions}
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
            )
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
                  loadMore()
                }
              },
              { threshold: 1.0 },
            )
            observer.observe(el)
            return () => observer.disconnect()
          }
        }}
      />
      {isLoadingMore && <Loader message="Loading more messages..." />}
      {variant === "channel" && channelName && channelCreationTime && (
        <ChannelHero name={channelName} creationTime={channelCreationTime} />
      )}
      {variant === "conversation" && memberName && <ConversationHero name={memberName} image={memberImage} />}
    </div>
  )
}
