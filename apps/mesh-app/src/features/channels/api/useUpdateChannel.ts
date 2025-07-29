import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  id: Id<"channels"> | null;
}

interface RequestType {
  channelId: Id<"channels">;
  name: string;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useRenameChannel = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const rename = useMutation(api.channels.renameChannel);

  const renameChannel = useCallback(
    async (
      { channelId, name }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await rename({ channelId, name });

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
    [rename]
  );

  return {
    renameChannel,
    data,
    error,
    isPending,
  };
};
