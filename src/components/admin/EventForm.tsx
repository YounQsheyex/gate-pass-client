"use client";

import { useAdminHref } from "./AdminBase";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, del, errorMessage, patch, post } from "@/lib/api";
import { fromLagosInput, naira, toLagosInput } from "@/lib/format";
import type { AdminEvent } from "@/lib/types";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CoverImageField } from "./CoverImageField";

type TicketRow = {
  key: string;
  id?: string;
  name: string;
  description: string;
  /** Naira as typed, e.g. "5000" or "5,000". */
  price: string;
  quantity: string;
  maxPerOrder: string;
  sold: number;
  soldOut: boolean;
};

type FormState = {
  title: string;
  slug: string;
  venue: string;
  venueHidden: boolean;
  venueHint: string;
  startsAt: string;
  endsAt: string;
  coverImageUrl: string;
  description: string;
  status: AdminEvent["status"];
  soldOut: boolean;
  showTicketsLeft: boolean;
  featured: boolean;
  isMain: boolean;
  ticketTypes: TicketRow[];
};

let rowKey = 0;
const newRow = (): TicketRow => ({
  key: `new-${rowKey++}`,
  name: "",
  description: "",
  price: "",
  quantity: "",
  maxPerOrder: "10",
  sold: 0,
  soldOut: false,
});

const empty: FormState = {
  title: "",
  slug: "",
  venue: "",
  venueHidden: false,
  venueHint: "",
  startsAt: "",
  endsAt: "",
  coverImageUrl: "",
  description: "",
  status: "draft",
  soldOut: false,
  showTicketsLeft: true,
  featured: true,
  isMain: false,
  ticketTypes: [{ ...newRow(), name: "Regular" }],
};

function fromEvent(e: AdminEvent): FormState {
  return {
    title: e.title,
    slug: e.slug,
    venue: e.venue,
    venueHidden: e.venueHidden,
    venueHint: e.venueHint,
    startsAt: toLagosInput(e.startsAt),
    endsAt: toLagosInput(e.endsAt),
    coverImageUrl: e.coverImageUrl,
    description: e.description,
    status: e.status,
    soldOut: e.soldOut,
    showTicketsLeft: e.showTicketsLeft,
    featured: e.featured,
    isMain: e.isMain,
    ticketTypes: e.ticketTypes.map((t) => ({
      key: t.id,
      id: t.id,
      name: t.name,
      description: t.description,
      price: String(t.price / 100),
      quantity: String(t.quantity),
      maxPerOrder: String(t.maxPerOrder),
      sold: t.sold,
      soldOut: t.soldOut,
    })),
  };
}

