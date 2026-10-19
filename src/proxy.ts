import { NextResponse, type NextRequest } from "next/server";
import { adminSegment } from "@/lib/adminPath";

/**
 * Serves the admin pages at the secret ADMIN_PATH address and hides the guessable /admin.
 * Visiting /admin gets the ordinary "page not found", the same as any made-up address.
 */
export function proxy(req: NextRequest) {
  const secret = adminSegment();
  if (secret === "admin") return NextResponse.next(); // ADMIN_PATH not set: keep /admin

  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];

  if (first === "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/__not-found";
    return NextResponse.rewrite(url);
  }

  if (first === secret) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname.slice(secret.length + 1)}`;
    const res = NextResponse.rewrite(url);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static files and the API/uploads forwarding routes.
  matcher: ["/((?!_next/|api/|uploads/|favicon\\.ico|icon\\.svg|apple-icon\\.png).*)"],
};
