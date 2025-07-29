"use client";

import { FriendRoom } from "@/components/rooms/FriendRoom";
import type React from "react";

const FriendLayout = ({ children }: { children: React.ReactNode }) => {
  return <FriendRoom>{children}</FriendRoom>;
};

export default FriendLayout;
