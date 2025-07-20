"use client";

import { BackgroundAnimations } from "@/components/BackgroundAnimations";
import { Loader } from "@/components/Loader";
import { useGetServers } from "@/features/servers/api/useGetServers";
import { useCreateServerModal } from "@/features/servers/store/useCreateServerModal";
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

  if (isLoading) {
    return <Loader />;
  }

  return <BackgroundAnimations />;
}
