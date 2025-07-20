"use client";

import { Loader } from "@/components/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUserDetailsById } from "@/features/auth/api/useUserDetailsById";
import { motion } from "framer-motion";
import { AlertTriangleIcon, MailIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

interface FriendProfileProps {
  friendId: Id<"users">;
  onClose: () => void;
}

export const FriendProfile = ({ friendId, onClose }: FriendProfileProps) => {
  const { data: userData, isLoading: isLoadingUserData } = useUserDetailsById({
    userId: friendId,
  });

  if (isLoadingUserData) {
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

  if (!userData) {
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

  const avatarFallback = userData.name?.[0];

  return (
    <>
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
              <AvatarImage src={userData.image} className="rounded-2xl" />
              <AvatarFallback className="rounded-2xl bg-[#5170ff] text-white font-mono font-black text-4xl">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            {/* Decorative elements */}
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#7ed957] border-2 border-black rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>

        {/* User Info & Actions */}
        <div className="flex flex-col p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-mono font-black text-black uppercase tracking-wide">
              {userData.name}
            </h3>
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
                  href={`mailto:${userData.email}`}
                  className="text-sm font-mono font-bold text-[#5170ff] hover:text-[#4060ef] hover:underline transition-colors duration-200 uppercase tracking-wide">
                  {userData.email}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative floating elements */}
        <motion.div
          className="absolute bottom-4 right-4 w-4 h-4 bg-[#7ed957] border-2 border-black rounded-lg opacity-30"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>
    </>
  );
};
