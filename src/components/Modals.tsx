"use client";

import { CreateWorkspaceModal } from "@/features/workspaces/components/CreateWorkShopModal";
import { useEffect, useState } from "react";

export const Modals = () => {
  /*To prevent hydration error*/
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  /*To prevent hydration error*/

  return (
    <>
      <CreateWorkspaceModal />
    </>
  );
};
