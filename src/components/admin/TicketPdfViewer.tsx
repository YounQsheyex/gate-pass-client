"use client";

import { useEffect, useState } from "react";
import { PUBLIC_API_URL } from "@/lib/config";
import { Alert, Button, buttonClass } from "@/components/ui";

/**
 * Shows an order's tickets PDF inside the dashboard. The PDF is fetched with the admin
 * session and displayed from a local blob URL, so it works without the API having to
 * allow framing from the dashboard's domain.
 */
export function TicketPdfViewer({ orderId, reference, version }: { orderId: string; reference: string; version: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Drop the cached PDF when the order changes (e.g. a ticket was just checked in).
  useEffect(() => {
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }, [version]);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/admin/orders/${orderId}/tickets.pdf`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Couldn't load the tickets (${res.status})`);
      }
      const blob = await res.blob();
      setUrl(URL.createObjectURL(blob));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the tickets.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (open) return setOpen(false);
    setOpen(true);
    if (!url) await load();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={toggle} disabled={loading} className="px-4 py-2 text-sm">
          {open ? "Hide tickets" : loading ? "Loading tickets…" : "View tickets (PDF)"}
        </Button>
        {url && (
          <>
            <a href={url} target="_blank" rel="noopener" className={buttonClass("ghost", "px-4 py-2 text-sm")}>
              Open in new tab
            </a>
            <a href={url} download={`tickets-${reference}.pdf`} className={buttonClass("ghost", "px-4 py-2 text-sm")}>
              Download
            </a>
          </>
        )}
      </div>
      {error && <Alert>{error}</Alert>}
      {open && url && (
        <iframe
          src={`${url}#view=FitH`}
          title={`Tickets for order ${reference}`}
          className="h-[75vh] min-h-[520px] w-full rounded-2xl border border-line bg-lilac"
        />
      )}
      {open && url && (
        <p className="text-sm text-muted">
          Anyone with this PDF can use the tickets. Only share it with the buyer.
        </p>
      )}
    </div>
  );
}
