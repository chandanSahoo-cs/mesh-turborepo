import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ServerPermission } from "../../../../convex/schema";

interface useMemberPermissionsProps {
  memberId: Id<"serverMembers">;
  permission: ServerPermission;
}

export const useMemberPermissions = ({
  memberId,
  permission,
}: useMemberPermissionsProps) => {
  const isPermitted = useQuery(api.roles.hasPermission, {
    memberId,
    permission,
  });
  const isLoading = isPermitted === undefined;

  return {
    isPermitted,
    isLoading,
  };
};