/** "5,000.50" → 500050 kobo; null if not a valid amount. */
function toKobo(naira: string): number | null {
  const cleaned = naira.replace(/[,₦\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function EventForm({ eventId }: { eventId?: string }) {
  const href = useAdminHref();
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(eventId ? null : empty);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    api<{ event: AdminEvent }>(`/api/admin/events/${eventId}`)
      .then(({ event }) => {
        setForm(fromEvent(event));
        setPublicSlug(event.status === "published" ? event.slug : null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [eventId]);

  if (!form) return error ? <Alert>{error}</Alert> : <p className="text-muted">Loading…</p>;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false);
    setForm({ ...form, [key]: value });
  };
  const setRow = (key: string, patchRow: Partial<TicketRow>) =>
    set(
      "ticketTypes",
      form.ticketTypes.map((r) => (r.key === key ? { ...r, ...patchRow } : r)),
    );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);

    const startsAt = fromLagosInput(form.startsAt);
    if (!startsAt) return setError("Set when the event starts.");

    const ticketTypes = [];
    for (const r of form.ticketTypes) {
      const price = toKobo(r.price);
      const quantity = Number(r.quantity);
      const maxPerOrder = Number(r.maxPerOrder);
      if (!r.name.trim()) return setError("Every ticket type needs a name.");
      if (price === null) return setError(`Enter a price for “${r.name}” in naira, e.g. 5000.`);
      if (!Number.isInteger(quantity) || quantity < 0) return setError(`Enter how many “${r.name}” tickets are available.`);
      if (quantity < r.sold) return setError(`“${r.name}” already has ${r.sold} sold or held, so quantity can’t be lower.`);
      if (!Number.isInteger(maxPerOrder) || maxPerOrder < 1) return setError(`Set a per-order limit of at least 1 for “${r.name}”.`);
      ticketTypes.push({ id: r.id, name: r.name.trim(), description: r.description.trim(), price, quantity, maxPerOrder, soldOut: r.soldOut });
    }

    const body = {
      title: form.title,
      slug: form.slug,
      venue: form.venue,
      venueHidden: form.venueHidden,
      venueHint: form.venueHint.trim(),
      startsAt,
      endsAt: fromLagosInput(form.endsAt),
      coverImageUrl: form.coverImageUrl.trim(),
      description: form.description,
      status: form.status,
      soldOut: form.soldOut,
      showTicketsLeft: form.showTicketsLeft,
      featured: form.featured,
      isMain: form.isMain,
      ticketTypes,
    };

    setBusy(true);
    try {
      if (eventId) {
        const { event } = await patch<{ event: AdminEvent }>(`/api/admin/events/${eventId}`, body);
        setForm(fromEvent(event));
        setPublicSlug(event.status === "published" ? event.slug : null);
        setSaved(true);
      } else {
        const { event } = await post<{ event: AdminEvent }>("/api/admin/events", body);
        router.replace(href(`/events/${event.id}`));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href={href("/events")} className="text-sm font-semibold text-accent hover:underline">
          All events
        </Link>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{eventId ? form.title || "Edit event" : "New event"}</h1>
        {publicSlug && (
          <a href={`/events/${publicSlug}`} target="_blank" className="mt-1 inline-block text-sm font-semibold text-accent hover:underline">
            View public page
          </a>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title">
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={150} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Venue address" hint={form.venueHidden ? "Only shown on tickets after payment." : undefined}>
            <Input required value={form.venue} onChange={(e) => set("venue", e.target.value)} maxLength={200} />
          </Field>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-lilac p-4 sm:col-span-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.venueHidden}
              onChange={(e) => set("venueHidden", e.target.checked)}
              className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
            />
            <span>
              <span className="font-semibold">Keep the location secret until purchase</span>
              <span className="block text-sm text-ink-soft">
                The site shows “Secret location” instead of the address. Buyers see it on their emailed ticket and PDF.
              </span>
            </span>
          </label>
          {form.venueHidden && (
            <Field label="Area hint (optional)" hint="Shown publicly, e.g. “Lekki, Lagos”. Leave blank to reveal nothing.">
              <Input value={form.venueHint} onChange={(e) => set("venueHint", e.target.value)} maxLength={100} />
            </Field>
          )}
        </div>
        <Field label="Starts (Lagos time)">
          <Input type="datetime-local" required value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </Field>
        <Field label="Ends (optional)">
          <Input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <CoverImageField value={form.coverImageUrl} onChange={(v) => set("coverImageUrl", v)} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
        {eventId && (
          <Field label="Web address" hint={`/events/${form.slug || "…"}`}>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
          </Field>
        )}
        <Field label="Status" hint="Only events on sale appear on the site.">
          <Select value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])}>
            <option value="draft">Draft</option>
            <option value="published">On sale</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-lilac p-4">
        <h2 className="font-display text-xl font-bold">Home page</h2>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.isMain}
            onChange={(e) => setForm({ ...form, isMain: e.target.checked, featured: e.target.checked ? true : form.featured })}
            className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
          />
          <span>
            <span className="font-semibold">Make this the main event</span>
            <span className="block text-sm text-ink-soft">
              Shown big at the top of the home page, with the other events underneath. Only one event can be main; choosing this one
              replaces the current main event.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked, isMain: e.target.checked ? form.isMain : false })}
            className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
          />
          <span>
            <span className="font-semibold">Show on the home page</span>
            <span className="block text-sm text-ink-soft">
              Untick to keep it off the home page until you tick it again. Its own page still works for anyone with the link, so you
              can sell to a private list.
            </span>
          </span>
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-lilac p-4">
        <h2 className="font-display text-xl font-bold">Sales</h2>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.soldOut}
            onChange={(e) => set("soldOut", e.target.checked)}
            className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
          />
          <span>
            <span className="font-semibold">Mark the whole event as sold out</span>
            <span className="block text-sm text-ink-soft">
              The event stays on the site with a “Sold out” label and nobody can order, even if tickets are left. Orders already
              waiting for payment can still be confirmed.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.showTicketsLeft}
            onChange={(e) => set("showTicketsLeft", e.target.checked)}
            className="mt-1 h-5 w-5 accent-[var(--color-accent)]"
          />
          <span>
            <span className="font-semibold">Show how many tickets are left</span>
            <span className="block text-sm text-ink-soft">
              Buyers see “12 left” under each ticket type (e.g. VIP, Regular). Turn off to hide the numbers; “Sold out” still shows.
            </span>
          </span>
        </label>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold">Ticket types</h2>
        {form.ticketTypes.map((r) => (
          <fieldset key={r.key} className="grid gap-3 rounded-2xl bg-lilac p-4 sm:grid-cols-[2fr_1fr_1fr_1fr]">
            <legend className="sr-only">{r.name || "New ticket type"}</legend>
            <Field label="Name">
              <Input required value={r.name} onChange={(e) => setRow(r.key, { name: e.target.value })} placeholder="Regular" />
            </Field>
            <Field label="Price (₦)">
              <Input required inputMode="decimal" value={r.price} onChange={(e) => setRow(r.key, { price: e.target.value })} placeholder="5000" />
            </Field>
            <Field label="Total tickets" hint={r.id ? ticketsLeftHint(r) : undefined}>
              <Input required inputMode="numeric" value={r.quantity} onChange={(e) => setRow(r.key, { quantity: e.target.value })} />
            </Field>
            <Field label="Max per order">
              <Input required inputMode="numeric" value={r.maxPerOrder} onChange={(e) => setRow(r.key, { maxPerOrder: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 sm:col-span-4">
              <input
                type="checkbox"
                checked={r.soldOut}
                onChange={(e) => setRow(r.key, { soldOut: e.target.checked })}
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              <span className="text-sm font-semibold">Mark “{r.name || "this type"}” as sold out</span>
            </label>
            <div className="sm:col-span-3">
              <Field label="Short description (optional)">
                <Input value={r.description} onChange={(e) => setRow(r.key, { description: e.target.value })} placeholder="Includes a drink" />
              </Field>
            </div>
            <div className="flex items-end">
              {r.sold === 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-bad"
                  onClick={() => set("ticketTypes", form.ticketTypes.filter((x) => x.key !== r.key))}
                >
                  Remove
                </Button>
              ) : (
                <p className="pb-3 text-sm text-muted">
                  {naira((toKobo(r.price) ?? 0) * r.sold)} so far
                </p>
              )}
            </div>
          </fieldset>
        ))}
        <Button type="button" variant="ghost" className="self-start" onClick={() => set("ticketTypes", [...form.ticketTypes, newRow()])}>
          + Add ticket type
        </Button>
      </section>

      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="ok">Saved.</Alert>}

      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : eventId ? "Save changes" : "Create event"}
        </Button>
      </div>

      {eventId && <DeleteEvent eventId={eventId} title={form.title} onDeleted={() => router.replace(href("/events"))} />}
    </form>
  );
}

