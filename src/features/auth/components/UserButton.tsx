"use client";

import { Loader } from "@/components/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react";
import { useCurrentUser } from "../api/useCurrentUser";

export const UserButton = () => {
  const { signOut } = useAuthActions();
  const { isLoading, userData } = useCurrentUser();

  if (isLoading) {
    return <Loader />;
  }

  console.log({ userData });

  if (!userData) {
    return null;
  }

  const { image, name } = userData;
  const avatarFallback = name?.charAt(0).toUpperCase();
  const nameToNumber = (name || "Anonymous")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = Math.abs(nameToNumber) % 360;
  const color = `hsl(${hue},80%,60%)`;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none relative">
        <Avatar className="size-12 relative overflow-hidden font-mono font-black text-xl rounded-xl flex items-center justify-center border-4 border-black transition-all duration-200 shadow-[2px_2px_0px_0px_#000000] hover:bg-black hover:shadow-[4px_4px_0px_0px_#000000]">
          <AvatarImage
            alt={name}
            src={image || "/placeholder.svg"}
            className="rounded-lg"
          />
          <AvatarFallback
            className="text-white font-mono font-black text-lg rounded-lg"
            style={{ backgroundColor: color }}>
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="right"
        className="w-60 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000000] rounded-xl p-2 mb-2">
        <DropdownMenuItem
          onClick={() => signOut()}
          className="font-mono font-bold text-black hover:bg-red-100 rounded-lg p-3 cursor-pointer transition-colors ">
          <LogOut className="size-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
