import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetFriendRequestByIdProps {
  friendRequestId: Id<"friendRequests">;
}

export const useGetFriendRequestById = ({
  friendRequestId,
}: useGetFriendRequestByIdProps) => {
  const data = useQuery(api.friendRequests.getFriendRequestById, {
    friendRequestId,
  });
  const isLoading = data === undefined;

  return { data, isLoading };
};
