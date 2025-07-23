"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useServerId } from "@/hooks/useServerId";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Id } from "../../../../../convex/_generated/dataModel";

const userItemVariants = cva(
  "flex h-10 px-3 gap-2 items-center justify-start overflow-hidden text-sm font-mono font-bold rounded-xl border-2 transition-all duration-200 mb-1",
  {
    variants: {
      variant: {
        default:
          "text-black border-transparent hover:border-[#7ed957] hover:bg-[#7ed957]/20 hover:shadow-[2px_2px_0px_0px_#7ed957]",
        active:
          "bg-[#7ed957] text-black border-black shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:scale-102",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface UserItemProps {
  id: Id<"serverMembers">;
  label?: string;
  image?: string;
  variant?: VariantProps<typeof userItemVariants>["variant"];
}

export const UserItem = ({ id, label, image, variant }: UserItemProps) => {
  const serverId = useServerId();
  const avatarFallback = label?.charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ scale: variant === "active" ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}>
      <Button
        variant="transparent"
        className={cn(userItemVariants({ variant }))}
        size="sm"
        asChild>
        <Link href={`/servers/${serverId}/member/${id}`}>
          <Avatar className="size-6 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000000]">
            <AvatarImage
              alt={label}
              src={image || "/placeholder.svg"}
              className="rounded-md"
            />
            <AvatarFallback className="rounded-md bg-[#5170ff] text-white font-mono font-black text-xs">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate uppercase tracking-wide">
            {label}
          </span>
        </Link>
      </Button>
    </motion.div>
  );
};
