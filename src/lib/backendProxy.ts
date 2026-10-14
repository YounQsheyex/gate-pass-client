/**
 * Forwards a browser request to the backend and streams the answer back.
 *
 * Why: when the site and the API are on different domains (e.g. vercel.app and onrender.com),
 * phones block the API's login cookie as a "third-party" cookie, so admins get bounced back
 * to sign-in. Going through this site makes every request same-origin, and the cookie is
 * stored for this site like any normal login.
 */
import type { NextRequest } from "next/server";
import { BACKEND_URL } from "./config";

// Headers that describe a single network hop and must not be copied across.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
  "proxy-authorization",
  "te",
  "trailer",
]);

function clientIp(req: NextRequest): string | null {
  // Vercel/Render/most hosts put the visitor's address first in x-forwarded-for.
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") || fwd || null;
}

/**
 * Open /api/_status on the live site to check the setup: it shows which backend this site
 * forwards to and whether that backend answers. A 404 or 405 there means the deployed site
 * is an older build without the forwarding routes.
 */
export async function proxyStatus() {
  const source = process.env.API_URL
    ? "API_URL"
    : process.env.API_URL_INTERNAL
      ? "API_URL_INTERNAL"
      : process.env.NEXT_PUBLIC_API_URL
        ? "NEXT_PUBLIC_API_URL"
        : "not set (using http://localhost:4000)";
  let backend: string;
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    backend = res.ok ? "reachable" : `answered with HTTP ${res.status}`;
  } catch (err) {
    backend = `not reachable (${err instanceof Error ? err.message : "error"})`;
  }
  return Response.json(
    { forwarding: true, backendUrl: BACKEND_URL, setFrom: source, backend, proxySecretSet: Boolean(process.env.PROXY_SECRET) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function proxyToBackend(req: NextRequest, prefix: "/api" | "/uploads", path: string[]) {
  const target = `${BACKEND_URL}${prefix}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key) && !key.startsWith("x-forwarded-") && key !== "x-real-ip") headers.set(key, value);
  });
  // Tell the backend who the real visitor is, so rate limits apply per person rather than to this server.
  // The shared secret proves the header came from us and not from someone calling the API directly.
  const ip = clientIp(req);
  if (ip && process.env.PROXY_SECRET) {
    headers.set("x-client-ip", ip);
    headers.set("x-proxy-secret", process.env.PROXY_SECRET);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let res: Response;
  try {
    res = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "Can't reach the server right now. Try again in a moment." }, { status: 502 });
  }

  const out = new Headers();
  res.headers.forEach((value, key) => {
    // fetch already decoded the body, so the original encoding/length no longer apply.
    if (!["content-encoding", "content-length", "transfer-encoding", "connection", "set-cookie"].includes(key)) {
      out.set(key, value);
    }
  });
  // Pass every cookie through untouched; without a Domain attribute they now belong to this site.
  for (const cookie of res.headers.getSetCookie()) out.append("set-cookie", cookie);

  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}
