import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseCurrentUserProps {
  userId?: Id<"users">;
}

export const useUserDetailsById= ({ userId }: UseCurrentUserProps) => {
  const data = useQuery(api.users.userDetailsById, userId ? {
    userId,
  }:"skip");
  const isLoading = data === undefined;

  return { isLoading, data };
};
