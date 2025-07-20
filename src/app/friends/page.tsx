"use client";

import { Loader } from "@/components/Loader";
import { useGetFriendRequests } from "@/features/friends/api/useGetFriendRequests";
import { FriendsContent } from "./components/FriendsContent";

const FriendsPage = () => {
  const { data: friendRequests, isLoading: isLoadingFriendRequest } =
    useGetFriendRequests();

  if (isLoadingFriendRequest) {
    return <Loader message="Loading friends..." />;
  }

  return <FriendsContent friendRequests={friendRequests} />;
};

export default FriendsPage;
