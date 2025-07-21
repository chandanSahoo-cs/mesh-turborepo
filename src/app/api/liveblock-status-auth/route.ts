import { Liveblocks } from "@liveblocks/node";
import { ConvexHttpClient } from "convex/browser";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  // const user
  // const user = await convex.query(api.users.currentUser);

  const { userData } = await req.json();
  // console.log("user:", user);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  const room = String(userData._id);

  const session = liveblocks.prepareSession(userData._id, {
    userInfo: userData,
  });

  session.allow(room, session.FULL_ACCESS);

  const { body, status } = await session.authorize();
  return new Response(body, { status });
}
