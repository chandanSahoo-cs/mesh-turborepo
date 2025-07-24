import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);


export async function POST(req:Request) {
    const {userId} = await req.json()

    await convex.mutation(api.users.updateEffectiveStatus,{
        userId: userId,
        status: "offline"
    })


    return new Response("OK");
}