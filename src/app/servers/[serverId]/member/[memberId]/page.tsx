"use client";

import { Loader } from "@/components/Loader";
import { useCreateOrGetConversation } from "@/features/conversations/api/useCreateOrGetConversation";
import { useMemberId } from "@/hooks/useMemberId";
import { useServerId } from "@/hooks/useServerId";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Conversation } from "./components/Conversation";

const MemberIdPage = () => {
  const serverId = useServerId();
  const memberId = useMemberId();

  const [serverConversationId, setServerConversationId] =
    useState<Id<"serverConversations"> | null>(null);
  const { createOrGetConversation, isPending } = useCreateOrGetConversation();

  useEffect(() => {
    createOrGetConversation(
      {
        serverId,
        memberId,
      },
      {
        onSuccess({ serverConversation }) {
          if (serverConversation)
            setServerConversationId(serverConversation?._id);
        },
        onError() {
          toast.error("Failed to get conversation");
        },
      }
    );
  }, [memberId, serverId, createOrGetConversation]);

  if (isPending) {
    return <Loader />;
  }

  if (!serverConversationId) {
    return (
      <div className="h-full flex flex-col gap-y-2 items-center justify-center">
        <AlertTriangleIcon className="size-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Conversation not found
        </span>
      </div>
    );
  }

  return <Conversation serverConversationId={serverConversationId} />;
};

export default MemberIdPage;
