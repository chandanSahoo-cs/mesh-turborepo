"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateFriendRequest } from "@/features/friends/api/useCreateFriendRequest";
import { motion } from "framer-motion";
import { MailIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  FriendRequestInfoType,
  friendUserRequestsType,
} from "../../../../convex/friendRequests";
import { RenderFriendCard } from "./FriendCard";

interface FriendsContentProps {
  friendRequests: FriendRequestInfoType;
}

export const FriendsContent = ({ friendRequests }: FriendsContentProps) => {
  const [email, setEmail] = useState("");
  const [activeSection, setActiveSection] = useState<
    "all" | "pending" | "blocked" | "add"
  >("all");

  const { createFriendRequest, isPending: creatingFriendRequest } =
    useCreateFriendRequest();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createFriendRequest(
      { toUserEmail: email },
      {
        onSuccess: () => {
          toast.success("Friend request sent!");
          setEmail("");
        },
        onError: () => toast.error("Failed to send friend request"),
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b-4 border-black bg-[#fffce9]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono font-black text-2xl text-black uppercase tracking-wide">
              Friends
            </h1>
            <p className="font-mono text-gray-700 text-sm mt-1">
              Manage your friend connections
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {[
              {
                id: "all",
                label: "All",
                count: friendRequests?.acceptedFriendRequest?.length || 0,
              },
              {
                id: "pending",
                label: "Pending",
                count:
                  (friendRequests?.incomingRequests?.length || 0) +
                  (friendRequests?.outgoingRequests?.length || 0),
              },
              {
                id: "blocked",
                label: "Blocked",
                count: friendRequests?.blockedFriendRequest?.length || 0,
              },
              { id: "add", label: "Add Friend", count: 0 },
            ].map((tab) => (
              <motion.div
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`font-mono font-bold px-4 py-2 border-2 border-black rounded-lg transition-all uppercase tracking-wide ${
                    activeSection === tab.id
                      ? "bg-[#5170ff] text-white shadow-[4px_4px_0px_0px_#000000] hover:bg-[#5170ff]"
                      : "bg-white text-black hover:bg-[#5170ff]/20 hover:shadow-[2px_2px_0px_0px_#5170ff]"
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 px-2 py-1 bg-[#7ed957] text-black rounded-lg text-xs border-2 border-black">
                      {tab.count}
                    </span>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeSection === "add" && (
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_#000000]">
              <div className="text-center mb-6">
                <UserPlusIcon className="size-12 mx-auto mb-3 text-[#5170ff] border-2 border-black rounded-xl p-2 bg-[#5170ff]/20" />
                <h2 className="font-mono font-black text-xl text-black uppercase tracking-wide">
                  Add Friend
                </h2>
                <p className="font-mono text-gray-700 text-sm mt-2">
                  Send a friend request via email
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-mono font-bold text-black uppercase tracking-wide mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={creatingFriendRequest}
                    className="border-4 border-black rounded-xl font-mono font-bold shadow-[4px_4px_0px_0px_#000000] focus:shadow-[6px_6px_0px_0px_#7ed957] focus:border-[#7ed957] transition-all duration-200"
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={creatingFriendRequest || !email.trim()}
                    className="w-full bg-[#7ed957] text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#6ec947] flex items-center justify-center gap-2">
                    <MailIcon className="size-4" />
                    {creatingFriendRequest ? "Sending..." : "Send Request"}
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        )}

        {activeSection === "all" && (
          <div className="space-y-4">
            <h2 className="font-mono font-black text-lg text-black uppercase tracking-wide mb-4">
              All Friends ({friendRequests?.acceptedFriendRequest?.length || 0})
            </h2>
            {friendRequests?.acceptedFriendRequest?.map(
              (friend: friendUserRequestsType) => (
                <RenderFriendCard
                  friend={friend}
                  type="accepted"
                  key={friend._id}
                />
              )
            )}
          </div>
        )}

        {activeSection === "pending" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-mono font-black text-lg text-black uppercase tracking-wide mb-4">
                Incoming Requests (
                {friendRequests?.incomingRequests?.length || 0})
              </h2>
              <div className="space-y-4">
                {friendRequests?.incomingRequests?.map(
                  (friend: friendUserRequestsType) => (
                    <RenderFriendCard
                      friend={friend}
                      type="incoming"
                      key={friend._id}
                    />
                  )
                )}
              </div>
            </div>

            <div>
              <h2 className="font-mono font-black text-lg text-black uppercase tracking-wide mb-4">
                Outgoing Requests (
                {friendRequests?.outgoingRequests?.length || 0})
              </h2>
              <div className="space-y-4">
                {friendRequests?.outgoingRequests?.map(
                  (friend: friendUserRequestsType) => (
                    <RenderFriendCard
                      friend={friend}
                      type="outgoing"
                      key={friend._id}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === "blocked" && (
          <div className="space-y-4">
            <h2 className="font-mono font-black text-lg text-black uppercase tracking-wide mb-4">
              Blocked Users ({friendRequests?.blockedFriendRequest?.length || 0}
              )
            </h2>
            {friendRequests?.blockedFriendRequest?.map(
              (friend: friendUserRequestsType) => (
                <RenderFriendCard
                  friend={friend}
                  type="blocked"
                  key={friend._id}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
