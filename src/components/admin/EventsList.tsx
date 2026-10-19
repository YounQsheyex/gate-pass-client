"use client";

import { useAdminHref } from "./AdminBase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, errorMessage, patch } from "@/lib/api";
import { eventDate, eventTime, naira } from "@/lib/format";
import type { AdminEvent } from "@/lib/types";
import { Alert, buttonClass } from "@/components/ui";
import { StatusBadge } from "./StatusBadge";

export function EventsList() {
  const href = useAdminHref();
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api<{ events: AdminEvent[] }>("/api/admin/events")
      .then(({ events }) => setEvents(events))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  /** Make main / show / hide on the home page, straight from the list. */
  async function place(e: AdminEvent, change: { featured?: boolean; isMain?: boolean }) {
    setBusyId(e.id);
    setError(null);
    try {
      const next = await patch<{ featured: boolean; isMain: boolean }>(`/api/admin/events/${e.id}/placement`, change);
      setEvents((list) =>
        list?.map((x) =>
          x.id === e.id ? { ...x, ...next } : next.isMain ? { ...x, isMain: false } : x,
        ) ?? null,
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-extrabold">Events</h1>
        <Link href={href("/events/new")} className={buttonClass("primary")}>
          New event
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}
      {events?.length === 0 && (
        <p className="rounded-2xl bg-lilac p-6 text-ink-soft">
          No events yet. Create one, add ticket types, and set it to on sale.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {events?.map((e) => {
          const capacity = e.ticketTypes.reduce((s, t) => s + t.quantity, 0);
          return (
            <li key={e.id} className={`overflow-hidden rounded-2xl border ${e.isMain ? "border-accent ring-2 ring-accent/20" : "border-line"}`}>
              <Link
                href={href(`/events/${e.id}`)}
                className="flex flex-col gap-3 p-5 hover:bg-lilac/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold">{e.title}</h2>
                    <StatusBadge status={e.status} />
                    {e.soldOut && <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">Marked sold out</span>}
                    {e.isMain && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">Main event</span>}
                    {!e.featured && <span className="rounded-full bg-line px-2 py-0.5 text-xs font-bold text-ink-soft">Hidden from home page</span>}
                  </div>
                  <p className="text-ink-soft">
                    {eventDate(e.startsAt)}, {eventTime(e.startsAt)} at {e.venue}
                    {e.venueHidden && <span className="ml-2 rounded-full bg-stub px-2 py-0.5 text-xs font-bold text-ink">Secret location</span>}
                  </p>
                  {e.ticketTypes.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                      {e.ticketTypes.map((t) => {
                        const out = e.soldOut || t.soldOut || t.left === 0;
                        return (
                          <li
                            key={t.id}
                            className={`rounded-full px-3 py-1 font-semibold ${out ? "bg-bad/10 text-bad" : t.left <= 10 ? "bg-warn/15 text-ink" : "bg-lilac text-ink"}`}
                          >
                            {t.name}: {t.soldOut ? "sold out (marked)" : t.left === 0 ? "sold out" : `${t.left} of ${t.quantity} left`}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                {e.stats && (
                  <dl className="grid grid-cols-3 gap-6 text-sm sm:text-right">
                    <div>
                      <dt className="text-muted">Sold</dt>
                      <dd className="text-lg font-bold tabular-nums">
                        {e.stats.paidTickets}
                        <span className="text-sm font-medium text-muted">/{capacity}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Unpaid holds</dt>
                      <dd className="text-lg font-bold tabular-nums">{e.stats.pendingTickets}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Revenue</dt>
                      <dd className="text-lg font-bold tabular-nums">{naira(e.stats.revenue)}</dd>
                    </div>
                  </dl>
                )}
              </Link>
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-lilac/40 px-5 py-2.5 text-sm">
                <span className="mr-1 text-muted">Home page:</span>
                {e.isMain ? (
                  <button type="button" disabled={busyId === e.id} onClick={() => place(e, { isMain: false })} className="rounded-full px-3 py-1 font-semibold text-ink hover:bg-white disabled:opacity-50">
                    Remove as main
                  </button>
                ) : (
                  <button type="button" disabled={busyId === e.id} onClick={() => place(e, { isMain: true })} className="rounded-full bg-accent px-3 py-1 font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                    Make main event
                  </button>
                )}
                {e.featured ? (
                  <button type="button" disabled={busyId === e.id} onClick={() => place(e, { featured: false })} className="rounded-full px-3 py-1 font-semibold text-ink hover:bg-white disabled:opacity-50">
                    Hide from home page
                  </button>
                ) : (
                  <button type="button" disabled={busyId === e.id} onClick={() => place(e, { featured: true })} className="rounded-full px-3 py-1 font-semibold text-ink hover:bg-white disabled:opacity-50">
                    Show on home page
                  </button>
                )}
                {e.status !== "published" && <span className="text-muted">(only shows once the event is on sale)</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
