import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRemoveChannel } from "@/features/channels/api/useRemoveChannel";
import { useRenameChannel } from "@/features/channels/api/useUpdateChannel";
import { useHasPermission } from "@/features/roles/api/useHasPermission";
import { useCurrentMember } from "@/features/serverMembers/api/useCurrentMember";
import { useChannelId } from "@/hooks/useChannelId";
import { useConfirm } from "@/hooks/useConfirm";
import { useServerId } from "@/hooks/useServerId";
import { DialogClose } from "@radix-ui/react-dialog";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { toast } from "sonner";

interface HeaderProps {
  channelName: string;
}

export const Header = ({ channelName }: HeaderProps) => {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [value, setValue] = useState(channelName);

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this channel",
    "You are about to delete this channel. This action is irreversible "
  );

  const channelId = useChannelId();
  const serverId = useServerId();
  const { data: member, isLoading: memberLoading } = useCurrentMember({
    serverId,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setValue(value);
  };

  const { data: isPermitted, isLoading } = useHasPermission({
    serverMemberId: member?._id,
    permission: "MANAGE_CHANNELS",
  });

  const { renameChannel, isPending: isRenamePending } = useRenameChannel();
  const { removeChannel, isPending: isRemovePending } = useRemoveChannel();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    renameChannel(
      { channelId, name: value },
      {
        onSuccess: () => {
          toast.success("Channel renamed");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Failed to rename channel");
        },
      }
    );
  };

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;
    removeChannel(
      { channelId },
      {
        onSuccess: () => {
          router.replace(`/servers/${serverId}`);
          toast.success("Channel Deleted");
        },
        onError: () => {
          toast.error("Failed to delete channel");
        },
      }
    );
  };

  const handleEditOpen = () => {
    console.log(isPermitted);
    if (!isPermitted) return;
    setEditOpen(true);
  };

  return (
    <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden">
      {!isPermitted ? (
        <Button
          variant="ghost"
          className="text-lg font-semibold px-2 overflow-hidden w-auto">
          <span className="truncate"># {channelName}</span>
        </Button>
      ) : (
        <>
          <ConfirmDialog />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="text-lg font-semibold px-2 overflow-hidden w-auto">
                <span className="truncate"># {channelName}</span>
                <FaChevronDown className="size-2.5 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 bg-gray-50 overflow-hidden">
              <DialogHeader className="p-4 border-b bg-white">
                <DialogTitle># {channelName}</DialogTitle>
              </DialogHeader>
              <div className="px-4 pb-4 flex flex-col gap-y-2">
                <Dialog open={editOpen} onOpenChange={handleEditOpen}>
                  <DialogTrigger asChild>
                    <div className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                      <div className="flex item-center justify-between">
                        <p className="text-sm font-semibold">Channel name</p>
                        <p className="text-sm text-[#1264a3] hover:underline font-semibold">
                          Edit
                        </p>
                      </div>
                      <p className="text-sm"># {channelName}</p>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rename this channel</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        value={value}
                        disabled={isRenamePending}
                        onChange={handleChange}
                        required
                        autoFocus
                        minLength={3}
                        maxLength={80}
                        placeholder="plan-anniversay"
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline" disabled={false}>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button disabled={false}>Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <button
                  onClick={handleDelete}
                  disabled={isRemovePending}
                  className="flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg border hover:bg-gray-50 text-rose-600">
                  <TrashIcon className="size-4" />
                  <p className=" text-sm font-semibold"> Delete channel</p>
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
