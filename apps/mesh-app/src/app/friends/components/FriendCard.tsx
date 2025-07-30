"use client";

import { Hint } from "@/components/Hint";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAcceptFriendRequest } from "@/features/friends/api/useAcceptFriendRequest";
import { useBlockFriendRequest } from "@/features/friends/api/useBlockFriendRequest";
import { useRejectFriendRequest } from "@/features/friends/api/useRejectFriendRequest";
import { useUnblockFriendRequest } from "@/features/friends/api/useUnblockFriendReques";
import { useVoiceRoom } from "@/features/voice/store/useControl";
import { useVoiceRoomProps } from "@/features/voice/store/useVoiceRoomProps";
import { useConfirm } from "@/hooks/useConfirm";
import { usePanel } from "@/hooks/usePanel";
import { errorToast, successToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  BanIcon,
  CheckIcon,
  CircleMinusIcon,
  MessageSquareIcon,
  PhoneIcon,
  PhoneOffIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { friendUserRequestsType } from "../../../../convex/friendRequests";

interface RenderFriendCardProps {
  friend: friendUserRequestsType;
  type: "accepted" | "incoming" | "outgoing" | "blocked";
}

export const RenderFriendCard = ({ friend, type }: RenderFriendCardProps) => {
  const router = useRouter();
  const { onOpenFriendProfile } = usePanel();
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
        onSuccess: () => successToast("Friend request accepted!"),
        onError: () => errorToast("Failed to accept friend request"),
      }
    );
  };

  const handleRejected = (id: Id<"friendRequests">) => {
    rejectFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => successToast("Friend request rejected"),
        onError: () => errorToast("Failed to reject friend request"),
      }
    );
  };
  const [ConfirmDialog, confirm] = useConfirm("Are you sure?", "");

  const handleRemoved = async (id: Id<"friendRequests">) => {
    const ok = await confirm();
    if (!ok) return;

    rejectFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => successToast("Friend removed"),
        onError: () => errorToast("Failed to remove"),
      }
    );
  };

  const handleBlocked = async (id: Id<"friendRequests">) => {
    const ok = await confirm();
    if (!ok) return;

    blockFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => successToast("User blocked"),
        onError: () => errorToast("Failed to block user"),
      }
    );
  };

  const handleUnblocked = async (id: Id<"friendRequests">) => {
    const ok = await confirm();
    if (!ok) return;

    unblockFriendRequest(
      { friendRequestId: id },
      {
        onSuccess: () => successToast("User unblocked"),
        onError: () => errorToast("Failed to unblock user"),
      }
    );
  };

  const { props, setProps } = useVoiceRoomProps();

  const { isActive, setIsActive } = useVoiceRoom();

  const handleLeaveCall = async () => {
    setIsActive(false);
    setProps({
      type: undefined,
      friendId: undefined,
      audio: false,
      video: false,
    });
  };

  const handleJoinCall = async () => {
    setProps({
      type: "dm",
      friendId: friend.friendUserInfo?._id,
      audio: true,
      video: true,
    });
  };

  return (
    <>
      <ConfirmDialog />
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
                {(friend.friendUserInfo?.name as string)
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-mono font-bold text-black uppercase tracking-wide">
                {(friend.friendUserInfo?.name as string) || "Unknown User"}
              </h3>
              <p className="text-sm font-mono text-gray-600">
                {(friend.friendUserInfo?.email as string) || "No email"}
              </p>

              <div className="flex gap-2">
                <span
                  className={`inline-block px-2 py-1 rounded-lg text-xs font-mono font-black text-black border-2 border-black ${getStatusColor()} mt-1`}>
                  {getStatusText()}
                </span>
                <span
                  className={`inline-block px-2 py-1 rounded-lg text-xs font-mono font-black text-black border-2 border-black mt-1`}>
                  {friend.friendUserInfo?.effectiveStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {type === "incoming" && (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Hint label="Accept request">
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
                  </Hint>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Hint label="Reject request">
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
                  </Hint>
                </motion.div>
              </>
            )}

            {type === "accepted" && (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Hint label="Accept request">
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
                  </Hint>
                </motion.div>
                {/*eslint-disable-next-line @typescript-eslint/no-unused-expressions*/}
                {/*eslint-disable-next-line @typescript-eslint/no-unused-expressions*/}

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Hint
                    label={
                      isActive && props.friendId === friend.friendUserInfo?._id
                        ? "Call"
                        : "End call"
                    }>
                    <Button
                      onClick={(
                        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                      ) => {
                        e.stopPropagation();
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                        isActive &&
                        props.friendId === friend.friendUserInfo?._id
                          ? handleLeaveCall()
                          : handleJoinCall();
                      }}
                      className={cn(
                        "bg-[#7ed957] hover:bg-[#7ed957] text-white font-mono font-bold p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] transition-all",
                        isActive &&
                          props.friendId === friend.friendUserInfo?._id &&
                          "bg-red-400 hover:bg-red-500"
                      )}>
                      {!isActive ||
                      props.friendId !== friend.friendUserInfo?._id ? (
                        <PhoneIcon className="size-4" />
                      ) : (
                        <PhoneOffIcon className="size-4" />
                      )}
                    </Button>
                  </Hint>
                </motion.div>
              </>
            )}
            {type === "blocked" && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <Hint label="Block friend">
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
                </Hint>
              </motion.div>
            )}

            {type !== "blocked" && (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Hint label="Block friend">
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
                  </Hint>
                </motion.div>
                {type !== "incoming" && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}>
                    <Hint label="Cancel request">
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
                    </Hint>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};
