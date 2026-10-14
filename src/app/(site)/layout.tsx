import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="bg-night text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
            <span aria-hidden="true" className="inline-block h-6 w-4 rounded-[5px] bg-stub [clip-path:polygon(0_0,100%_0,100%_38%,78%_50%,100%_62%,100%_100%,0_100%,0_62%,22%_50%,0_38%)]" />
            {SITE_NAME}
          </Link>
          <Link href="/#events" className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/20 hover:bg-white/10 hover:text-white">
            Browse events
          </Link>
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <footer className="bg-night text-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display text-lg font-extrabold text-white">{SITE_NAME}</p>
          <p>Tickets are emailed once your payment is confirmed. Each QR code admits one person, once.</p>
        </div>
      </footer>
    </>
  );
}
