"use client";

import { useGetRoleById } from "@/features/roles/api/useGetRoleById";
import { useServerId } from "@/hooks/useServerId";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Id } from "../../../../../convex/_generated/dataModel";

interface RoleInfoProps {
  roleId: Id<"roles">;
}

export const RoleInfo = ({ roleId }: RoleInfoProps) => {
  const serverId = useServerId();
  const { data: roleInfo, isLoading: isLoadingRoleInfo } = useGetRoleById({
    serverId,
    roleId,
  });

  if (isLoadingRoleInfo) {
    return (
      <motion.div
        className="flex items-center gap-2"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}>
        <div className="w-3 h-3 bg-gray-300 border-2 border-black rounded-full" />
        <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wide">
          Loading...
        </span>
      </motion.div>
    );
  }

  if (!roleInfo) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-400 border-2 border-black rounded-full" />
        <span className="text-xs font-mono font-bold text-red-600 uppercase tracking-wide">
          Role not found
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3 mt-1"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}>
      <div className="flex flex-wrap gap-2">
        {roleInfo.permissions.slice(0, 3).map((permission) => (
          <span
            key={permission}
            className={cn(
              "px-2 py-1 text-xs font-mono font-bold uppercase tracking-wide rounded-lg border-2 border-black bg-[#fffce9] text-black"
            )}>
            {permission.replace(/_/g, " ")}
          </span>
        ))}
        {roleInfo.permissions.length > 3 && (
          <span
            className={cn(
              "px-2 py-1 text-xs font-mono font-bold uppercase tracking-wide rounded-lg border-2 border-black bg-gray-200 text-gray-600"
            )}>
            +{roleInfo.permissions.length - 3} more
          </span>
        )}
      </div>
    </motion.div>
  );
};
