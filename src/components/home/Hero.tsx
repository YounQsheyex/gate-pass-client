import Link from "next/link";
import { eventDate, eventTime, naira, stubDate, venueLabel } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";
import { Poster } from "../Poster";
import { Countdown } from "./Countdown";

/** The headliner: the organiser's main event (or the soonest), staged like a gig poster with a live countdown. */
export function Hero({ event }: { event: PublicEvent }) {
  const d = stubDate(event.startsAt);
  const href = `/events/${event.slug}`;
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      <div className="stage-lights -z-10" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:gap-14 md:pt-14 md:pb-24">
        <div>
          <p className="font-semibold text-stub">{event.isMain ? "Don’t miss" : "Next up"}</p>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,8vw,6.5rem)] font-extrabold leading-[0.88] tracking-tight text-balance">
            {event.title}
          </h1>
          <p className="mt-5 text-lg text-white/80 sm:text-xl">
            {eventDate(event.startsAt)}, {eventTime(event.startsAt)}
            <br />
            {venueLabel(event)}
          </p>

          <div className="mt-7">
            <Countdown to={event.startsAt} />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {event.soldOut ? (
              <span className="rounded-full bg-white/10 px-6 py-4 text-lg font-semibold ring-1 ring-white/20">Sold out</span>
            ) : (
              <Link
                href={href}
                className="rounded-full bg-accent px-7 py-4 text-lg font-semibold text-white shadow-[0_10px_40px_-8px_rgb(216_27_114/0.8)] transition hover:-translate-y-0.5 hover:bg-accent-dark"
              >
                {event.minPrice === null
                  ? "See the event"
                  : event.minPrice === 0
                    ? "Get free tickets"
                    : `Get tickets from ${naira(event.minPrice)}`}
              </Link>
            )}
            <Link href={href} className="rounded-full px-5 py-4 font-semibold text-white/85 hover:text-white">
              Event details
            </Link>
          </div>
          {event.showTicketsLeft && !event.soldOut && event.capacity > 0 && event.ticketsLeft <= Math.max(10, event.capacity * 0.15) && (
            <p className="mt-4 font-semibold text-stub">Only {event.ticketsLeft} tickets left</p>
          )}
        </div>

        {/* The poster, cut like a ticket: artwork, perforation, then a stub with the date. */}
        <Link
          href={href}
          aria-label={`${event.title} poster`}
          className="ticket-drop mx-auto block w-full max-w-[300px] [--tilt:3deg] sm:max-w-sm md:max-w-none"
          style={{ transform: "rotate(var(--tilt))" }}
        >
          <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/10">
            <Poster title={event.title} startsAt={event.startsAt} src={event.coverImageUrl} className="aspect-[4/5]" showTitle />
            <div className="perforation-h relative flex items-center justify-between bg-stub px-6 py-4 text-ink" style={{ ["--notch" as string]: "var(--color-night)" }}>
              <span className="font-display text-3xl font-extrabold leading-none">
                {d.day} {d.month}
              </span>
              <span className="text-right text-sm font-semibold leading-tight">
                {d.weekday}
                <br />
                {eventTime(event.startsAt)}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
