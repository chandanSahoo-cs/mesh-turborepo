import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useServerId } from "@/hooks/useServerId";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import Link from "next/link";
import { Id } from "../../../../../convex/_generated/dataModel";

const userItemVariants = cva(
  "flex h-7 px-4 gap-1.5 items-center justify-start overflow-hidden text-sm font-normal",
  {
    variants: {
      variant: {
        default: "text-[#F9EDFFCC]",
        active: "bg-white text-[#481349] hover:bg-white/90",
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

export const UserItem = ({ id, label, image, variant}: UserItemProps) => {
  const serverId = useServerId();
  const avatarFallback = label?.charAt(0).toUpperCase();
  return (
    <Button
      variant="transparent"
      className={cn(userItemVariants({ variant }))}
      size="sm"
      asChild>
      <Link href={`/workspace/${serverId}/member/${id}`}>
        <Avatar className="size-5 rounded-md mr-1">
          <AvatarImage alt={label} src={image} />
          <AvatarFallback className="rounded-md bg-sky-500 text-white">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm truncate">{label}</span>
      </Link>
    </Button>
  );
};
