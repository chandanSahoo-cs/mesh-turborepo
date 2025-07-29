"use client";

import { MemberRoom } from "@/components/rooms/MemberRoom";
import type React from "react";

const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  return <MemberRoom>{children}</MemberRoom>;
};

export default MemberLayout;
