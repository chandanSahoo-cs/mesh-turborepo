"use client";

import { Loader } from "@/components/Loader";
import { useGetMembers } from "@/features/serverMembers/api/useGetMembers";
import { useMemberId } from "@/hooks/useMemberId";
import { useServerId } from "@/hooks/useServerId";
import { motion } from "framer-motion";
import { AlertTriangleIcon } from "lucide-react";
import { ServerSection } from "./ServerSection";
import { UserItem } from "./UserItem";

export const MemberPanel = () => {
  const serverId = useServerId();
  const memberId = useMemberId();
  const { data: serverMembers, isLoading: isLoadingServerMembers } =
    useGetMembers({ serverId });

  if (isLoadingServerMembers) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="h-16 flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Members
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader message="Loading members" />
        </div>
      </div>
    );
  }

  if (!serverMembers) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="h-18 flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Members
          </h2>
        </div>
        <div className="flex flex-col gap-y-4 h-full items-center justify-center p-8">
          <motion.div
            className="bg-red-100 border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000000]"
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}>
            <AlertTriangleIcon className="size-8 text-red-600" />
          </motion.div>
          <p className="text-sm font-mono font-bold text-black uppercase tracking-wide text-center">
            Members not found
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="h-[70px] flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Members
          </h2>
        </div>
        <div className="flex flex-col bg-white h-full border-r-4 border-black">
          <ServerSection label="Members" hint="Members">
            {serverMembers?.map((serverMember) => (
              <div key={serverMember._id}>
                <UserItem
                  id={serverMember._id}
                  label={serverMember.memberInfo?.name}
                  image={serverMember.memberInfo?.image}
                  variant={serverMember._id === memberId ? "active" : "default"}
                />
              </div>
            ))}
          </ServerSection>
        </div>
      </div>
    </>
  );
};
