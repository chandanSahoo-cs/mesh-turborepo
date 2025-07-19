"use client";

import { Button } from "@/components/ui/button";
import { useGetServerInfo } from "@/features/servers/api/useGetServerInfo";
import { useJoinServer } from "@/features/servers/api/useJoinServer";
import { useServerId } from "@/hooks/useServerId";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import VerificationInput from "react-verification-input";
import { toast } from "sonner";

const JoinPage = () => {
  const serverId = useServerId();
  const router = useRouter();
  const { data, isLoading } = useGetServerInfo({ serverId });
  const { joinServer, isPending } = useJoinServer();

  const handleComplete = (value: string) => {
    joinServer(
      { serverId, joinCode: value },
      {
        onSuccess: ({ id }) => {
          router.replace(`/servers/${id}`);
          toast.success("Successfully joined the server");
        },
        onError: () => {
          toast.error("Failed to join the server");
        },
      }
    );
  };

  const isMember = useMemo(() => data?.isMember, [data?.isMember]);

  useEffect(() => {
    if (isMember) router.push(`/servers/${serverId}`);
  }, [isMember, router, serverId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col gap-y-8 items-center justify-center bg-white p-8 rounded-lg shadow-md">
      <Image alt="mesh" src="/logo.svg" width={200} height={200} />
      <div className="felx flex-col gap-y-4 items-center justify-center max-w-md">
        <div className="flex flex-col gap-y-2 items-center justify-center">
          <h1 className="text-2xl font-bold">Join {data?.serverName}</h1>
          <p className="text-md text-muted-foreground">
            Enter the server code to join
          </p>
        </div>
        <VerificationInput
          onComplete={handleComplete}
          length={6}
          classNames={{
            container: cn(
              "flex gap-x-2",
              isPending && "opacity-50 cursor-not-allowed"
            ),
            character:
              "uppercase h-auto rounded-md border border-gray-300 flex items-center justify-center text-lg font-medium text-gray-500",
            characterInactive: "bg-muted",
            characterSelected: "bg-white text-black",
            characterFilled: "bg-white text-black",
          }}
          autoFocus
        />
      </div>
      <div className="flex gap-x-4">
        <Button size="lg" variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
};

export default JoinPage;
