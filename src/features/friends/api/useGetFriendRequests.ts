import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export const useGetFriendRequests = () => {
  const data = useQuery(api.friendRequests.getFriendRequests);
  const isLoading = data === undefined;

  return { data, isLoading };
};
