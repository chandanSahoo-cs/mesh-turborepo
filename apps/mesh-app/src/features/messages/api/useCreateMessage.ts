import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  id: Id<"messages"> | null;
}

interface RequestType {
  body?: string;
  image?: Id<"_storage">;
  serverId: Id<"servers">;
  channelId?: Id<"channels">;
  parentMessageId?: Id<"messages">;
  conversationId?: Id<"serverConversations">;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useCreateMessage = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const create = useMutation(api.messages.createMessage);

  const createMessage = useCallback(
    async (
      {
        body,
        image,
        serverId,
        channelId,
        parentMessageId,
        conversationId,
      }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await create({
          body,
          image,
          serverId,
          channelId,
          parentMessageId,
          conversationId,
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
    createMessage,
    data,
    error,
    isPending,
  };
};
