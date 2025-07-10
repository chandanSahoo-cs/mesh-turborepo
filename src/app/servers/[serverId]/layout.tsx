"use client";

import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Tootlbar";

interface ServerIdLayoutProps {
  children: React.ReactNode;
}

const ServerLayout = ({ children }: ServerIdLayoutProps) => {
  return (
    <div className="h-full">
      <Toolbar />
      <div className="flex h-[calc(100vh-40px)]">
        <Sidebar/>
        {children}
        </div>
    </div>
  );
};

export default ServerLayout;
