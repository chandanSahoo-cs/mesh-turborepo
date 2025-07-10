import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface RequestType {
  name: string;
}

interface ResponseType {
  id: Id<"workspace"> | null;
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useCreateWorkspace = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);
  const isSuccess = useMemo(() => status === "success", [status]);
  const isError = useMemo(() => status === "error", [status]);
  const isSettled = useMemo(() => status === "settled", [status]);

  const create = useMutation(api.workspaces.createWorkspaces);

  const createWorkspace = useCallback(
    async (
      { name }: RequestType,
      { onSuccess, onSettled, onError, throwError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        console.log("Creating workspace");
        const response = await create({ name });

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
    [create]
  );

  return {
    createWorkspace,
    data,
    error,
    isPending,
    isSuccess,
    isError,
    isSettled,
  };
};
