import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetChannelsProps {
  serverId: Id<"servers">;
}

export const useGetChannels = ({ serverId }: UseGetChannelsProps) => {
  const data = useQuery(api.channels.getChannels, { serverId: serverId });
  const isLoading = data === undefined;

  return { data, isLoading };
};
