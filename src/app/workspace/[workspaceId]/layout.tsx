"use client"

import { Toolbar } from "./components/Tootlbar";

interface WorkspaceIdLayoutProps {
    children:  React.ReactNode;
}

const WorkspaceLayout = ({children}: WorkspaceIdLayoutProps) => {
    return(
        <div className="h-full">
            <Toolbar/>
            {children}
        </div>
    );
}
 
export default WorkspaceLayout;