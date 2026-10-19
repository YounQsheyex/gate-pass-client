"use client";

import { useAdminHref } from "./AdminBase";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import { eventDate, eventTime, naira } from "@/lib/format";
import type { AdminEvent } from "@/lib/types";
import { Alert, buttonClass } from "@/components/ui";
import { StatusBadge } from "./StatusBadge";

export function EventsList() {
  const href = useAdminHref();
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ events: AdminEvent[] }>("/api/admin/events")
      .then(({ events }) => setEvents(events))
      .catch((err) => setError(errorMessage(err)));
  }, []);

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
            <li key={e.id}>
              <Link
                href={href(`/events/${e.id}`)}
                className="flex flex-col gap-3 rounded-2xl border border-line p-5 hover:border-ink sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold">{e.title}</h2>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="text-ink-soft">
                    {eventDate(e.startsAt)}, {eventTime(e.startsAt)} at {e.venue}
                    {e.venueHidden && <span className="ml-2 rounded-full bg-stub px-2 py-0.5 text-xs font-bold text-ink">Secret location</span>}
                  </p>
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
