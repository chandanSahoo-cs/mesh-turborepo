import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetServerInfoProps {
  serverId: Id<"servers">;
}

export const useGetServerInfo = ({ serverId }: useGetServerInfoProps) => {
  const data = useQuery(api.servers.getServerInfoById, {
    serverId,
  });
  const isLoading = data === undefined;

  return { data, isLoading };
};
