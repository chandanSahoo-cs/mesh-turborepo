import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface useGetMemberByIdProps {
  serverMemberId: Id<"serverMembers">;
}

export const useGetMemberById = ({ serverMemberId }: useGetMemberByIdProps) => {
  const data = useQuery(api.serverMembers.getMemberById, { serverMemberId });

  const isLoading = data === undefined;

  return {
    data,
    isLoading,
  };
};
