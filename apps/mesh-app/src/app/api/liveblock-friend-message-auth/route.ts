//For friend-message
import { Liveblocks } from "@liveblocks/node";
import { Doc } from "../../../../convex/_generated/dataModel";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: Request) {
  const {
    userData,
    otherUserData,
  }: {
    userData: Doc<"users">;
    otherUserData: Doc<"users">;
  } = await req.json();

  if (!userData || !otherUserData) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [u1, u2] = [userData._id, otherUserData._id].sort();

  const room = "friendMessage" + String(u1) + String(u2);

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
