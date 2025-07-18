import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useHasPermission } from "@/features/roles/api/useHasPermission";
import { useUpdateRole } from "@/features/roles/api/useUpdateRole";
import { useGetServerById } from "@/features/servers/api/useGetServerById";
import { useConfirm } from "@/hooks/useConfirm";
import { useServerId } from "@/hooks/useServerId";
import { AlertTriangleIcon, LoaderIcon, MailIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentMember } from "../api/useCurrentMember";
import { useGetMemberById } from "../api/useGetMemberById";
import { useRemoveMember } from "../api/useRemoveMember";

interface ProfileProps {
  serverMemberId: Id<"serverMembers">;
  onClose: () => void;
}

export const Profile = ({ serverMemberId, onClose }: ProfileProps) => {
  const router = useRouter();
  const serverId = useServerId();

  const { data: server, isLoading: isLoadingServer } = useGetServerById({
    id: serverId,
  });

  const [LeaveDialog, confirmLeave] = useConfirm(
    "Leave Workspace",
    "Are you sure you want to leave this workspace"
  );

  const [RemoveDialog, confirmRemove] = useConfirm(
    "Remove member",
    "Are you sure you want to remove this member?"
  );

  const [UpdateDialog, confirmUpdate] = useConfirm(
    "Change role",
    "Are you sure you want to change this members role?"
  );

  const { data: currentMember, isLoading: isLoadingCurrentMember } =
    useCurrentMember({ serverId });
  const { data: profileMember, isLoading: isLoadingProfileMember } =
    useGetMemberById({ serverMemberId });

  const { removeMember, isPending: isRemovingPending } = useRemoveMember();
  const { updateRole, isPending: isUpdatingRole } = useUpdateRole();
  const isCurrent =
    currentMember && profileMember
      ? currentMember?._id === profileMember._id
      : null;

  const { data: isPermitted, isLoading: isLoadingPermission } =
    useHasPermission({ serverMemberId, permission: "MANAGE_MEMBERS" });

  const onRemove = async () => {
    const ok = await confirmRemove();

    if (!ok) {
      return;
    }

    if (server?.ownerId === profileMember?.userId) {
      toast.warning("Transfer ownership before leaving the server");
      return;
    }

    removeMember(
      {
        serverMemberId,
      },
      {
        onSuccess: () => {
          toast.success("Member removed");
          onClose();
        },
        onError: () => {
          toast.error("Failed to remove member");
        },
      }
    );
  };

  const onLeave = async () => {
    const ok = await confirmLeave();

    if (!ok) {
      return;
    }

    if (server?.ownerId === profileMember?.userId) {
      toast.warning("Transfer ownership before leaving the server");
      return;
    }

    removeMember(
      {
        serverMemberId,
      },
      {
        onSuccess: () => {
          toast.success("You left the server");
          onClose();
        },
        onError: () => {
          toast.error("Failed to leave the server");
        },
      }
    );
  };

  //   const onUpdate = async (roleId: Id<"roles">) => {
  //     const ok = await confirmUpdate();

  //     if (!ok) {
  //       return;
  //     }

  //     updateRole(
  //       { serverMemberId, roleId },
  //       {
  //         onSuccess: () => {
  //           toast.success("Role added");
  //         },
  //         onError: () => {
  //           toast.error("Failed to add role");
  //         },
  //       }
  //     );
  //   };

  if (
    isLoadingCurrentMember ||
    isLoadingProfileMember ||
    isLoadingServer ||
    isLoadingPermission
  ) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Profile</p>
          <Button onClick={onClose} size="iconSm" variant="ghost">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 h-full items-center justify-center">
          <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!profileMember || !server) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Profile</p>
          <Button onClick={onClose} size="iconSm" variant="ghost">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 h-full items-center justify-center">
          <AlertTriangleIcon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  const avatarFallback = profileMember.user?.name?.[0] ?? "M";

  return (
    <>
      <RemoveDialog />
      <LeaveDialog />
      <UpdateDialog />

      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Profile</p>
          <Button onClick={onClose} size="iconSm" variant="ghost">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col p-4 items-center justify-center">
          <Avatar className="max-w-[256px] max-h-[256px] size-full">
            <AvatarImage src={profileMember.user?.image} />
            <AvatarFallback className="aspect-square text-6xl rounded-md bg-sky-500 text-white">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </div>
        {/*Add Role component*/}
        <div className="flex flex-col p-4">
          <p className="text-xl font-bold">{profileMember.user?.name}</p>
          {isCurrent ? (
            <div className="flex items-center gap-2 mt-4">
              <Button onClick={onLeave} className="w-full" variant="default">
                Leave
              </Button>
            </div>
          ) : isPermitted ? (
            <div className="flex items-center gap-2 mt-4">
              <Button
                onClick={onRemove}
                className="w-full"
                variant="destructive">
                Remove
              </Button>
            </div>
          ) : null}
        </div>
        {/*Add Role component*/}
        <Separator />
        <div className="flex flex-col p-4">
          <p className="text-sm font-bold mb-4">Contact Information</p>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-md bg-muted flex items-center justify-center">
              <MailIcon className="size-4" />
            </div>
            <div className="flex flex-col">
              <p className="text-[13px] font-semibold text-muted-foreground">
                Email Address
              </p>
              <Link
                href={`mailto:${profileMember.user?.email}`}
                className="text-sm hover:underline text-[#1264a3]">
                {profileMember.user?.email}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
