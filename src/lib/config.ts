export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Gatepass";

/**
 * Where the backend lives. Only the Next.js server uses this: browsers call this site's
 * own /api/... routes, which forward to the backend (see app/api/[...path]/route.ts).
 * That keeps the admin login cookie first-party, so phones (iOS Safari/Chrome) keep it.
 *
 * API_URL is preferred; NEXT_PUBLIC_API_URL / API_URL_INTERNAL still work for older setups.
 */
export const BACKEND_URL = normalizeBackendUrl(
  process.env.API_URL || process.env.API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
);

/**
 * Forgives the usual slips when pasting the backend address: a missing https://, http:// for a
 * hosted API (Render redirects it to https, which turns a login POST into a GET), and a
 * trailing slash or /api.
 */
function normalizeBackendUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const local = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]|[\w-]+)(:\d+)?$/i.test(url); // localhost or a docker service name
  if (!local) url = url.replace(/^http:\/\//i, "https://");
  return url;
}

/** Used from the browser: same origin, so requests go through this site's /api proxy. */
export const PUBLIC_API_URL = "";

/** Used from the Next.js server: talks to the backend directly. */
export const SERVER_API_URL = BACKEND_URL;

/** Turns a stored image reference into something an <img> can load. Uploaded images are stored as /uploads/... paths on the API. */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  // Local uploads are served through this site's /uploads proxy; Cloudinary URLs are used as-is.
  return url;
}
