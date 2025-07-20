import { fetchMutation } from "convex/nextjs";
import { NextRequest } from "next/server";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await fetchMutation(api.users.updateEffectiveStatus, {
      userId: body.userId,
      status: "offline",
    });

    return new Response("Status updated", { status: 200 });
  } catch (error) {
    return new Response("Failed", { status: 500 });
  }
}
