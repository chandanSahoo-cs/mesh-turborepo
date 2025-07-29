"use client";

import { BackgroundAnimations } from "@/components/BackgroundAnimations";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/friends`);
  }, [router]);

  return <BackgroundAnimations />;
}
