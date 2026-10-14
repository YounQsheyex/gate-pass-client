import { Suspense } from "react";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { eventDate, eventTime } from "@/lib/format";
import type { PublicEventDetail } from "@/lib/types";
import { Checkout } from "@/components/Checkout";
import { EventImage } from "@/components/EventImage";

export default function EventPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto mt-10 h-96 w-full max-w-6xl animate-pulse rounded-2xl bg-lilac" aria-busy="true" />}>
      <EventDetail params={params} />
    </Suspense>
  );
}

async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let event: PublicEventDetail;
  try {
    ({ event } = await api<{ event: PublicEventDetail }>(`/api/events/${encodeURIComponent(slug)}`));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1fr_400px] lg:gap-14">
      <article className="min-w-0">
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
          {event.title}
        </h1>
        <dl className="mt-6 grid gap-x-8 gap-y-3 text-lg sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">When</dt>
          <dd className="font-medium">
            {eventDate(event.startsAt)}, {eventTime(event.startsAt)}
            {event.endsAt && <> to {eventTime(event.endsAt)}</>}
          </dd>
          <dt className="text-muted">Where</dt>
          <dd className="font-medium">
            {event.venueHidden ? (
              <>
                {event.venueHint ? `Secret location in ${event.venueHint}` : "Secret location"}
                <span className="mt-1 block text-base font-normal text-ink-soft">
                  The exact address is printed on your ticket, which we email once your payment is confirmed.
                </span>
              </>
            ) : (
              event.venue
            )}
          </dd>
        </dl>
        <EventImage src={event.coverImageUrl} className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
        {event.description && (
          <div className="mt-8 max-w-[65ch] whitespace-pre-line text-lg leading-relaxed text-ink-soft">
            {event.description}
          </div>
        )}
      </article>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {event.onSale ? (
          <Checkout event={event} />
        ) : (
          <p className="rounded-2xl bg-lilac p-6 font-medium">Ticket sales for this event have closed.</p>
        )}
      </aside>
    </div>
  );
}
