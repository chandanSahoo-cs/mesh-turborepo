import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetRoleByMemberIdProps {
  serverMemberId: Id<"serverMembers">;
}

export const useGetRoleByMemberId = ({
  serverMemberId,
}: UseGetRoleByMemberIdProps) => {
  const data = useQuery(api.roles.getRoleByMemberId, {
    serverMemberId,
  });
  const isLoading = data === undefined;

  return { data, isLoading };
};
