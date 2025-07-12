import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetMembersProps {
  serverId: Id<"servers">;
}

export const useGetMembers = ({ serverId }: useGetMembersProps) => {
  const data = useQuery(api.serverMembers.getMembers, { serverId });

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
