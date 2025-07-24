"use client";

import { BackgroundAnimations } from "@/components/BackgroundAnimations";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/ui/button";
import { useGetServerInfo } from "@/features/servers/api/useGetServerInfo";
import { useJoinServer } from "@/features/servers/api/useJoinServer";
import { useServerId } from "@/hooks/useServerId";
import { errorToast, successToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import VerificationInput from "react-verification-input";

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
          successToast("Successfully joined the server");
        },
        onError: () => {
          errorToast("Failed to join the server");
        },
      }
    );
  };

  const isMember = useMemo(() => data?.isMember, [data?.isMember]);

  useEffect(() => {
    if (isMember) router.push(`/servers/${serverId}`);
  }, [isMember, router, serverId]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="h-full flex flex-col gap-y-8 items-center justify-center bg-[#fffce9] p-8 relative">
      <BackgroundAnimations />

      <motion.div
        className="flex flex-col gap-y-8 items-center justify-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ duration: 0.2 }}>
          <Image
            alt="mesh"
            src="/logo.svg"
            width={200}
            height={200}
            className="border-6 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000000] bg-white p-4"
          />
        </motion.div>

        <div className="border-6 border-black shadow-[8px_8px_0px_0px_#000000] rounded-3xl p-8 max-w-md backdrop-blur-sm bg-white/95">
          <div className="flex flex-col gap-y-6 items-center justify-center">
            <div className="flex flex-col gap-y-2 items-center justify-center text-center">
              <h1 className="text-2xl font-mono font-black text-black uppercase tracking-wide">
                Join {data?.serverName}
              </h1>
              <p className="text-sm font-mono text-gray-700">
                Enter the server code to join
              </p>
            </div>

            <VerificationInput
              onComplete={handleComplete}
              length={6}
              classNames={{
                container: cn(
                  "flex gap-x-3",
                  isPending && "opacity-50 cursor-not-allowed"
                ),
                character:
                  "uppercase h-16 w-12 rounded-xl border-4 border-black flex items-center justify-center text-lg font-mono font-black text-black shadow-[4px_4px_0px_0px_#000000] transition-all",
                characterInactive: "bg-gray-100",
                characterSelected:
                  "bg-[#5170ff] text-white border-[#5170ff] shadow-[4px_4px_0px_0px_#5170ff]",
                characterFilled:
                  "bg-[#7ed957] text-black border-[#7ed957] shadow-[4px_4px_0px_0px_#7ed957]",
              }}
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-x-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              size="lg"
              className="bg-white text-black font-mono font-bold py-3 px-6 border-4 border-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] rounded-xl transition-all hover:bg-gray-50"
              asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinPage;
