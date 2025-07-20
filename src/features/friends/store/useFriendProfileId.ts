import { useQueryState } from "nuqs";

export const useFriendProfileId = () => {
  return useQueryState("friendProfileId");
};
