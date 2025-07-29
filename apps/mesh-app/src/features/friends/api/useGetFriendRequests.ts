import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { FriendRequestInfoType } from "../../../../convex/friendRequests";

export const useGetFriendRequests = () => {
  const data: FriendRequestInfoType = useQuery(api.friendRequests.getFriendRequests);
  const isLoading = data === undefined;

  return { data, isLoading };
};
