import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  id: Id<"friendReactions"> | null;
}

interface RequestType {
  value: string;
  friendMessageId: Id<"friendMessages">;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useToggleFriendReaction = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const toggle = useMutation(api.friendReactions.toggleFriendReaction);

  const toggleFriendReaction = useCallback(
    async (
      { value, friendMessageId }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await toggle({ friendMessageId, value });

        onSuccess?.({ id: response });
      } catch (error) {
        setError(error as Error);
        onError?.(error as Error);

        setStatus("error");
      } finally {
        setStatus("settled");
        onSettled?.();
      }
    },
    [toggle]
  );

  return {
    toggleFriendReaction,
    data,
    error,
    isPending,
  };
};
