import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  serverConversation?: Doc<"serverConversations"> | null;
}

interface RequestType {
  serverId: Id<"servers">;
  memberId: Id<"serverMembers">;
}

interface Options {
  onSuccess?: ({ serverConversation }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useCreateOrGetConversation = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const createOrGet = useMutation(
    api.serverConversation.createOrGetConversation
  );

  const createOrGetConversation = useCallback(
    async (
      { serverId, memberId }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await createOrGet({
          serverId,
          memberId,
        });

        setData({ serverConversation: response });
        onSuccess?.({ serverConversation: response });
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
    createOrGetConversation,
    data,
    error,
    isPending,
  };
};
