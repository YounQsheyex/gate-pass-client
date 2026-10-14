import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

/** Event images saved on the backend's own disk (when Cloudinary isn't configured). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToBackend(req, "/uploads", (await params).path);
}
