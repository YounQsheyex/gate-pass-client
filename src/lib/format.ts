const TZ = "Africa/Lagos";

/** Short public label for a venue: the address, or the hint for secret locations. */
export function venueLabel(e: { venue: string | null; venueHidden: boolean; venueHint: string | null }): string {
  if (!e.venueHidden) return e.venue ?? "";
  return e.venueHint ? `Secret location, ${e.venueHint}` : "Secret location";
}

/** Kobo → "₦12,500". */
export function naira(kobo: number): string {
  const value = kobo / 100;
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: kobo % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function eventDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function eventTime(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString("en-NG", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}

export function dateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString("en-NG", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Parts for the ticket stub: { day: "19", month: "Oct", weekday: "Sat" }. */
export function stubDate(iso: string | Date) {
  const d = new Date(iso);
  const part = (opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-NG", { timeZone: TZ, ...opts });
  return { day: part({ day: "numeric" }), month: part({ month: "short" }), weekday: part({ weekday: "short" }) };
}

/** Converts between <input type="datetime-local"> values (Lagos time) and ISO strings. */
export function toLagosInput(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  // Lagos is UTC+1 all year (no daylight saving).
  const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}
export function fromLagosInput(value: string): string | null {
  if (!value) return null;
  return new Date(`${value}:00+01:00`).toISOString();
}
