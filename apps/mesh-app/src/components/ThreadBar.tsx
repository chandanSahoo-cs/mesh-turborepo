"use client"

import { formatDistanceToNow } from "date-fns"
import { ChevronRightIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

interface ThreadBarProps {
  count?: number
  image?: string
  timestamp?: number
  name?: string
  onClick?: () => void
}

export const ThreadBar = ({ count, image, timestamp, name, onClick }: ThreadBarProps) => {
  const avatarFallback = name?.charAt(0).toUpperCase()

  if (!count || !timestamp) return null

  return (
    <motion.button
      onClick={onClick}
      className="p-3 rounded-xl hover:bg-white border-2 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_#000000] flex items-center justify-start group/thread-bar transition-all duration-200 max-w-[600px] mt-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Avatar className="size-8 shrink-0 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000]">
          <AvatarImage src={image || "/placeholder.svg"} className="rounded-md" />
          <AvatarFallback className="rounded-md bg-[#5170ff] text-white font-mono font-black text-sm">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-mono font-bold text-[#5170ff] hover:text-[#4060ef] hover:underline truncate uppercase tracking-wide transition-colors duration-200">
          {count} {count > 1 ? "replies" : "reply"}
        </span>
        <span className="text-xs font-mono font-bold text-gray-600 truncate group-hover/thread-bar:hidden block uppercase tracking-wide">
          Last reply {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
        <span className="text-xs font-mono font-bold text-[#7ed957] truncate group-hover/thread-bar:block hidden uppercase tracking-wide">
          View thread
        </span>
      </div>
      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
        <ChevronRightIcon className="size-5 text-gray-600 ml-auto opacity-0 group-hover/thread-bar:opacity-100 transition-all duration-200 shrink-0" />
      </motion.div>
    </motion.button>
  )
}
