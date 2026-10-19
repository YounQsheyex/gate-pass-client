"use client";

import { useAdminHref } from "./AdminBase";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, errorMessage, post } from "@/lib/api";
import { dateTime, naira } from "@/lib/format";
import type { AdminOrderDetail } from "@/lib/types";
import { Alert, Button, Field, Input, WhatsAppIcon, buttonClass } from "@/components/ui";
import { StatusBadge } from "./StatusBadge";
import { TicketPdfViewer } from "./TicketPdfViewer";

export function OrderDetail() {
  const href = useAdminHref();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const [busy, setBusy] = useState<"confirm" | "cancel" | "resend" | null>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [askCancel, setAskCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      const { order } = await api<{ order: AdminOrderDetail }>(`/api/admin/orders/${id}`);
      setOrder(order);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: "confirm" | "cancel" | "resend") {
    setBusy(action);
    setError(null);
    setNotice(null);
    try {
      if (action === "confirm") {
        const r = await post<{ emailed: boolean; emailError: string | null }>(`/api/admin/orders/${id}/confirm`, {
          note: note || undefined,
        });
        setNotice(
          r.emailed
            ? { tone: "ok", text: "Payment confirmed and tickets emailed." }
            : { tone: "warn", text: `Payment confirmed, but the email failed: ${r.emailError}. Use “Resend tickets”.` },
        );
      } else if (action === "cancel") {
        await post(`/api/admin/orders/${id}/cancel`, { reason: reason || undefined });
        setAskCancel(false);
        setNotice({ tone: "ok", text: "Order cancelled. Its tickets are back on sale." });
      } else {
        const r = await post<{ emailed: boolean; emailError: string | null }>(`/api/admin/orders/${id}/resend`);
        setNotice(
          r.emailed ? { tone: "ok", text: "Tickets emailed again." } : { tone: "warn", text: `Email failed: ${r.emailError}` },
        );
      }
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (!order) {
    return error ? <Alert>{error}</Alert> : <p className="text-muted">Loading…</p>;
  }

  const canConfirm = order.status === "pending" || order.status === "expired";
  const canCancel = order.status !== "cancelled";
  const usedTickets = order.tickets.filter((t) => t.status === "used").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={href()} className="text-sm font-semibold text-accent hover:underline">
          All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl font-extrabold">{order.reference}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-ink-soft">
          Placed {dateTime(order.createdAt)}
          {order.status === "pending" && <>, held until {dateTime(order.expiresAt)}</>}
        </p>
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="font-display text-xl font-bold">{order.eventTitle}</h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {order.items.map((i) => (
                <li key={i.name} className="flex justify-between py-3">
                  <span>
                    {i.quantity} × {i.name} <span className="text-muted">at {naira(i.unitPrice)}</span>
                  </span>
                  <span className="tabular-nums">{naira(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between py-3 text-lg font-bold">
                <span>Amount to receive</span>
                <span className="tabular-nums">{naira(order.total)}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Buyer</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium">{order.buyer.name}</dd>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium break-all">{order.buyer.email}</dd>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium">+{order.buyer.phone}</dd>
            </dl>
            <a
              href={order.whatsappChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("whatsapp", "mt-4 px-4 py-2 text-sm")}
            >
              <WhatsAppIcon className="h-4 w-4" /> Open chat with buyer
            </a>
          </section>

          {order.tickets.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold">
                Tickets <span className="font-sans text-base font-medium text-muted">({usedTickets} of {order.tickets.length} checked in)</span>
              </h2>
              <div className="mt-3">
                <TicketPdfViewer
                  orderId={order.id}
                  reference={order.reference}
                  version={`${order.status}:${order.tickets.map((t) => t.status).join(",")}`}
                />
              </div>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {order.tickets.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span>
                      <span className="font-semibold">#{t.shortId}</span> {t.ticketTypeName}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-muted">
                      {t.checkedInAt && dateTime(t.checkedInAt)}
                      <StatusBadge status={t.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="text-sm text-ink-soft">
            {order.paidAt && (
              <p>
                Confirmed {dateTime(order.paidAt)}
                {order.confirmedByName && <> by {order.confirmedByName}</>}
                {order.paymentNote && <>: “{order.paymentNote}”</>}
              </p>
            )}
            {order.ticketsEmailedAt && <p>Tickets emailed {dateTime(order.ticketsEmailedAt)}</p>}
            {order.emailError && <p className="font-semibold text-bad">Last email attempt failed: {order.emailError}</p>}
            {order.cancelledAt && (
              <p>
                Cancelled {dateTime(order.cancelledAt)}
                {order.cancelledByName && <> by {order.cancelledByName}</>}
                {order.cancelReason && <>: “{order.cancelReason}”</>}
              </p>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          {canConfirm && (
            <div className="flex flex-col gap-4 rounded-2xl bg-lilac p-5">
              <h2 className="font-display text-xl font-bold">Confirm payment</h2>
              <p className="text-sm text-ink-soft">
                Check your bank app for a transfer of <b className="text-ink">{naira(order.total)}</b>
                {" "}with narration <b className="text-ink">{order.reference}</b> or from {order.buyer.name}. Confirming
                emails the tickets straight away.
              </p>
              {order.status === "expired" && (
                <Alert tone="warn">
                  This order expired, so its tickets were released. Confirming will claim them again if any are left.
                </Alert>
              )}
              <Field label="Payment note (optional)" hint="e.g. sender name or bank reference">
                <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
              </Field>
              <Button onClick={() => run("confirm")} disabled={busy !== null}>
                {busy === "confirm" ? "Confirming…" : `Confirm ${naira(order.total)} received`}
              </Button>
            </div>
          )}

          {order.status === "paid" && (
            <Button variant="secondary" onClick={() => run("resend")} disabled={busy !== null}>
              {busy === "resend" ? "Sending…" : "Resend tickets"}
            </Button>
          )}

          {canCancel && !askCancel && (
            <Button variant="danger" onClick={() => setAskCancel(true)} disabled={busy !== null}>
              {order.status === "paid" ? "Cancel and refund" : "Cancel order"}
            </Button>
          )}

          {askCancel && (
            <div className="flex flex-col gap-3 rounded-2xl border border-bad/30 p-5">
              <p className="font-semibold">
                {order.status === "paid"
                  ? "This voids the buyer’s tickets so they won’t scan. Refund the money separately."
                  : "This releases the held tickets back on sale."}
              </p>
              <Field label="Reason (optional)">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
              </Field>
              <div className="flex gap-2">
                <Button variant="danger" onClick={() => run("cancel")} disabled={busy !== null}>
                  {busy === "cancel" ? "Cancelling…" : "Yes, cancel order"}
                </Button>
                <Button variant="ghost" onClick={() => setAskCancel(false)}>
                  Keep order
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
