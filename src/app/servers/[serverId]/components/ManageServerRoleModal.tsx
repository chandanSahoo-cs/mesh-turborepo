"use client";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAddRole } from "@/features/roles/api/useAddRole";
import { useGetRoles } from "@/features/roles/api/useGetRoles";
import { useModifyRole } from "@/features/roles/api/useModifyRole";
import { useRemoveRole } from "@/features/roles/api/useRemoveRole";
import { useConfirm } from "@/hooks/useConfirm";
import { useServerId } from "@/hooks/useServerId";
import { errorToast, successToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Dialog } from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { ServerPermission } from "../../../../../convex/schema";
import { RoleInfo } from "./RoleInfo";

interface ManageServerRoleModal {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ManageServerRoleModal = ({
  open,
  setOpen,
}: ManageServerRoleModal) => {
  const [name, setName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<Id<"roles"> | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const serverId = useServerId();

  const { addRole, isPending: addingRole } = useAddRole();
  const { removeRole, isPending: removingRole } = useRemoveRole();
  const { modifyRole, isPending: modifyingRole } = useModifyRole();
  const { data: roles} = useGetRoles({ serverId });

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "This action is irreversible"
  );

  const permissionOptions: {
    value: ServerPermission;
    label: string;
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
  }[] = [
    {
      value: "ADMINISTRATOR",
      label: "Administrator",
      description: "Full access to everything",
      icon: ShieldIcon,
    },
    {
      value: "MANAGE_SERVER",
      label: "Manage Server",
      description: "Rename/delete server, change settings",
      icon: SettingsIcon,
    },
    {
      value: "MANAGE_MEMBERS",
      label: "Manage Members",
      description: "Kick, ban, or change member roles",
      icon: UserIcon,
    },
    {
      value: "MANAGE_ROLES",
      label: "Manage Roles",
      description: "Create/edit/delete roles",
      icon: ShieldIcon,
    },
    {
      value: "MANAGE_CHANNELS",
      label: "Manage Channels",
      description: "Create, edit, delete channels",
      icon: SettingsIcon,
    },
    {
      value: "INVITE_MEMBERS",
      label: "Invite Members",
      description: "Generate invite links",
      icon: UserIcon,
    },
    {
      value: "VIEW_CHANNELS",
      label: "View Channels",
      description: "View channel list",
      icon: SettingsIcon,
    },
    {
      value: "SEND_MESSAGES",
      label: "Send Messages",
      description: "Post messages in text channels",
      icon: SettingsIcon,
    },
    {
      value: "DELETE_MESSAGES",
      label: "Delete Messages",
      description: "Delete anyone's messages",
      icon: TrashIcon,
    },
  ];

  const [permissions, setPermissions] = useState<Array<ServerPermission>>([]);

  const handleClose = () => {
    setOpen(false);
    setName("");
    setPermissions([]);
    setEditingRoleId(null);
    setShowCreateForm(false);
  };

  const handleTogglePermission = (value: ServerPermission) => {
    setPermissions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const handleAddRole = async () => {
    if (!name.trim()) {
      errorToast("Role name is required");
      return;
    }

    await addRole(
      {
        name: name.trim(),
        serverId,
        permissions,
      },
      {
        onSuccess() {
          successToast("Role created");
          setName("");
          setPermissions([]);
          setShowCreateForm(false);
        },
        onError() {
          errorToast("Failed to create role");
        },
      }
    );
  };

  const handleRemoveRole = async (roleId: Id<"roles">) => {
    const ok = await confirm();
    if (!ok) return;

    await removeRole(
      {
        serverId,
        roleId,
      },
      {
        onSuccess() {
          successToast("Role deleted");
        },
        onError() {
          errorToast("Failed to delete role");
        },
      }
    );
  };

  const handleModifyRole = async (roleId: Id<"roles">) => {
    await modifyRole(
      {
        roleId,
        serverId,
        permissions,
      },
      {
        onSuccess() {
          successToast("Role updated");
          setEditingRoleId(null);
          setPermissions([]);
        },
        onError() {
          errorToast("Failed to update role");
        },
      }
    );
  };

  const startEditingRole = (
    roleId: Id<"roles">,
    currentPermissions: ServerPermission[]
  ) => {
    setEditingRoleId(roleId);
    setPermissions(currentPermissions);
    setShowCreateForm(false);
  };

  const filteredRoles =
    roles?.filter((role) => role.name !== "@everyone") || [];

  return (
    <>
      <ConfirmDialog />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 bg-white border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl max-w-4xl h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="p-6 border-b-4 border-black bg-[#fffce9] flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}>
              <DialogTitle className="font-mono font-black text-2xl text-black uppercase tracking-wide flex items-center gap-3">
                <ShieldIcon className="size-4 text-[#5170ff]" />
                Manage Server Roles
              </DialogTitle>
              <p className="font-mono text-gray-700 text-sm mt-2">
                Create and manage roles to control permissions
              </p>
            </motion.div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#5170ff] scrollbar-track-[#fffce9]">
            {/* Existing Roles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-mono font-black text-black uppercase tracking-wide">
                  Server Roles ({filteredRoles.length})
                </h3>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => {
                      setShowCreateForm(true);
                      setEditingRoleId(null);
                      setPermissions([]);
                    }}
                    className="bg-[#7ed957] text-black font-mono font-bold py-2 px-4 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#6ec947] flex items-center gap-2">
                    <PlusIcon className="size-4" />
                    Create Role
                  </Button>
                </motion.div>
              </div>

              <div className="space-y-3">
                {/* Create New Role */}
                <AnimatePresence>
                  {showCreateForm && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-[#fffce9] border-4 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000000]">
                      <h3 className="text-lg font-mono font-black text-black uppercase tracking-wide mb-4 flex items-center gap-2">
                        <PlusIcon className="size-5 text-[#7ed957]" />
                        Create New Role
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-mono font-bold text-black uppercase tracking-wide mb-2">
                            Role Name
                          </label>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter role name..."
                            className="border-4 border-black rounded-xl font-mono font-bold shadow-[4px_4px_0px_0px_#000000] focus:shadow-[6px_6px_0px_0px_#7ed957] focus:border-[#7ed957] transition-all duration-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-mono font-bold text-black uppercase tracking-wide mb-3">
                            Permissions
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {permissionOptions.map((option) => {
                              const Icon = option.icon;
                              const isSelected = permissions.includes(
                                option.value
                              );
                              return (
                                <motion.button
                                  key={option.value}
                                  onClick={() =>
                                    handleTogglePermission(option.value)
                                  }
                                  className={cn(
                                    "p-3 rounded-xl border-2 border-black text-left transition-all duration-200 font-mono font-bold",
                                    isSelected
                                      ? "bg-[#7ed957] text-black shadow-[4px_4px_0px_0px_#000000]"
                                      : "bg-white text-black hover:bg-gray-50 shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#7ed957]"
                                  )}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Icon className="size-4" />
                                    <span className="text-sm uppercase tracking-wide">
                                      {option.label}
                                    </span>
                                    {isSelected && (
                                      <CheckIcon className="size-4 ml-auto" />
                                    )}
                                  </div>
                                  <p className="text-xs opacity-70">
                                    {option.description}
                                  </p>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={handleAddRole}
                              disabled={addingRole || !name.trim()}
                              className="bg-[#7ed957] text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-[#6ec947] disabled:opacity-50">
                              {addingRole ? "Creating..." : "Create Role"}
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}>
                            <Button
                              onClick={() => {
                                setShowCreateForm(false);
                                setName("");
                                setPermissions([]);
                              }}
                              className="bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-gray-50">
                              Cancel
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {filteredRoles.map((role) => (
                    <motion.div
                      key={role._id}
                      className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#5170ff] transition-all duration-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ scale: 1.01 }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-mono font-black text-black uppercase tracking-wide">
                              {role.name}
                            </h4>
                            <RoleInfo roleId={role._id} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() =>
                                startEditingRole(role._id, role.permissions)
                              }
                              className="bg-[#5170ff] text-white font-mono font-bold py-2 px-3 border-2 border-black uppercase tracking-wide shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] rounded-lg transition-all hover:bg-[#4060ef] text-xs">
                              Edit
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}>
                            <Button
                              onClick={() => handleRemoveRole(role._id)}
                              disabled={removingRole}
                              className="bg-red-400 text-black font-mono font-bold py-2 px-3 border-2 border-black uppercase tracking-wide shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] rounded-lg transition-all hover:bg-red-500 text-xs">
                              <TrashIcon className="size-3" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>

                      {/* Edit Role Form */}
                      <AnimatePresence>
                        {editingRoleId === role._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t-2 border-black pt-4 mt-4">
                            <h5 className="font-mono font-bold text-black uppercase tracking-wide mb-3">
                              Edit Permissions
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                              {permissionOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = permissions.includes(
                                  option.value
                                );
                                return (
                                  <motion.button
                                    key={option.value}
                                    onClick={() =>
                                      handleTogglePermission(option.value)
                                    }
                                    className={cn(
                                      "p-3 rounded-xl border-2 border-black text-left transition-all duration-200 font-mono font-bold",
                                      isSelected
                                        ? "bg-[#5170ff] text-white shadow-[4px_4px_0px_0px_#000000]"
                                        : "bg-white text-black hover:bg-[#fffce9] shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#5170ff]"
                                    )}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Icon className="size-4" />
                                      <span className="text-sm uppercase tracking-wide">
                                        {option.label}
                                      </span>
                                      {isSelected && (
                                        <CheckIcon className="size-4 ml-auto" />
                                      )}
                                    </div>
                                    <p className="text-xs opacity-80">
                                      {option.description}
                                    </p>
                                  </motion.button>
                                );
                              })}
                            </div>
                            <div className="flex gap-2">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}>
                                <Button
                                  onClick={() => handleModifyRole(role._id)}
                                  disabled={modifyingRole}
                                  className="bg-[#7ed957] text-black font-mono font-bold py-2 px-4 border-2 border-black uppercase tracking-wide shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] rounded-lg transition-all hover:bg-[#6ec947]">
                                  {modifyingRole ? "Saving..." : "Save Changes"}
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}>
                                <Button
                                  onClick={() => {
                                    setEditingRoleId(null);
                                    setPermissions([]);
                                  }}
                                  className="bg-white text-black font-mono font-bold py-2 px-4 border-2 border-black uppercase tracking-wide shadow-[2px_2px_0px_0px_#000000] hover:shadow-[4px_4px_0px_0px_#000000] rounded-lg transition-all hover:bg-gray-50">
                                  Cancel
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
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
    </>
  );
};
