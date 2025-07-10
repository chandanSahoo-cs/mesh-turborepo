"use client";

import { useGetWorkspaceById } from "@/features/workspaces/api/useGetWorkspaceById";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";

interface WorkspaceIdPageProps {
  params: {
    workspaceId: string;
  };
}

const WorkspaceIdPage = ({ params }: WorkspaceIdPageProps) => {
  const workspaceId = useWorkspaceId();
  const { data } = useGetWorkspaceById({ id: workspaceId });

  return (
    <div>
        <div>
            Data: {JSON.stringify(data)}
        </div>
    </div>
  )
};

export default WorkspaceIdPage;
