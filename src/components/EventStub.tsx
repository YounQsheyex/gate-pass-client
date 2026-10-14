import Link from "next/link";
import { naira, eventTime, stubDate, venueLabel } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";
import { EventImage } from "./EventImage";

/** An event drawn as a ticket: yellow date stub, perforation, then the details. */
export function EventStub({ event, featured = false }: { event: PublicEvent; featured?: boolean }) {
  const d = stubDate(event.startsAt);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-lilac transition-colors hover:bg-[#e6e2f8] sm:flex-row"
      style={{ ["--notch" as string]: "var(--color-paper)" }}
    >
      <div
        className={`flex shrink-0 items-center gap-3 bg-stub px-5 py-4 sm:w-32 sm:flex-col sm:justify-center sm:gap-0 sm:px-0 sm:py-6 ${
          featured ? "sm:w-44" : ""
        }`}
      >
        <span className="text-sm font-semibold sm:text-base">{d.weekday}</span>
        <span className={`font-display font-extrabold leading-none ${featured ? "text-5xl sm:text-7xl" : "text-4xl sm:text-5xl"}`}>
          {d.day}
        </span>
        <span className="text-sm font-semibold sm:text-base">{d.month}</span>
      </div>

      <div className="perforation flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <EventImage
          src={event.coverImageUrl}
          className={`w-full rounded-lg object-cover ${featured ? "aspect-[2/1]" : "aspect-[16/9]"}`}
        />
        <h2
          className={`font-display font-extrabold leading-[0.95] tracking-tight group-hover:text-accent ${
            featured ? "text-4xl sm:text-6xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {event.title}
        </h2>
        <p className="text-ink-soft">
          {venueLabel(event)}, {eventTime(event.startsAt)}
        </p>
        <p className="mt-auto pt-1 font-semibold">
          {event.soldOut ? (
            <span className="text-bad">Sold out</span>
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
