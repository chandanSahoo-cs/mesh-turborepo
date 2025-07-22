"use client";

import { Loader } from "@/components/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useHasPermission } from "@/features/roles/api/useHasPermission";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useConfirm } from "@/hooks/useConfirm";
import { useServerId } from "@/hooks/useServerId";
import { motion } from "framer-motion";
import { AlertTriangleIcon, MailIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentMember } from "../api/useCurrentMember";
import { useGetMemberById } from "../api/useGetMemberById";
import { useRemoveMember } from "../api/useRemoveMember";

interface ProfileProps {
  serverMemberId: Id<"serverMembers">;
  onClose: () => void;
}

export const Profile = ({ serverMemberId, onClose }: ProfileProps) => {
  const serverId = useServerId();
  const { data: server, isLoading: isLoadingServer } = useGetServerById({
    id: serverId,
  });

  const [LeaveDialog, confirmLeave] = useConfirm(
    "Leave Server",
    "Are you sure you want to leave this server?"
  );
  const [RemoveDialog, confirmRemove] = useConfirm(
    "Remove Member",
    "Are you sure you want to remove this member?"
  );
  const [UpdateDialog] = useConfirm(
    "Change Role",
    "Are you sure you want to change this member's role?"
  );

  const { data: currentMember, isLoading: isLoadingCurrentMember } =
    useCurrentMember({ serverId });
  const { data: profileMember, isLoading: isLoadingProfileMember } =
    useGetMemberById({ serverMemberId });
  const { removeMember } = useRemoveMember();

  const isCurrent =
    currentMember && profileMember
      ? currentMember?._id === profileMember._id
      : null;

  const { data: isPermitted, isLoading: isLoadingPermission } =
    useHasPermission({
      serverMemberId,
      permission: "MANAGE_MEMBERS",
    });

  const onRemove = async () => {
    const ok = await confirmRemove();
    if (!ok) {
      return;
    }
    if (server?.ownerId === profileMember?.userId) {
      toast.warning("Transfer ownership before leaving the server");
      return;
    }
    removeMember(
      {
        serverMemberId,
      },
      {
        onSuccess: () => {
          toast.success("Member removed");
          onClose();
        },
        onError: () => {
          toast.error("Failed to remove member");
        },
      }
    );
  };

  const onLeave = async () => {
    const ok = await confirmLeave();
    if (!ok) {
      return;
    }
    if (server?.ownerId === profileMember?.userId) {
      toast.warning("Transfer ownership before leaving the server");
      return;
    }
    removeMember(
      {
        serverMemberId,
      },
      {
        onSuccess: () => {
          toast.success("You left the server");
          onClose();
        },
        onError: () => {
          toast.error("Failed to leave the server");
        },
      }
    );
  };

  if (
    isLoadingCurrentMember ||
    isLoadingProfileMember ||
    isLoadingServer ||
    isLoadingPermission
  ) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="h-16 flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Profile
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onClose}
              className="size-10 p-2 bg-white text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 transition-all duration-200">
              <XIcon className="size-5" />
            </Button>
          </motion.div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader message="Loading profile..." />
        </div>
      </div>
    );
  }

  if (!profileMember || !server) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="h-16 flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Profile
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onClose}
              className="size-10 p-2 bg-white text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 transition-all duration-200">
              <XIcon className="size-5" />
            </Button>
          </motion.div>
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
            Profile not found
          </p>
        </div>
      </div>
    );
  }

  const avatarFallback = profileMember.user?.name?.[0] ?? "M";

  return (
    <>
      <RemoveDialog />
      <LeaveDialog />
      <UpdateDialog />
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="h-16 flex justify-between items-center px-6 border-b-4 border-black bg-[#fffce9]">
          <h2 className="text-lg font-mono font-black text-black uppercase tracking-wide">
            Profile
          </h2>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onClose}
              className="size-10 p-2 bg-white text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] hover:bg-gray-50 transition-all duration-200">
              <XIcon className="size-5" />
            </Button>
          </motion.div>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col p-6 items-center justify-center bg-[#fffce9] border-b-4 border-black">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="relative">
            <Avatar className="size-32 border-6 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000000]">
              <AvatarImage
                src={profileMember.user?.image || "/placeholder.svg"}
                className="rounded-2xl"
              />
              <AvatarFallback className="rounded-2xl bg-[#5170ff] text-white font-mono font-black text-4xl">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>

        {/* User Info & Actions */}
        <div className="flex flex-col p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-mono font-black text-black uppercase tracking-wide">
              {profileMember.user?.name}
            </h3>
            <p className="text-sm font-mono text-gray-700 mt-1">
              Server Member
            </p>
          </div>

          <div className="flex space-x-2 justify-around">
            {/* Action Buttons */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onLeave}
                className="w-40 bg-[#5a78ff] text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#3a5eff]">
                Add roles
              </Button>
            </motion.div>
            {isCurrent ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onLeave}
                  className="w-40 bg-red-400 text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-red-500">
                  Leave Server
                </Button>
              </motion.div>
            ) : isPermitted ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onRemove}
                  className="w-full bg-red-400 text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-red-500">
                  Remove Member
                </Button>
              </motion.div>
            ) : null}
          </div>
        </div>

        {/* Separator */}
        <Separator className="border-2 border-black mx-6" />

        {/* Contact Information */}
        <div className="flex flex-col p-6">
          <h4 className="text-sm font-mono font-black text-black uppercase tracking-wide mb-4">
            Contact Information
          </h4>
          <motion.div
            className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#5170ff] transition-all duration-200"
            whileHover={{ scale: 1.01 }}>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-[#5170ff] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
                <MailIcon className="size-5 text-white" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-mono font-bold text-gray-700 uppercase tracking-wide">
                  Email Address
                </p>
                <Link
                  href={`mailto:${profileMember.user?.email}`}
                  className="text-sm font-mono font-bold text-[#5170ff] hover:text-[#4060ef] hover:underline transition-colors duration-200 uppercase tracking-wide">
                  {profileMember.user?.email}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};
