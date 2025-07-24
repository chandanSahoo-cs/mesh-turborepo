"use client";

import type React from "react";

import { Loader } from "@/components/Loader";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Thread } from "@/features/messages/components/Thread";
import { Profile } from "@/features/serverMembers/components/Profile";
import { useMemberPanel } from "@/features/servers/store/useMemberPanel";
import { usePanel } from "@/hooks/usePanel";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MemberPanel } from "./components/MemberPanel";
import { ServerSidebar } from "./components/ServerSidebar";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Tootlbar";

interface ServerIdLayoutProps {
  children: React.ReactNode;
}

const ServerIdLayout = ({ children }: ServerIdLayoutProps) => {
  const { parentMessageId, profileMemberId, onClose } = usePanel();
  const { isOpen } = useMemberPanel();
  const showPanel = !!parentMessageId || !!profileMemberId || isOpen;

  return (
    <div className="h-full bg-[#fffce9]">
      <Toolbar />
      <div className="flex h-[calc(100vh-65px)]">
        <Sidebar />
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="mesh_server_layout">
          <ResizablePanel
            defaultSize={20}
            minSize={11}
            className="bg-white border-r-4 border-black">
            <ServerSidebar />
          </ResizablePanel>
          <ResizableHandle className="bg-transparent w-2 hover:bg-[#5170ff] transition-colors duration-200" />
          <ResizablePanel minSize={20} defaultSize={80} className="bg-white">
            {/* <VoiceRoom /> */}
            {children}
          </ResizablePanel>
          {showPanel && (
            <>
              <ResizableHandle className="bg-transparent w-2 hover:bg-[#7ed957] transition-colors duration-200" />
              <ResizablePanel
                minSize={20}
                defaultSize={29}
                className="bg-white border-l-4 border-black">
                {parentMessageId ? (
                  <Thread
                    messageId={parentMessageId as Id<"messages">}
                    onClose={onClose}
                  />
                ) : profileMemberId ? (
                  <Profile
                    serverMemberId={profileMemberId as Id<"serverMembers">}
                    onClose={onClose}
                  />
                ) : isOpen ? (
                  <MemberPanel />
                ) : (
                  <Loader />
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ServerIdLayout;
