import { EventsList } from "@/components/admin/EventsList";
import { AdminOnly } from "@/components/admin/AdminShell";

export default function AdminEventsPage() {
  return (
    <AdminOnly>
      <EventsList />
    </AdminOnly>
  );
}
