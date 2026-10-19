import { AdminBaseProvider } from "@/components/admin/AdminBase";
import { adminSegment } from "@/lib/adminPath";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminBaseProvider base={`/${adminSegment()}`}>{children}</AdminBaseProvider>;
}
