import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateWorkspace } from "../api/useCreateWorkspace";
import { useCreateWorkspaceModal } from "../store/useCreateWorkspaceModal";

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
          setIsOpen(false);
          toast.success("Workspace created");
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
            <Button disabled={isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
