"use client";

import { Loader } from "@/components/Loader";
import { useGetChannels } from "@/features/channels/api/useGetChannels";
import { useCreateChannelModal } from "@/features/channels/store/useCreateChannelModal";
import { useHasPermission } from "@/features/roles/api/useHasPermission";
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useServerId } from "@/hooks/useServerId";
import { motion } from "framer-motion";
import { TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const ServerIdPage = () => {
  const router = useRouter();
  const serverId = useServerId();
  const { isOpen, setIsOpen } = useCreateChannelModal();

  const { data: member, isLoading: memberLoading } = useCurrentMember({
    serverId,
  });
  const { data: server, isLoading: serverLoading } = useGetServerById({
    id: serverId,
  });
  const { data: channels, isLoading: channelsLoading } = useGetChannels({
    serverId,
  });
  const { data: isPermitted } = useHasPermission({
    serverMemberId: member?._id,
    permission: "MANAGE_CHANNELS",
  });

  const firstChannelId = useMemo(() => {
    for (const channel of channels || []) {
      if (channel.type !== "category" && channel.type !== "voice") {
        return channel._id;
      }
    }
  }, [channels]);

  useEffect(() => {
    if (serverLoading || channelsLoading || !server || !member || memberLoading)
      return;
    if (firstChannelId) {
      router.replace(`/servers/${serverId}/channel/${firstChannelId}`);
    } else if (!isOpen && isPermitted) {
      setIsOpen(true);
    }
  }, [
    isPermitted,
    member,
    memberLoading,
    channelsLoading,
    serverLoading,
    server,
    router,
    firstChannelId,
    isOpen,
    setIsOpen,
  ]);

  if (serverLoading || channelsLoading || memberLoading) {
    return <Loader />;
  }

  if (!server || !member) {
    return (
      <div className="h-full flex-1 flex items-center justify-center flex-col gap-6 bg-[#fffce9] p-8">
        <motion.div
          className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl p-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}>
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}>
            <TriangleAlertIcon className="size-16 text-red-500 border-4 border-black rounded-xl p-2 bg-red-100 shadow-[4px_4px_0px_0px_#000000]" />
          </motion.div>
          <span className="text-lg font-mono font-bold text-black uppercase tracking-wide text-center">
            Server not found
          </span>
          <p className="text-sm font-mono text-gray-700 text-center">
            The server you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex items-center justify-center flex-col gap-6 bg-[#fffce9] p-8">
      <motion.div
        className="bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl p-8 flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}>
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}>
          <TriangleAlertIcon className="size-16 text-orange-500 border-4 border-black rounded-xl p-2 bg-orange-100 shadow-[4px_4px_0px_0px_#000000]" />
        </motion.div>
        <span className="text-lg font-mono font-bold text-black uppercase tracking-wide text-center">
          No channel found
        </span>
        <p className="text-sm font-mono text-gray-700 text-center">
          This server doesn&apos;t have any channels yet. Create one to get
          started!
        </p>
      </motion.div>
    </div>
  );
};

export default ServerIdPage;
