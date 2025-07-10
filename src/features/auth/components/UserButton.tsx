"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "../api/useCurrentUser"
import { Loader, LogOut } from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react"


export const UserButton = ( ) => {
    const {signOut} = useAuthActions()
    const {isLoading, userData} = useCurrentUser();
    if(isLoading){
        return <Loader className="size-4 animate-spin text-muted-foreground"/>
    }

    if(!userData){
        return null;
    }

    const {image, name} = userData;

    const avatarFallback = name?.charAt(0).toUpperCase();
    const nameToNumber = (name || "Anonymous").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = Math.abs(nameToNumber) % 360;
    const color = `hsl(${hue},80%,60%)`;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="outline-none relative">
                <Avatar className="size-10 hover:opacity-75 transition">
                    <AvatarImage alt={name} src={image}/>
                    <AvatarFallback className="text-white" style={{backgroundColor:color}}>
                        {avatarFallback}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="right" className="w-60">
                <DropdownMenuItem onClick={()=>signOut()}>
                    <LogOut className="size-4 mr-2"/>
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}