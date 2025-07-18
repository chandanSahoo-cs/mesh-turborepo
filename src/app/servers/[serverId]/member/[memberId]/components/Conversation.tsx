import { MessageList } from "@/components/MessageList";
import { useGetMessages } from "@/features/messages/api/useGetMessages";
import { useGetMemberById } from "@/features/serverMembers/api/useGetMemberById";
import { useMemberId } from "@/hooks/useMemberId";
import { usePanel } from "@/hooks/usePanel";
import { LoaderIcon, TriangleAlertIcon } from "lucide-react";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { ChatInput } from "./ChatInput";
import { Header } from "./Header";

interface ConversationProps {
  serverConversationId: Id<"serverConversations">;
}

export const Conversation = ({ serverConversationId }: ConversationProps) => {
  const serverMemberId = useMemberId();

  const { onOpenProfile } = usePanel();

  const { data: serverMember, isLoading: serverMemberLoading } =
    useGetMemberById({ serverMemberId });

  const { results, status, loadMore } = useGetMessages({
    conversationId: serverConversationId,
  });

  if (serverMemberLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!serverMember) {
    return (
      <div className="h-full flex-1 flex items-center justify-center flex-col gap-2">
        <TriangleAlertIcon className="size-6 text-destructive" />
        <span className="text-sm text-muted-foreground">Member not found</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        memberImage={serverMember.user?.image}
        memberName={serverMember.user?.name}
        onClick={() => onOpenProfile(serverMemberId)}
      />
      <MessageList
        data={results}
        variant="conversation"
        memberImage={serverMember.user?.image}
        memberName={serverMember.user?.name}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput
        placeholder={`Message ${serverMember.user?.name as string}`}
        conversationId={serverConversationId}
      />
    </div>
  );
};
