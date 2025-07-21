"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"

interface ConversationHeroProps {
  name?: string
  image?: string
}

export const ConversationHero = ({ name = "Member", image }: ConversationHeroProps) => {
  const avatarFallback = name.charAt(0).toUpperCase()

  return (
    <motion.div
      className="mt-[88px] mx-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]"
        whileHover={{ scale: 1.01}}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.div whileHover={{ scale: 1.05, rotate: 5 }} transition={{ duration: 0.2 }}>
            <Avatar className="size-16 border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_#000000]">
              <AvatarImage src={image || "/placeholder.svg"} className="rounded-lg" />
              <AvatarFallback className="rounded-lg bg-[#5170ff] text-white font-mono font-black text-2xl">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <h1 className="text-3xl font-mono font-black text-black uppercase tracking-wide">{name}</h1>
        </div>
        <div className="bg-[#fffce9] border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_#000000]">
          <p className="font-mono font-bold text-black text-sm uppercase tracking-wide leading-relaxed">
            This conversation is between you and <span className="text-[#5170ff]">{name}</span>. Please adhere to the
            server guidelines.
          </p>
        </div>
      </motion.div>

    </motion.div>
  )
}
