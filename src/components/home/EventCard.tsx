import Link from "next/link";
import { eventTime, naira, stubDate, venueLabel } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";
import { Poster } from "../Poster";

export function sellingFast(e: PublicEvent) {
  return !e.soldOut && e.capacity > 0 && e.ticketsLeft <= Math.max(10, e.capacity * 0.15);
}

/** Poster-first event card with the date as a tear-off stub. */
export function EventCard({ event }: { event: PublicEvent }) {
  const d = stubDate(event.startsAt);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgb(28_23_69/0.45)] hover:ring-transparent"
    >
      <div className="relative">
        <Poster
          title={event.title}
          startsAt={event.startsAt}
          src={event.coverImageUrl}
          showDate={false}
          className="aspect-[16/11] transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3 flex flex-col items-center rounded-2xl bg-stub px-3 py-2 text-ink shadow-lg">
          <span className="text-xs font-bold">{d.weekday}</span>
          <span className="font-display text-2xl font-extrabold leading-none">{d.day}</span>
          <span className="text-xs font-bold">{d.month}</span>
        </div>
        {event.soldOut ? (
          <span className="absolute top-3 right-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">Sold out</span>
        ) : sellingFast(event) ? (
          <span className="absolute top-3 right-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">Selling fast</span>
        ) : null}
      </div>
      <div className="perforation-h relative flex flex-1 flex-col gap-2 p-5" style={{ ["--notch" as string]: "var(--color-lilac)" }}>
        <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight group-hover:text-accent">{event.title}</h3>
        <p className="text-ink-soft">
          {venueLabel(event)}, {eventTime(event.startsAt)}
        </p>
        <p className="mt-auto pt-2 font-semibold">
          {event.soldOut ? (
            <span className="text-muted">Sold out</span>
          ) : event.minPrice === null ? (
            <span className="text-muted">Tickets coming soon</span>
          ) : event.minPrice === 0 ? (
            "Free"
          ) : (
            <>From {naira(event.minPrice)}</>
          )}
        </p>
      </div>
    </Link>
  );
}
