"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FaChevronDown } from "react-icons/fa"

interface HeaderProps {
  friendImage?: string
  friendName?: string
  onClick?: () => void
}

export const Header = ({ friendImage, friendName, onClick }: HeaderProps) => {
  const avatarFallback = friendName?.charAt(0).toUpperCase()

  return (
    <div className="bg-[#fffce9] border-b-4 border-black h-16 flex items-center px-6 overflow-hidden relative">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="transparent"
          className="font-mono font-black text-lg w-auto p-3 overflow-hidden text-black hover:bg-white hover:border-4 hover:border-black hover:rounded-xl hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200"
          size="sm"
          onClick={onClick}
        >
          <Avatar className="size-8 mr-3 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000]">
            <AvatarImage src={friendImage || "/placeholder.svg"} className="rounded-lg" />
            <AvatarFallback className="rounded-lg bg-[#5170ff] text-white font-mono font-black text-sm">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <span className="truncate uppercase tracking-wide">{friendName || "Member"}</span>
          <FaChevronDown className="size-3 ml-2 shrink-0" />
        </Button>
      </motion.div>
    </div>
  )
}
