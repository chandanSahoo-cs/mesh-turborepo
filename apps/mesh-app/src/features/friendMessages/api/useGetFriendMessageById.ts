import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetFriendMessageByIdProps {
  friendMessageId: Id<"friendMessages">;
}

export const useGetFriendMessageById = ({
  friendMessageId,
}: UseGetFriendMessageByIdProps) => {
  const data = useQuery(api.friendMessages.getFriendMessageById, {
    friendMessageId,
  });

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
