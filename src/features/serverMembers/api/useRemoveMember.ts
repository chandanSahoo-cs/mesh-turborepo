import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { removeMember } from "../../../../convex/serverMembers";

interface ResponseType {
  id: Id<"serverMembers"> | null;
}

interface RequestType {
  serverMemberId: Id<"serverMembers">;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useRemoveMember = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const isSuccess = useMemo(() => status === "success", [status]);
  const isError = useMemo(() => status === "error", [status]);
  const isSettled = useMemo(() => status === "settled", [status]);

  const remove = useMutation(api.serverMembers.removeMember);

  const removeMember = useCallback(
    async (
      { serverMemberId }: RequestType,
      { onSuccess, onSettled, onError, throwError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await remove({ serverMemberId });

        onSuccess?.({ id: response });
      } catch (error) {
        setError(error as Error);
        onError?.(error as Error);

        setStatus("error");

        if (throwError) {
          throw error;
        }
      } finally {
        setStatus("settled");
        onSettled?.();
      }
    },
    [remove]
  );

  return {
    removeMember,
    data,
    error,
    isPending,
    isSuccess,
    isError,
    isSettled,
  };
};
