import { TeamPage } from "@/components/admin/TeamPage";
import { AdminOnly } from "@/components/admin/AdminShell";

export default function UsersPage() {
  return (
    <AdminOnly>
      <TeamPage />
    </AdminOnly>
  );
}
