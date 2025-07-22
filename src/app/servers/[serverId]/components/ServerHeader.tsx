"use client";

import { Hint } from "@/components/Hint";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHasPermission } from "@/features/roles/api/useHasPermission";
import { motion } from "framer-motion";
import { ChevronDownIcon, ListFilterIcon, SquarePenIcon } from "lucide-react";
import { useState } from "react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { InviteModal } from "./InviteModal";
import { ManageServerRoleModal } from "./ManageServerRoleModal";
import { PreferencesModal } from "./PreferencesModal";

interface ServerHeaderProps {
  server: Doc<"servers">;
  member: Doc<"serverMembers">;
}

export const ServerHeader = ({ server, member }: ServerHeaderProps) => {
  const { data: isAdmin } = useHasPermission({
    serverMemberId: member._id,
    permission: "ADMINISTRATOR",
  });

  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const [manageRoleOpen, setManageRoleOpen] = useState(false);

  return (
    <>
      <ManageServerRoleModal
        open={manageRoleOpen}
        setOpen={setManageRoleOpen}
      />
      <InviteModal open={inviteOpen} setOpen={setInviteOpen} server={server} />
      <PreferencesModal
        open={preferencesOpen}
        setOpen={setPreferencesOpen}
        initialValue={server.name}
      />
      <div className="flex items-center justify-between px-4 h-[60px] gap-2 border-b-4 border-black bg-[#fffce9]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="transparent"
                className="font-mono font-black text-lg w-auto p-3 overflow-hidden text-black hover:bg-white hover:border-4 hover:border-black hover:rounded-xl hover:shadow-[4px_4px_0px_0px_#000000] transition-all duration-200"
                size="sm">
                <span className="truncate uppercase tracking-wide">
                  {server.name}
                </span>
                <ChevronDownIcon className="size-4 ml-2 shrink-0" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-64 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-xl">
            <DropdownMenuItem className="cursor-pointer capitalize p-3 hover:bg-[#fffce9] rounded-lg">
              <div className="size-10 relative overflow-hidden bg-[#5170ff] text-white font-mono font-black text-lg rounded-xl flex items-center justify-center mr-3 border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
                {server.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <p className="font-mono font-bold text-black uppercase tracking-wide">
                  {server.name}
                </p>
                <p className="text-xs font-mono text-gray-700 uppercase">
                  Active server
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-2 border-black" />
            {isAdmin && (
              <>
                <DropdownMenuItem
                  onClick={() => setInviteOpen(true)}
                  className="cursor-pointer py-3 px-3 hover:bg-[#7ed957] hover:text-black rounded-lg font-mono font-bold uppercase tracking-wide">
                  Invite people to {server.name}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-2 border-black" />
                <DropdownMenuItem
                  onClick={() => setManageRoleOpen(true)}
                  className="cursor-pointer py-3 px-3 hover:bg-[#7ed957] hover:text-black rounded-lg font-mono font-bold uppercase tracking-wide">
                  Manage roles
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-2 border-black" />
              </>
            )}
            <DropdownMenuItem
              className="cursor-pointer py-3 px-3 hover:bg-[#5170ff] hover:text-white rounded-lg font-mono font-bold uppercase tracking-wide"
              onClick={() => setPreferencesOpen(true)}>
              Preferences
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Hint label="Filter conversations" side="bottom">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="transparent"
                className="size-9 p-2 hover:bg-[#5170ff] hover:text-white border-2 border-transparent hover:border-black hover:rounded-xl hover:shadow-[2px_2px_0px_0px_#000000] transition-all duration-200">
                <ListFilterIcon className="size-4" />
              </Button>
            </motion.div>
          </Hint>
          <Hint label="New message" side="bottom">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="transparent"
                className="size-9 p-2 hover:bg-[#7ed957] hover:text-black border-2 border-transparent hover:border-black hover:rounded-xl hover:shadow-[2px_2px_0px_0px_#000000] transition-all duration-200">
                <SquarePenIcon className="size-4" />
              </Button>
            </motion.div>
          </Hint>
        </div>
      </div>
    </>
  );
};
