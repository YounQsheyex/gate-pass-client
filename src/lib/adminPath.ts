/**
 * The secret first part of the admin address, from ADMIN_PATH (server-only, never sent to
 * public pages). With ADMIN_PATH=my-secret-word the dashboard lives at /my-secret-word and
 * plain /admin shows "page not found". Unset (or invalid) keeps the old /admin address.
 *
 * The pages themselves stay in app/admin; src/proxy.ts maps the secret address onto them.
 */
const RESERVED = new Set(["admin", "api", "uploads", "events", "orders", "_next", "favicon.ico", "icon.svg", "apple-icon.png"]);

let warned = false;

export function adminSegment(): string {
  const raw = (process.env.ADMIN_PATH ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!raw) return "admin";
  const valid = /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(raw) && !RESERVED.has(raw.toLowerCase());
  if (!valid) {
    if (!warned) {
      warned = true;
      console.warn(
        `[admin] ADMIN_PATH "${raw}" can't be used (use 3-64 letters, numbers, - or _, one word, not a page name the site already uses). Falling back to /admin.`,
      );
    }
    return "admin";
  }
  return raw;
}
