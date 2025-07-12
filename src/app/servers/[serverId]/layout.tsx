"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Tootlbar";
import { ServerSidebar } from "./components/ServerSidebar";

interface ServerIdLayoutProps {
  children: React.ReactNode;
}

const ServerIdLayout = ({ children }: ServerIdLayoutProps) => {
  return (
    <div className="h-full">
      <Toolbar />
      <div className="flex h-[calc(100vh-40px)]">
        <Sidebar />
        <ResizablePanelGroup direction="horizontal" autoSaveId="mesh_server_layout">
          <ResizablePanel
          defaultSize={20}
          minSize={11}
          className="bg-[#5e2c5f]"
          >
            <ServerSidebar/>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize={20}>{children}</ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ServerIdLayout;
