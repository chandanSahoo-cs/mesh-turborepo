import { useFriendProfileId } from "@/features/friends/store/useFriendProfileId";
import { useParentMessageId } from "@/features/messages/store/useParentMessageId";
import { useProfileMemberId } from "@/features/serverMembers/store/useProfileMemberId";
import { useMemberPanel } from "@/features/servers/store/useMemberPanel";

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();
  const [friendProfileId, setfriendProfileId] = useFriendProfileId();
  const { setIsOpen } = useMemberPanel();

  const onOpenMessage = (messageId: string) => {
    setParentMessageId(messageId);
    setProfileMemberId(null);
    setfriendProfileId(null);
    setIsOpen(false);
  };
  const onOpenMemberPanel = (isOpen: boolean) => {
    setParentMessageId(null);
    setProfileMemberId(null);
    setfriendProfileId(null);
    setIsOpen(isOpen);
  };
  const onOpenProfile = (memberId: string) => {
    setProfileMemberId(memberId);
    setParentMessageId(null);
    setfriendProfileId(null);
    setIsOpen(false);
  };

  const onOpenFriendProfile = (friendId: string) => {
    setfriendProfileId(friendId);
    setParentMessageId(null);
    setProfileMemberId(null);
    setIsOpen(false);
  };

  const onClose = () => {
    setfriendProfileId(null);
    setProfileMemberId(null);
    setParentMessageId(null);
    setIsOpen(false);
  };

  return {
    parentMessageId,
    profileMemberId,
    friendProfileId,
    onOpenMessage,
    onOpenProfile,
    onOpenFriendProfile,
    onOpenMemberPanel,
    onClose,
  };
};
