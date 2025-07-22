import { usePaginatedQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const BATCH_SIZE = 20;

interface UseGetMessageProps {
  friendConversationId?: Id<"friendConversations">;
  parentMessageId?: Id<"friendMessages">;
}

export type GetFriendMessagesReturnType =
  (typeof api.friendMessages.getFriendMessages._returnType)["page"];

export const useGetFriendMessages = ({
  friendConversationId,
  parentMessageId,
}: UseGetMessageProps) => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.friendMessages.getFriendMessages,
    { friendConversationId, parentMessageId },
    { initialNumItems: BATCH_SIZE }
  );

  return {
    results,
    status,
    loadMore: () => loadMore(BATCH_SIZE),
  };
};
