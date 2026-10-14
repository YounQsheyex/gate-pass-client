import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
