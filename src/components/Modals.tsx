"use client";

import { CreateChannelModal } from "@/features/channels/components/CreateChannelModal";
import { AssignServerRoleModal } from "@/features/servers/components/AssignServerRoleModal";
import { CreateServerModal } from "@/features/servers/components/CreateServerModal";
import { ManageServerRoleModal } from "@/features/servers/components/ManageServerRoleModal";
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
      <CreateChannelModal />
      <CreateServerModal />
      <ManageServerRoleModal />
      <AssignServerRoleModal />
    </>
  );
};
