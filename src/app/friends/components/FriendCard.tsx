"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAcceptFriendRequest } from "@/features/friends/api/useAcceptFriendRequest";
import { useBlockFriendRequest } from "@/features/friends/api/useBlockFriendRequest";
import { useRejectFriendRequest } from "@/features/friends/api/useRejectFriendRequest";
import { useUnblockFriendRequest } from "@/features/friends/api/useUnblockFriendReques";
import { usePanel } from "@/hooks/usePanel";
import { motion } from "framer-motion";
import {
  BanIcon,
  CheckIcon,
  CircleMinusIcon,
  MessageSquareIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";
import { friendUserRequestsType } from "../../../../convex/friendRequests";

interface RenderFriendCardProps {
  friend: friendUserRequestsType;
  type: "accepted" | "incoming" | "outgoing" | "blocked";
}

export const RenderFriendCard = ({ friend, type }: RenderFriendCardProps) => {
  const router = useRouter();
  const { onOpenFriendProfile, onClose } = usePanel();
  const getStatusColor = () => {
    switch (type) {
      case "accepted":
        return "bg-[#7ed957]";
      case "incoming":
        return "bg-[#5170ff]";
      case "outgoing":
        return "bg-orange-400";
      case "blocked":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (type) {
      case "accepted":
        return "Friend";
      case "incoming":
        return "Incoming";
      case "outgoing":
        return "Outgoing";
      case "blocked":
        return "Blocked";
      default:
        return "Unknown";
    }
  };

  const { acceptFriendRequest, isPending: acceptingFriendRequest } =
    useAcceptFriendRequest();
  const { rejectFriendRequest, isPending: rejectingFriendRequest } =
    useRejectFriendRequest();
  const { blockFriendRequest, isPending: blockingFriendRequest } =
    useBlockFriendRequest();
  const { unblockFriendRequest, isPending: unblockingFriendRequest } =
    useUnblockFriendRequest();

  const handleAccepted = (id: Id<"friendRequests">) => {
    acceptFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => toast.success("Friend request accepted!"),
        onError: () => toast.error("Failed to accept friend request"),
      }
    );
  };

  const handleRejected = (id: Id<"friendRequests">) => {
    rejectFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => toast.success("Friend request rejected"),
        onError: () => toast.error("Failed to reject friend request"),
      }
    );
  };

  const handleRemoved = (id: Id<"friendRequests">) => {
    rejectFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => toast.success("Friend removed"),
        onError: () => toast.error("Failed to remove"),
      }
    );
  };

  const handleBlocked = (id: Id<"friendRequests">) => {
    blockFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => toast.success("User blocked"),
        onError: () => toast.error("Failed to block user"),
      }
    );
  };

  const handleUnblocked = (id: Id<"friendRequests">) => {
    unblockFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => toast.success("User unblocked"),
        onError: () => toast.error("Failed to unblock user"),
      }
    );
  };

  return (
    <motion.div
      key={friend._id}
      className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#5170ff] transition-all duration-200"
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}>
      <div
        className="flex items-center justify-between"
        onClick={() =>
          onOpenFriendProfile(friend.friendUserInfo?._id as Id<"users">)
        }>
        <div className="flex items-center gap-3">
          <Avatar className="size-12 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000000]">
            <AvatarImage src={friend.friendUserInfo?.image} />
            <AvatarFallback className="bg-[#5170ff] text-white font-mono font-black">
              {(friend.friendUserInfo?.name as string).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-mono font-bold text-black uppercase tracking-wide">
              {(friend.friendUserInfo?.name as string) || "Unknown User"}
            </h3>
            <p className="text-sm font-mono text-gray-600">
              {(friend.friendUserInfo?.email as string) || "No email"}
            </p>
            <span
              className={`inline-block px-2 py-1 rounded-lg text-xs font-mono font-black text-black border-2 border-black ${getStatusColor()} mt-1`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {type === "incoming" && (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={(
                    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                  ) => {
                    e.stopPropagation();
                    handleAccepted(friend._id);
                  }}
                  disabled={acceptingFriendRequest}
                  className="bg-[#7ed957] hover:bg-[#7ed957] text-black font-mono font-bold p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all">
                  <CheckIcon className="size-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={(
                    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                  ) => {
                    e.stopPropagation();
                    handleRejected(friend._id);
                  }}
                  disabled={rejectingFriendRequest}
                  className="bg-red-400 hover:bg-red-400 text-black font-mono font-bold p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all">
                  <XIcon className="size-4" />
                </Button>
              </motion.div>
            </>
          )}

          {type === "accepted" && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                  e.stopPropagation();
                  router.push(`/friends/${friend.friendUserInfo?._id}`);
                }}
                className="bg-[#5170ff] hover:bg-[#5170ff] text-white font-mono font-bold p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all">
                <MessageSquareIcon className="size-4" />
              </Button>
            </motion.div>
          )}

          {type === "blocked" && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                  e.stopPropagation();
                  handleUnblocked(friend._id);
                }}
                disabled={unblockingFriendRequest}
                className="bg-[#7ed957] hover:bg-[#7ed957] text-black font-mono font-bold p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all">
                Unblock
              </Button>
            </motion.div>
          )}

          {type !== "blocked" && (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={(
                    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                  ) => {
                    e.stopPropagation();
                    handleBlocked(friend._id);
                  }}
                  disabled={blockingFriendRequest}
                  className="bg-white hover:bg-white text-black font-mono font-bold p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all">
                  <BanIcon className="size-4" />
                </Button>
              </motion.div>
              {type !== "incoming" && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={(
                      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                    ) => {
                      e.stopPropagation();
                      handleRemoved(friend._id);
                    }}
                    disabled={rejectingFriendRequest}
                    className="bg-white hover:bg-white text-black font-mono font-bold p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all">
                    <CircleMinusIcon className="size-4" />
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
