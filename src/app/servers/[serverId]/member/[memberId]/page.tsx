"use client";

import { useMemberId } from "@/hooks/useMemberId";
import { useServerId } from "@/hooks/useServerId";

const MemberIdPage = () => {
  const serverId = useServerId();
  const memberId = useMemberId();
  return <div>{JSON.stringify({serverId,memberId})}</div>;
};

export default MemberIdPage;
