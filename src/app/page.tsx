"use client";

import { useGetServers } from "@/features/servers/api/useGetServers";
import { useCreateServerModal } from "@/features/servers/store/useCreateServerModal";
import { LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function Home() {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCreateServerModal();

  const { serverData, isLoading } = useGetServers();
  const serverId = useMemo(() => serverData?.[0]?._id, [serverData]);

  useEffect(() => {
    if (isLoading) return;

    if (serverId) {
      setIsOpen(false);
      router.replace(`/servers/${serverId}`);
    } else if (!isOpen) {
      setIsOpen(true);
      console.log("Open modal");
      console.log("isOpen: ", isOpen);
    }
  }, [serverId, isLoading, isOpen, router]);

  return (
    <div>
      <div className="h-full flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
