import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const {
    userData,
    parentMessageData,
  }: {
    userData: Doc<"users">;
    parentMessageData: Doc<"messages">;
  } = await req.json();

  if (!userData || !parentMessageData) {
    return new Response("Unauthorized", { status: 401 });
  }

  const serverId = parentMessageData.serverId;
  const userId = userData._id;
  const membership = await convex.query(api.serverMembers.checkMembership, {
    serverId,
    userId,
  });

  if (!membership) {
    return new Response("User not a member of server", { status: 403 });
  }

  const room = "parentMessage" + String(parentMessageData._id);

  const session = liveblocks.prepareSession(userData._id, {
    userInfo: {
      name: userData.name,
      email: userData.email,
      image: userData.image,
      effectiveStatus: userData.effectiveStatus,
      manualStatus: userData.manualStatus,
    },
  });

  session.allow(room, session.FULL_ACCESS);

  const { body, status } = await session.authorize();
  return new Response(body, { status });
}
