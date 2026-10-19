"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** The admin area's address (e.g. "/my-secret-word"), handed down from the server layout. */
const AdminBaseContext = createContext("/admin");

export function AdminBaseProvider({ base, children }: { base: string; children: ReactNode }) {
  return <AdminBaseContext.Provider value={base}>{children}</AdminBaseContext.Provider>;
}

/** Builds links inside the admin area: href("/events") → "/my-secret-word/events". */
export function useAdminHref() {
  const base = useContext(AdminBaseContext);
  return (sub = "") => `${base}${sub}`;
}

export function useAdminBase() {
  return useContext(AdminBaseContext);
}

/**
 * The part of the current address after the admin prefix ("/events", "" for the dashboard).
 * Stripping the first segment, whatever it is, gives the same answer on the server
 * (/admin/...) and in the browser (/<secret>/...), so nothing flickers on load.
 */
export function useAdminSubpath() {
  const pathname = usePathname();
  return pathname.replace(/^\/[^/]+/, "");
}
