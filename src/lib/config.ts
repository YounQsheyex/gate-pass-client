export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Gatepass";

/** Used from the browser. */
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Used from the Next.js server. Set API_URL_INTERNAL when the server can reach the
 * API on a private address (e.g. http://backend:4000 in Docker).
 */
export const SERVER_API_URL = process.env.API_URL_INTERNAL ?? PUBLIC_API_URL;

/** Turns a stored image reference into something an <img> can load. Uploaded images are stored as /uploads/... paths on the API. */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("/uploads/") ? `${PUBLIC_API_URL}${url}` : url;
}
