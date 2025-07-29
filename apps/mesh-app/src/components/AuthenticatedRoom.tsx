"use client";

import { useCurrentUser } from "@/features/auth/api/useCurrentUser";
import { Room } from "./rooms/Room";

export const AuthenticatedRoom = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userData } = useCurrentUser();

  if (!userData) {
    return <>{children}</>;
  }

  return <Room>{children}</Room>;
};
