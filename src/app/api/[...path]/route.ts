import type { NextRequest } from "next/server";
import { proxyStatus, proxyToBackend } from "@/lib/backendProxy";

type Ctx = { params: Promise<{ path: string[] }> };

/** Every /api/... call from the browser is forwarded to the backend. */
async function handler(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  if (path.length === 1 && path[0] === "_status") return proxyStatus();
  return proxyToBackend(req, "/api", path);
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
