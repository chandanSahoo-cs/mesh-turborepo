import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetRoleByIdProps {
  serverId: Id<"servers">;
  roleId: Id<"roles">;
}

export const useGetRoleById = ({ serverId, roleId }: UseGetRoleByIdProps) => {
  const data = useQuery(api.roles.getRoleById, {
    serverId,
    roleId,
  });
  const isLoading = data === undefined;

  return { data, isLoading };
};
