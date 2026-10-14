import { Suspense } from "react";
import { OrderDetail } from "@/components/admin/OrderDetail";
import { AdminOnly } from "@/components/admin/AdminShell";

export default function OrderDetailPage() {
  return (
    <AdminOnly>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <OrderDetail />
      </Suspense>
    </AdminOnly>
  );
}
