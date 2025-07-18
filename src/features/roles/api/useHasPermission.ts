import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ServerPermission } from "../../../../convex/schema";

interface UseHasPermissionProps {
  serverMemberId?: Id<"serverMembers">;
  permission: ServerPermission;
}

export const useHasPermission = ({
  serverMemberId,
  permission,
}: UseHasPermissionProps) => {
  const data = useQuery(
    api.roles.hasPermission,
    serverMemberId
      ? {
          serverMemberId,
          permission,
        }
      : "skip"
  );

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
