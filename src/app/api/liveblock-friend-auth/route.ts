import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";
import { Doc } from "../../../../convex/_generated/dataModel";

type RequestType = {
  userData: Doc<"users">;
  channelData: Doc<"channels">;
  type: "conversation" | "status";
};

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const { userData }: RequestType = await req.json();

  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  const room = String(userData._id);

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
