import { NextRequest } from "next/server";

export function HEAD(req: NextRequest) {
  return new Response(null, { status: 204 });
}
