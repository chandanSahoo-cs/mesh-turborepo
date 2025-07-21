import { useQueryState } from "nuqs";
import { Id } from "../../../../convex/_generated/dataModel";

export const useParentMessageId = () => {
  return useQueryState("parentMessageId");
};
