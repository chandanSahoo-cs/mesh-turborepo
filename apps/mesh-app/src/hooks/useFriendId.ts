import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

export const useFriendId = () => {
  const params = useParams();
  return params.friendId as Id<"users">;
};
