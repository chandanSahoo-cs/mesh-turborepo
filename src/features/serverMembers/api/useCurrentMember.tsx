import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useCurrentMemberProps {
  serverId: Id<"servers">;
}

export const useCurrentMember = ({ serverId }: useCurrentMemberProps) => {
  const data = useQuery(api.serverMembers.getCurrentMember, { serverId });

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
