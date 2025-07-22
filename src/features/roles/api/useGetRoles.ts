import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetRolesProps {
  serverId: Id<"servers">;
}

export const useGetRoles = ({ serverId }: UseGetRolesProps) => {
  const data = useQuery(api.roles.getRoles, {
    serverId,
  });
  const isLoading = data === undefined;

  return { data, isLoading };
};
