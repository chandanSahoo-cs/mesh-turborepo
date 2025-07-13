import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNewJoinCode } from "@/features/servers/api/useNewJoinCode";
import { useConfirm } from "@/hooks/useConfirm";
import { cn } from "@/lib/utils";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { Doc } from "../../../../../convex/_generated/dataModel";

interface InviteModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  server: Doc<"servers">;
}

export const InviteModal = ({ open, setOpen, server }: InviteModalProps) => {
  const { generateNewJoinCode, isPending } = useNewJoinCode();
  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/join/${server._id}`;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => toast.success("Invite link copy to clipboard"));
  };

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure",
    "This will deactivate the current invite code and generate the new one."
  );

  const handleNewCode = async () => {
    const ok = await confirm();
    if (!ok) return;
    generateNewJoinCode(
      {
        serverId: server._id,
      },
      {
        onSuccess: () => {
          toast.success("New join code generated");
        },
        onError: () => {
          toast.error("Failed to generate new join code");
        },
      }
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite people to {server.name}</DialogTitle>
            <DialogDescription>
              Use the code below to invite people to your workspace
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-y-4 py-10">
            <p className="text-4xl font-bold uppercase tracking-widest">
              {server.joinCode}
            </p>
            <Button onClick={handleCopy} size="sm" variant="ghost">
              Copy Link
              <CopyIcon className="ml-2 size-4" />
            </Button>
          </div>
          <div className="flex w-full items-center justify-between">
            <Button type="button" disabled={isPending} onClick={handleNewCode}>
              New code generated
              <RefreshCcwIcon
                className={cn("ml-2 size-4", isPending && "animate-spin")}
              />
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
