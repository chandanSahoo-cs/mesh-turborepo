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
import { useCreateServer } from "../api/useCreateServer";
import { useCreateServerModal } from "../store/useCreateServerModal";

export const CreateServerModal = () => {
  const router = useRouter();
  const { isOpen, setIsOpen } = useCreateServerModal();
  const [name, setName] = useState("");

  const { createServer, isPending } = useCreateServer();

  const handleClose = () => {
    setIsOpen(false);
    setName("");
  };

  const handleCreateServer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createServer(
      { name },
      {
        onSuccess({ id }) {
          setIsOpen(false);
          toast.success("Server created");
          setName("");
          router.push(`/servers/${id}`);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a server</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleCreateServer}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isPending}
            autoFocus
            minLength={3}
            placeholder="Server name e.g. 'Work', 'Personal', 'Home'"
          />
          <div className="flex justify-end">
            <Button disabled={isPending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
