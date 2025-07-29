import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

export const useServerId = () => {
  const params = useParams();
  return params.serverId as Id<"servers">;
};
