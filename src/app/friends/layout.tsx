"use client";

import { AuthenticatedRoom } from "@/components/AuthenticatedRoom";
import { Loader } from "@/components/Loader";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { usePanel } from "@/hooks/usePanel";
import { Id } from "../../../convex/_generated/dataModel";
import { FriendThread } from "../../features/messages/components/FriendThread";
import { Sidebar } from "../servers/[serverId]/components/Sidebar";
import { FriendProfile } from "./components/FriendProfile";

interface FriendsPageLayoutProps {
  children: React.ReactNode;
}

const FriendsPageLayout = ({ children }: FriendsPageLayoutProps) => {
  const { friendProfileId, parentMessageId, onClose } = usePanel();
  const showPanel = !!parentMessageId || !!friendProfileId;
  return (
    // <AuthenticatedRoom>
      <div className="h-full bg-[#fffce9]">
        <div className="flex h-full">
          <Sidebar />
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId="friends_layout">
            <ResizablePanel minSize={20} defaultSize={80} className="bg-white">
              {children}
            </ResizablePanel>
            {showPanel && (
              <>
                <ResizableHandle className="bg-transparent w-2 hover:bg-[#7ed957] transition-colors duration-200" />
                <ResizablePanel
                  minSize={20}
                  defaultSize={29}
                  className="bg-white border-l-4 border-black">
                  {friendProfileId ? (
                    <FriendProfile
                      friendId={friendProfileId as Id<"users">}
                      onClose={onClose}
                    />
                  ) : parentMessageId ? (
                    <FriendThread
                      friendMessageId={parentMessageId as Id<"friendMessages">}
                      onClose={onClose}
                    />
                  ) : (
                    <Loader />
                  )}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    // </AuthenticatedRoom>
  );
};

export default FriendsPageLayout;
