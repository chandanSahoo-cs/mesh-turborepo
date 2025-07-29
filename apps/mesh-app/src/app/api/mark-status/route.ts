import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

type StatusType = "online" | "offline" | "idle" | "dnd";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  console.log("WSS request");
  const { userId, status }: { userId: Id<"users">; status: StatusType } =
    await req.json();

  if (!userId || !status) {
    return new Response("Either userId or status is missing", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const markStatus = await convex.mutation(api.users.updateEffectiveStatus, {
    userId: userId,
    status: status,
  });

  if (!markStatus) {
    return new Response("Failed to mark the user status", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
  return new Response(`User:${userId} is marked ${status}`, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}
