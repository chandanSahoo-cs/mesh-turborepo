"use client";

import { UserButton } from "@/features/auth/components/UserButton";
import {
  BellIcon,
  HomeIcon,
  MessagesSquareIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { ServerSwitcher } from "./ServerSwitcher";
import { SidebarButton } from "./SidebarButton";

export const Sidebar = () => {
  return (
    <aside className="w-[70px] h-full bg-white border-r-4 border-black flex flex-col gap-y-4 items-center pt-4 pb-4">
      <ServerSwitcher />
      <SidebarButton icon={HomeIcon} label="Home" isActive />
      <SidebarButton icon={MessagesSquareIcon} label="DMs" />
      <SidebarButton icon={BellIcon} label="Activity" />
      <SidebarButton icon={MoreHorizontalIcon} label="More" />
      <div className="flex flex-col items-center justify-center gap-y-1 mt-auto">
        <UserButton />
      </div>
    </aside>
  );
};
