import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  friendConversation?: Doc<"friendConversations"> | null;
}

interface RequestType {
  userId: Id<"users">;
}

interface Options {
  onSuccess?: ({ friendConversation }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useCreateOrGetFriendConversation = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const createOrGet = useMutation(
    api.friendConversation.createOrGetFriendConversation
  );

  const createOrGetFriendConversation = useCallback(
    async (
      { userId }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await createOrGet({
          userId,
        });

        setData({ friendConversation: response });
        onSuccess?.({ friendConversation: response });
      } catch (error) {
        setError(error as Error);
        onError?.(error as Error);

        setStatus("error");
      } finally {
        setStatus("settled");
        onSettled?.();
      }
    },
    [createOrGet]
  );

  return {
    createOrGetFriendConversation,
    data,
    error,
    isPending,
  };
};
