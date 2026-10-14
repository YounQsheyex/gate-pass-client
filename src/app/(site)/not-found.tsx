import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">Not found</h1>
      <p className="mt-4 text-lg text-ink-soft">That event or order doesn&rsquo;t exist, or the link is incomplete.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-white">
        See all events
      </Link>
    </div>
  );
}
