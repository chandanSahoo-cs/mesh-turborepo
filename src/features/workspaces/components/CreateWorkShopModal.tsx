import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCreateWorkspace } from "../api/useCreateWorkspace";
import { useCreateWorkspaceModal } from "../store/useCreateWorkspaceModal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const CreateWorkspaceModal = () => {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCreateWorkspaceModal();
  const [name, setName] = useState("");

  const { createWorkspace, isPending } = useCreateWorkspace();

  const handleClose = () => {
    setIsOpen(false);
    setName("");
  };

  const handleCreateWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createWorkspace(
      { name },
      {
        onSuccess({ id }) {
            toast.success("Workspace created")
          router.push(`/workspace/${id}`);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a workspace</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleCreateWorkspace}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={false}
            autoFocus
            minLength={3}
            placeholder="Workspace name e.g. 'Work', 'Personal', 'Home'"
          />
          <div className="flex justify-end">
            <Button disabled={false}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
