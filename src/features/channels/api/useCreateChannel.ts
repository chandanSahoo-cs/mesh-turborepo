import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  id: Id<"channels"> | null;
}

interface RequestType {
  serverId: Id<"servers">;
  name: string;
  type: "text" | "voice" | "category";
  categoryId?: Id<"channels">;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useCreateChannel = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const create = useMutation(api.channels.createChannel);

  const createChannel = useCallback(
    async (
      { serverId, name, type, categoryId }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await create({ serverId, name, type, categoryId });

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
    createChannel,
    data,
    error,
    isPending,
  };
};
