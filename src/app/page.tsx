"use client";

import { UserButton } from "@/features/auth/components/UserButton";
import { useGetWorkspaces } from "@/features/workspaces/api/useGetWorkspaces";
import { useCreateWorkspaceModal } from "@/features/workspaces/store/useCreateWorkspaceModal";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function Home() {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCreateWorkspaceModal();

  const { workspaceData, isLoading } = useGetWorkspaces();
  const workspaceId = useMemo(() => workspaceData?.[0]?._id, [workspaceData]);

  useEffect(() => {
    if (isLoading) return;

    if (workspaceId) {
      router.replace(`/workspace/${workspaceId}`);
      setIsOpen(false);
    } else if (!isOpen) {
      setIsOpen(true);
      console.log("Open modal");
      console.log("isOpen: ", isOpen);
    }
  }, [workspaceId, isLoading, isOpen]);

  return (
    <div>
      <UserButton />
    </div>
  );
}