function ticketsLeftHint(r: TicketRow) {
  const total = Number(r.quantity);
  const left = Number.isInteger(total) ? Math.max(0, total - r.sold) : null;
  if (r.soldOut) return `Marked sold out (${r.sold} sold or held)`;
  return left === null ? `${r.sold} sold or held` : `${left} left · ${r.sold} sold or held`;
}

/** Permanent delete, behind a second confirmation. The API refuses if anyone has paid or is paying. */
function DeleteEvent({ eventId, title, onDeleted }: { eventId: string; title: string; onDeleted: () => void }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await del(`/api/admin/events/${eventId}`);
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-bad/30 p-4">
      <h2 className="font-display text-xl font-bold text-bad">Delete event</h2>
      <p className="text-sm text-ink-soft">
        Removes the event and its ticket types for good. Only possible before anyone has paid. To take an event with sales off the
        site, set its status to Cancelled instead.
      </p>
      {!asking ? (
        <Button type="button" variant="danger" className="self-start" onClick={() => setAsking(true)}>
          Delete this event
        </Button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl bg-bad/5 p-3">
          <p className="font-semibold">Delete “{title}” permanently? This can&rsquo;t be undone.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="danger" disabled={busy} onClick={remove} className="border-bad bg-bad text-white hover:bg-bad/90">
              {busy ? "Deleting…" : "Yes, delete it"}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setAsking(false)}>
              Keep it
            </Button>
          </div>
        </div>
      )}
      {error && <Alert>{error}</Alert>}
    </section>
  );
}
