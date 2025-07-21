import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  id: Id<"friendMessages"> | null;
}

interface RequestType {
  body?: string;
  image?: Id<"_storage">;
  parentMessageId?: Id<"friendMessages">;
  friendConversationId?: Id<"friendConversations">;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useCreateFriendMessage = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const create = useMutation(api.friendMessages.createFriendMessage);

  const createFriendMessage = useCallback(
    async (
      { body, image, parentMessageId, friendConversationId }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await create({
          body,
          image,
          parentMessageId,
          friendConversationId,
        });

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
    [create]
  );

  return {
    createFriendMessage,
    data,
    error,
    isPending,
  };
};
