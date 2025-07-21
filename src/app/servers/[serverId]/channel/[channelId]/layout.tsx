"use client"

import type React from "react"

import { ConversationRoom } from "@/components/ConversationRoom"

const ChannelLayout = ({ children }: { children: React.ReactNode }) => {
  return <ConversationRoom>{children}</ConversationRoom>
}

export default ChannelLayout
