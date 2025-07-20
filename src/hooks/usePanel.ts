import { useFriendProfileId } from "@/features/friends/store/useFriendProfileId";
import { useParentMessageId } from "@/features/messages/store/useParentMessageId";
import { useProfileMemberId } from "@/features/serverMembers/store/useProfileMemberId";

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();
  const [friendProfileId, setfriendProfileId] = useFriendProfileId();

  const onOpenMessage = (messageId: string) => {
    setParentMessageId(messageId);
    setProfileMemberId(null);
    setfriendProfileId(null);
  };
  const onOpenProfile = (memberId: string) => {
    setProfileMemberId(memberId);
    setParentMessageId(null);
    setfriendProfileId(null);
  };

  const onOpenFriendProfile = (friendId: string) => {
    setfriendProfileId(friendId);
    setParentMessageId(null);
    setProfileMemberId(null);
  };

  const onClose = () => {
    setfriendProfileId(null);
    setProfileMemberId(null);
    setParentMessageId(null);
  };

  return {
    parentMessageId,
    profileMemberId,
    friendProfileId,
    onOpenMessage,
    onOpenProfile,
    onOpenFriendProfile,
    onClose,
  };
};
