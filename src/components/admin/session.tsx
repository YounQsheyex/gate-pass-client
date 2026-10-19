"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError, post } from "@/lib/api";
import type { SessionUser } from "@/lib/types";
import { useAdminBase } from "./AdminBase";

const SessionContext = createContext<{ user: SessionUser; signOut: () => Promise<void> } | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionGate>");
  return ctx;
}

/** Loads the signed-in admin/staff user, or sends them to the sign-in page. */
export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const base = useAdminBase();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ user: SessionUser }>("/api/auth/me")
      .then(({ user }) => setUser(user))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`${base}/login?next=${encodeURIComponent(window.location.pathname)}`);
        } else {
          setError(err instanceof Error ? err.message : "Couldn't check your session.");
        }
      });
  }, [router, pathname, base]);

  async function signOut() {
    await post("/api/auth/logout").catch(() => {});
    router.replace(`${base}/login`);
  }

  if (error) return <p className="p-8 text-bad">{error}</p>;
  if (!user) return <p className="p-8 text-muted">Loading…</p>;
  return <SessionContext.Provider value={{ user, signOut }}>{children}</SessionContext.Provider>;
}
