"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import { dateTime, naira } from "@/lib/format";
import type { AdminOrder, OrderStatus } from "@/lib/types";
import { Alert, Input, Select } from "@/components/ui";
import { StatusBadge } from "./StatusBadge";

type ListResponse = { orders: AdminOrder[]; total: number; page: number; limit: number; pendingCount: number };

const FILTERS: { value: OrderStatus | ""; label: string }[] = [
  { value: "pending", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
  { value: "", label: "All orders" },
];

export function OrdersList() {
  const [status, setStatus] = useState<OrderStatus | "">("pending");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    try {
      setData(await api<ListResponse>(`/api/admin/orders?${params}`));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [status, query, page]);

  useEffect(() => {
    void load();
    const id = setInterval(() => document.visibilityState === "visible" && void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Orders</h1>
          {data && (
            <p className="mt-1 text-ink-soft">
              {data.pendingCount === 0
                ? "No payments waiting for confirmation."
                : `${data.pendingCount} order${data.pendingCount === 1 ? "" : "s"} waiting for payment confirmation.`}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          placeholder="Search by reference, name, email or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-md"
          aria-label="Search orders"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(1);
          }}
          className="sm:w-56"
          aria-label="Filter by status"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {error && <Alert>{error}</Alert>}

      {data && data.orders.length === 0 && (
        <p className="rounded-2xl bg-lilac p-6 text-ink-soft">
          {query ? `No orders match “${query}”.` : "No orders here yet."}
        </p>
      )}

      {data && data.orders.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-lilac text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Buyer</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.orders.map((o) => (
                <tr key={o.id} className="hover:bg-lilac/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-accent hover:underline">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.buyer.name}</div>
                    <div className="text-muted">+{o.buyer.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    {o.eventTitle}
                    <div className="text-muted">
                      {o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{naira(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                    {o.status === "paid" && o.emailError && (
                      <div className="mt-1 text-xs font-semibold text-bad">Email failed</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{dateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="font-semibold text-accent disabled:text-muted"
          >
            Newer
          </button>
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
            className="font-semibold text-accent disabled:text-muted"
          >
            Older
          </button>
        </div>
      )}
    </div>
  );
}
