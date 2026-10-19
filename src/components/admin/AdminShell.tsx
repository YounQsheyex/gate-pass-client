"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/config";
import { SessionGate, useSession } from "./session";
import { useAdminHref, useAdminSubpath } from "./AdminBase";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </SessionGate>
  );
}

function Nav() {
  const { user, signOut } = useSession();
  const href = useAdminHref();
  const sub = useAdminSubpath();
  const links =
    user.role === "admin"
      ? [
          { sub: "", label: "Orders" },
          { sub: "/events", label: "Events" },
          { sub: "/scan", label: "Scan tickets" },
          { sub: "/users", label: "Team" },
        ]
      : [{ sub: "/scan", label: "Scan tickets" }];

  const isActive = (s: string) => (s === "" ? sub === "" || sub.startsWith("/orders") : sub.startsWith(s));

  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href={href()} className="font-display text-lg font-extrabold">
          {SITE_NAME} admin
        </Link>
        <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {links.map((l) => (
            <Link
              key={l.sub}
              href={href(l.sub)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${
                isActive(l.sub) ? "bg-white text-ink" : "text-white/80 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="hidden text-white/70 sm:inline">{user.name}</span>
          <button onClick={signOut} className="font-semibold text-white/90 hover:text-white">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

/** Renders children only for admins; staff see a short note instead. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const href = useAdminHref();
  if (user.role !== "admin") {
    return (
      <p className="text-ink-soft">
        This page is for admins. <Link href={href("/scan")} className="font-semibold text-accent">Go to the scanner</Link>.
      </p>
    );
  }
  return <>{children}</>;
}
