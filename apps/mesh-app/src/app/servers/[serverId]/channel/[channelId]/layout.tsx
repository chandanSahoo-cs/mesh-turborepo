"use client";

import type React from "react";

import { ChannelRoom } from "@/components/rooms/ChannelRoom";

const ChannelLayout = ({ children }: { children: React.ReactNode }) => {
  return <ChannelRoom>{children}</ChannelRoom>;
};

export default ChannelLayout;
