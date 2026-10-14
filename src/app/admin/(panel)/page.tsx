import { OrdersList } from "@/components/admin/OrdersList";
import { AdminOnly } from "@/components/admin/AdminShell";

export default function OrdersPage() {
  return (
    <AdminOnly>
      <OrdersList />
    </AdminOnly>
  );
}
