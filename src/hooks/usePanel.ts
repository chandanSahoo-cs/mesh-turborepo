import { useParentMessageId } from "@/features/messages/store/useParentMessageId";
import { useProfileMemberId } from "@/features/serverMembers/store/useProfileMemberId";

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();

  const onOpenMessage = (messageId: string) => {
    setParentMessageId(messageId);
    setProfileMemberId(null);
  };
  const onOpenProfile = (memberId: string) => {
    setParentMessageId(null);
    setProfileMemberId(memberId);
  };

  const onClose = () => {
    setProfileMemberId(null);
    setParentMessageId(null);
  };

  return {
    parentMessageId,
    profileMemberId,
    onOpenMessage,
    onOpenProfile,
    onClose,
  };
};
