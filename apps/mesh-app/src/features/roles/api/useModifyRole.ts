import { useMutation } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ServerPermission } from "../../../../convex/schema";

interface ResponseType {
  id: Id<"roles"> | null;
}

interface RequestType {
  roleId: Id<"roles">;
  serverId: Id<"servers">;
  permissions: ServerPermission[];
}

interface Options {
  onSuccess?: ({ id }: ResponseType) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  throwError?: boolean;
}

type Status = "success" | "error" | "settled" | "pending" | null;

export const useModifyRole = () => {
  const [data, setData] = useState<ResponseType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [status, setStatus] = useState<Status>(null);

  const isPending = useMemo(() => status === "pending", [status]);

  const modify = useMutation(api.roles.modifyRole);

  const modifyRole = useCallback(
    async (
      { roleId, serverId, permissions }: RequestType,
      { onSuccess, onSettled, onError }: Options
    ) => {
      try {
        setData(null);
        setError(null);

        setStatus("pending");
        const response = await modify({ roleId, serverId, permissions });

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
    [modify]
  );

  return {
    modifyRole,
    data,
    error,
    isPending,
  };
};
