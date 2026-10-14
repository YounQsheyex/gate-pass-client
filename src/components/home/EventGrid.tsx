"use client";

import { useMemo, useState } from "react";
import type { PublicEvent } from "@/lib/types";
import { EventCard } from "./EventCard";

type Filter = "all" | "weekend" | "month" | "free";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "weekend", label: "This weekend" },
  { id: "month", label: "Next 30 days" },
  { id: "free", label: "Free" },
];

function inWeekend(d: Date, now: Date) {
  // Friday 00:00 to Sunday 23:59 of the current week (or today, if it's already the weekend).
  const start = new Date(now);
  const day = now.getDay(); // 0 Sun … 6 Sat
  const toFri = day === 0 ? -2 : day === 6 ? -1 : 5 - day;
  start.setDate(now.getDate() + toFri);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 3);
  return d >= start && d < end;
}

export function EventGrid({ events }: { events: PublicEvent[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      const d = new Date(e.startsAt);
      if (filter === "weekend") return inWeekend(d, now);
      if (filter === "month") return d.getTime() - now.getTime() <= 30 * 86400e3;
      if (filter === "free") return e.minPrice === 0;
      return true;
    });
  }, [events, filter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Filter events">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === f.id ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:ring-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-line">
          <p className="font-display text-2xl font-bold">Nothing here yet</p>
          <p className="mt-1 text-ink-soft">No events match this filter. Try another one.</p>
          <button onClick={() => setFilter("all")} className="mt-4 font-semibold text-accent hover:underline">
            Show all events
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
