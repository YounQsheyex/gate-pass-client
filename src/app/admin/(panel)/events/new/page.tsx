import { EventForm } from "@/components/admin/EventForm";
import { AdminOnly } from "@/components/admin/AdminShell";

export default function NewEventPage() {
  return (
    <AdminOnly>
      <EventForm />
    </AdminOnly>
  );
}
