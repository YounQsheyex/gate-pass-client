"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError, errorMessage } from "@/lib/api";
import { dateTime, eventDate, eventTime, naira, venueLabel } from "@/lib/format";
import type { PublicOrder } from "@/lib/types";
import { Alert, WhatsAppIcon, buttonClass } from "./ui";

const POLL_MS = 15_000;

export function OrderTracker() {
  const { reference } = useParams<{ reference: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const { order } = await api<{ order: PublicOrder }>(`/api/orders/${encodeURIComponent(reference)}`);
      setOrder(order);
      setError(null);
    } catch (err) {
      setError({ message: errorMessage(err), notFound: err instanceof ApiError && err.status === 404 });
    }
  }, [reference]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep checking while we wait for the admin to confirm the payment.
  useEffect(() => {
    if (order?.status !== "pending") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [order?.status, load]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the reference is visible anyway */
    }
  }

  if (error && !order) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">{error.notFound ? "Order not found" : "Couldn’t load your order"}</h1>
        <p className="mt-3 text-lg text-ink-soft">
          {error.notFound ? "Check the reference in your link and try again." : error.message}
        </p>
      </div>
    );
  }
  if (!order) return <div className="mx-auto mt-10 h-96 w-full max-w-2xl animate-pulse rounded-2xl bg-lilac" aria-busy="true" />;

  const steps = [
    { label: "Tickets reserved", done: true },
    { label: "Payment confirmed", done: order.status === "paid" },
    { label: "Tickets emailed", done: order.ticketsEmailed },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-10 pb-20 sm:px-6">
      <p className="text-ink-soft">Your order reference</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">{order.reference}</h1>
        <button onClick={copy} className={buttonClass("ghost", "px-3 py-2 text-sm")}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <StatusBanner order={order} />

      {order.status !== "cancelled" && order.status !== "expired" && (
        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.label}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${s.done ? "bg-ink text-white" : "bg-lilac text-ink-soft"}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  s.done ? "bg-stub text-ink" : "bg-white"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className="font-semibold">{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {order.status === "pending" && order.whatsappUrl && (
        <section className="mt-8 rounded-2xl bg-lilac p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold">Pay on WhatsApp</h2>
          <p className="mt-2 text-ink-soft">
            Tap the button to message us with your order. We&rsquo;ll reply with the account to pay into. Once we
            confirm your transfer, your tickets go to <b className="text-ink">{order.buyer.email}</b>.
          </p>
          <a
            href={order.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("whatsapp", "mt-5 w-full py-4 text-lg")}
          >
            <WhatsAppIcon /> Continue on WhatsApp
          </a>
          <p className="mt-3 text-sm text-ink-soft">
            Use <b className="text-ink">{order.reference}</b> as your transfer narration. Your tickets are held until{" "}
            {dateTime(order.expiresAt)}.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold">{order.event.title}</h2>
        {order.event.startsAt && (
          <p className="mt-1 text-ink-soft">
            {eventDate(order.event.startsAt)}, {eventTime(order.event.startsAt)}
            {(order.event.venue || order.event.venueHidden) && <> at {venueLabel(order.event)}</>}
          </p>
        )}
        {order.event.venueHidden && (
          <p className="mt-2 text-sm text-ink-soft">
            {order.status === "paid"
              ? "The exact location is on your ticket. Check your email or the PDF attached to it."
              : "The exact location will be on your ticket, sent by email once your payment is confirmed."}
          </p>
        )}
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.items.map((i) => (
            <li key={i.name} className="flex justify-between py-3">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span className="tabular-nums">{naira(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between py-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{naira(order.total)}</span>
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Ordered by {order.buyer.name} ({order.buyer.email})
        </p>
        {order.event.slug && (
          <Link href={`/events/${order.event.slug}`} className="mt-6 inline-block font-semibold text-accent hover:underline">
            Back to the event
          </Link>
        )}
      </section>
    </div>
  );
}

function StatusBanner({ order }: { order: PublicOrder }) {
  switch (order.status) {
    case "paid":
      return (
        <div className="mt-6">
          <Alert tone="ok">
            {order.ticketsEmailed
              ? `Payment confirmed. Your tickets have been sent to ${order.buyer.email}. Check your spam folder if you don’t see them.`
              : "Payment confirmed. Your tickets are on their way to your email."}
          </Alert>
        </div>
      );
    case "expired":
      return (
        <div className="mt-6">
          <Alert tone="warn">
            This order expired before payment was confirmed, so the tickets were released. If you already paid,
            message us on WhatsApp with your reference and we&rsquo;ll sort it out.
          </Alert>
        </div>
      );
    case "cancelled":
      return (
        <div className="mt-6">
          <Alert tone="bad">This order was cancelled.</Alert>
        </div>
      );
    default:
      return null;
  }
}
