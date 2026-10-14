import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

type Ctx = { params: Promise<{ path: string[] }> };

/** Every /api/... call from the browser is forwarded to the backend. */
async function handler(req: NextRequest, { params }: Ctx) {
  return proxyToBackend(req, "/api", (await params).path);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
