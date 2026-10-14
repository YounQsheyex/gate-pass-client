"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, post } from "@/lib/api";
import { naira } from "@/lib/format";
import type { PublicEventDetail } from "@/lib/types";
import { Alert, Button, Field, Input } from "./ui";

export function Checkout({ event }: { event: PublicEventDetail }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lines = event.ticketTypes.filter((t) => (qty[t.id] ?? 0) > 0);
  const total = lines.reduce((sum, t) => sum + t.price * (qty[t.id] ?? 0), 0);
  const count = lines.reduce((sum, t) => sum + (qty[t.id] ?? 0), 0);

  function change(id: string, delta: number, max: number) {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(max, (q[id] ?? 0) + delta)) }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (count === 0) {
      setError("Choose at least one ticket.");
      return;
    }
    setSubmitting(true);
    try {
      const { reference } = await post<{ reference: string }>("/api/orders", {
        eventId: event.id,
        items: lines.map((t) => ({ ticketTypeId: t.id, quantity: qty[t.id] })),
        buyer,
      });
      router.push(`/orders/${reference}`);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  if (event.ticketTypes.length === 0) {
    return <p className="rounded-2xl bg-lilac p-6 font-medium">Tickets for this event aren&rsquo;t on sale yet.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6 rounded-2xl bg-lilac p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold">Get tickets</h2>

      <ul className="flex flex-col divide-y divide-line">
        {event.ticketTypes.map((t) => {
          const n = qty[t.id] ?? 0;
          const max = Math.min(t.maxPerOrder, t.available);
          return (
            <li key={t.id} className="flex items-center gap-4 py-3 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.name}</p>
                <p className="text-ink-soft">{t.price === 0 ? "Free" : naira(t.price)}</p>
                {t.description && <p className="text-sm text-muted">{t.description}</p>}
                {t.available === 0 ? (
                  <p className="text-sm font-semibold text-bad">Sold out</p>
                ) : t.available <= 10 ? (
                  <p className="text-sm font-semibold text-warn">{t.available} left</p>
                ) : null}
              </div>
              {t.available > 0 && (
                <div className="flex items-center gap-1" role="group" aria-label={`${t.name} quantity`}>
                  <button
                    type="button"
                    onClick={() => change(t.id, -1, max)}
                    disabled={n === 0}
                    aria-label={`Remove one ${t.name} ticket`}
                    className="h-10 w-10 rounded-full bg-white text-xl font-semibold disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-semibold tabular-nums" aria-live="polite">
                    {n}
                  </span>
                  <button
                    type="button"
                    onClick={() => change(t.id, 1, max)}
                    disabled={n >= max}
                    aria-label={`Add one ${t.name} ticket`}
                    className="h-10 w-10 rounded-full bg-ink text-xl font-semibold text-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-semibold">Your details</legend>
        <Field label="Full name">
          <Input
            required
            autoComplete="name"
            value={buyer.name}
            onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
          />
        </Field>
        <Field label="Email" hint="Your tickets are sent here.">
          <Input
            required
            type="email"
            autoComplete="email"
            inputMode="email"
            value={buyer.email}
            onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
          />
        </Field>
        <Field label="WhatsApp number" hint="So we can match your payment to this order.">
          <Input
            required
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="0801 234 5678"
            value={buyer.phone}
            onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
          />
        </Field>
      </fieldset>

      {error && <Alert>{error}</Alert>}

      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-ink-soft">
          {count} ticket{count === 1 ? "" : "s"}
        </span>
        <span className="font-display text-3xl font-extrabold">{naira(total)}</span>
      </div>

      <Button type="submit" disabled={submitting || count === 0} className="w-full py-4 text-lg">
        {submitting ? "Reserving your tickets…" : "Reserve tickets"}
      </Button>
      <p className="-mt-2 text-sm text-ink-soft">
        Next, you&rsquo;ll get our account details on WhatsApp. Your tickets are held while you pay.
      </p>
    </form>
  );
}
