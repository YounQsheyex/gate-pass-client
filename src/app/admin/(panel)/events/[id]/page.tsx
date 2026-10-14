import { Suspense } from "react";
import { EditEvent } from "@/components/admin/EditEvent";
import { AdminOnly } from "@/components/admin/AdminShell";

export default function EditEventPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <EditEvent />
      </Suspense>
    </AdminOnly>
  );
}
