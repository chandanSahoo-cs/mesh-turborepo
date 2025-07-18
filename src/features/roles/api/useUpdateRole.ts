import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface ResponseType {
  id: Id<"serverMembers"> | null;
}

interface RequestType {
  serverMemberId: Id<"serverMembers">;
  roleId: Id<"roles">;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useUpdateRole = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const isSuccess = useMemo(() => status === "success", [status]);
  const isError = useMemo(() => status === "error", [status]);
  const isSettled = useMemo(() => status === "settled", [status]);

  const update = useMutation(api.roles.updateRole);

  const updateRole = useCallback(
    async (
      { serverMemberId, roleId }: RequestType,
      { onSuccess, onSettled, onError, throwError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await update({ serverMemberId, roleId });

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
    [update]
  );

  return {
    updateRole,
    data,
    error,
    isPending,
    isSuccess,
    isError,
    isSettled,
  };
};
