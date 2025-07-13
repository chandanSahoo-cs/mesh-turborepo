import { Hint } from "@/components/Hint";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemberPermissions } from "@/features/serverMembers/api/useMemberPermissions";
import { ChevronDownIcon, ListFilterIcon, SquarePenIcon } from "lucide-react";
import { useState } from "react";
import { Doc } from "../../../../../convex/_generated/dataModel";
import { InviteModal } from "./InviteModal";
import { PreferencesModal } from "./PreferencesModal";

interface ServerHeaderProps {
  server: Doc<"servers">;
  member: Doc<"serverMembers">;
}

export const ServerHeader = ({ server, member }: ServerHeaderProps) => {
  const { isPermitted: isAdmin } = useMemberPermissions({
    memberId: member._id,
    permission: "ADMINISTRATOR",
  });

  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <InviteModal open={inviteOpen} setOpen={setInviteOpen} server ={server} />
      <PreferencesModal
        open={preferencesOpen}
        setOpen={setPreferencesOpen}
        initialValue={server.name}
      />
      <div className="flex items-center justify-between px-4 h-[49px] gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="transparent"
              className="font-semibold text-lg w-auto p-1.5 overflow-hidden"
              size="sm">
              <span className="truncate">{server.name}</span>
              <ChevronDownIcon className="size-4 ml-1 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-64">
            <DropdownMenuItem className="cursor-pointer capitalize">
              <div className="size-9 relative overflow-hidden bg-[#616061] text-white font-semibold text-xl rounded-md flex items-center justify-center mr-2">
                {server.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <p className="font-bold">{server.name}</p>
                <p className="text-xs text-muted-foreground">
                  Active workspace
                </p>
              </div>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setInviteOpen(true)}
                  className="cursor-pointer py-2">
                  Invite people to {server.name}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer py-2"
                  onClick={() => setPreferencesOpen(true)}>
                  Preferences
                </DropdownMenuItem>{" "}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-0.5">
          <Hint label="Filter conversations" side="bottom">
            <Button variant="transparent" size="iconSm">
              <ListFilterIcon className="size-4" />
            </Button>
          </Hint>
          <Hint label="New message" side="bottom">
            <Button variant="transparent" size="iconSm">
              <SquarePenIcon className="size-4" />
            </Button>
          </Hint>
        </div>
      </div>
    </>
  );
};
