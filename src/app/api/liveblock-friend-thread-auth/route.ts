import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { Doc } from "../../../../convex/_generated/dataModel";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});


export async function POST(req: Request) {
  const {
    userData,
    parentMessageData,
  }: {
    userData: Doc<"users">;
    parentMessageData: Doc<"friendMessages">;
  } = await req.json();

  if (!userData || !parentMessageData) {
    return new Response("Unauthorized", { status: 401 });
  }

  const room = "friendThreadMessage" + String(parentMessageData._id);

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
