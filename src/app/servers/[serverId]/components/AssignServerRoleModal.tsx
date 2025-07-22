"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAssignRoleToMember } from "@/features/roles/api/useAssignRoleToMember";
import { useGetRoles } from "@/features/roles/api/useGetRoles";
import { useGetRoleByMemberId } from "@/features/roles/api/useGetRolesByMemberId";
import { useRemoveRoleFromeMember } from "@/features/roles/api/useRemoveRoleFromMember";
import { useServerId } from "@/hooks/useServerId";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface AssignServerRoleModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  serverMemberId: Id<"serverMembers">;
}

export const AssignServerRoleModal = ({
  open,
  setOpen,
  serverMemberId,
}: AssignServerRoleModalProps) => {
  const serverId = useServerId();
  const { assignRole, isPending: assigningRole } = useAssignRoleToMember();
  const { removeRoleFromMember, isPending: removingRole } =
    useRemoveRoleFromeMember();
  const { data: allRoles, isLoading: isLoadingAllRoles } = useGetRoles({
    serverId,
  });
  const { data: memberRoles, isLoading: isLoadingMemberRoles } =
    useGetRoleByMemberId({ serverMemberId });

  const handleToggleRole = async (roleId: Id<"roles">) => {
    const hasRole = memberRoles?.some((role) => role?._id === roleId);

    if (hasRole) {
      // Remove role
      removeRoleFromMember(
        { roleId, serverMemberId },
        {
          onSuccess() {
            toast.success("Role removed");
          },
          onError() {
            toast.error("Failed to remove role");
          },
        }
      );
    } else {
      // Assign role
      assignRole(
        { roleId, serverMemberId },
        {
          onSuccess() {
            toast.success("Role assigned");
          },
          onError() {
            toast.error("Failed to assign role");
          },
        }
      );
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const availableRoles =
    allRoles?.filter((role) => role.name !== "@everyone") || [];
  const memberRoleIds = new Set(memberRoles?.map((role) => role?._id) || []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-6 border-b-4 border-black bg-[#fffce9] flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}>
            <DialogTitle className="font-mono font-black text-2xl text-black uppercase tracking-wide flex items-center gap-3">
              <UserPlusIcon className="size-8 text-[#5170ff]" />
              Assign Server Roles
            </DialogTitle>
            <p className="font-mono text-gray-700 text-sm mt-2">
              Manage roles for this server member
            </p>
          </motion.div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#5170ff] scrollbar-track-[#fffce9]">
          {isLoadingAllRoles || isLoadingMemberRoles ? (
            <motion.div
              className="flex items-center justify-center h-40"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
              <span className="text-lg font-mono font-bold text-gray-500 uppercase tracking-wide">
                Loading roles...
              </span>
            </motion.div>
          ) : availableRoles.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-mono font-black text-black uppercase tracking-wide mb-4">
                Available Roles ({availableRoles.length})
              </h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {availableRoles.map((role) => {
                    const isAssigned = memberRoleIds.has(role._id);
                    const isPending = assigningRole || removingRole;

                    return (
                      <motion.div
                        key={role._id}
                        className={cn(
                          "border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 cursor-pointer",
                          isAssigned
                            ? "bg-[#5170ff] text-white"
                            : "bg-white text-black hover:bg-[#fffce9]"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() =>
                          !isPending && handleToggleRole(role._id)
                        }>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "size-12 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]",
                                isAssigned
                                  ? "bg-white text-[#5170ff]"
                                  : "bg-[#5170ff] text-white"
                              )}>
                              <ShieldIcon className="size-6" />
                            </div>
                            <div>
                              <h4
                                className={cn(
                                  "font-mono font-black uppercase tracking-wide text-lg",
                                  isAssigned ? "text-white" : "text-black"
                                )}>
                                {role.name}
                              </h4>
                              <p
                                className={cn(
                                  "text-sm font-mono font-bold uppercase tracking-wide",
                                  isAssigned ? "text-white/80" : "text-gray-600"
                                )}>
                                {role.permissions?.length || 0} permissions
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* {isAssigned && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-white text-[#5170ff] rounded-full p-1 border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
                                <CheckIcon className="size-4" />
                              </motion.div>
                            )} */}
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "px-4 py-2 font-mono font-bold text-sm uppercase tracking-wide border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000000] transition-all",
                                isAssigned
                                  ? "bg-red-400 text-black hover:bg-red-500"
                                  : "bg-[#7ed957] text-black hover:bg-[#6ec947]",
                                isPending && "opacity-50 cursor-not-allowed"
                              )}>
                              {isPending
                                ? "..."
                                : isAssigned
                                  ? "Remove"
                                  : "Assign"}
                            </motion.div>
                          </div>
                        </div>

                        {/* Role Permissions Preview */}
                        {role.permissions && role.permissions.length > 0 && (
                          <motion.div
                            className="mt-4 pt-4 border-t-2 border-black/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}>
                            <p
                              className={cn(
                                "text-xs font-mono font-bold uppercase tracking-wide mb-2",
                                isAssigned ? "text-white/80" : "text-gray-600"
                              )}>
                              Permissions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions
                                .slice(0, 3)
                                .map((permission) => (
                                  <span
                                    key={permission}
                                    className={cn(
                                      "px-2 py-1 text-xs font-mono font-bold uppercase tracking-wide rounded-lg border-2 border-black",
                                      isAssigned
                                        ? "bg-white text-[#5170ff]"
                                        : "bg-[#fffce9] text-black"
                                    )}>
                                    {permission.replace(/_/g, " ")}
                                  </span>
                                ))}
                              {role.permissions.length > 3 && (
                                <span
                                  className={cn(
                                    "px-2 py-1 text-xs font-mono font-bold uppercase tracking-wide rounded-lg border-2 border-black",
                                    isAssigned
                                      ? "bg-white/20 text-white"
                                      : "bg-gray-200 text-gray-600"
                                  )}>
                                  +{role.permissions.length - 3} more
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center h-40 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}>
              <ShieldIcon className="size-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-mono font-black text-black uppercase tracking-wide mb-2">
                No Roles Found
              </h3>
              <p className="text-sm font-mono text-gray-600 uppercase tracking-wide">
                Create roles first to assign them to members
              </p>
            </motion.div>
          )}
        </div>

        {/* Close Button */}
        <div className="p-6 border-t-4 border-black bg-[#fffce9] flex-shrink-0">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleClose}
              className="w-full bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-gray-50">
              Close
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
