"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type QrScannerType from "qr-scanner";
import { api, errorMessage, post } from "@/lib/api";
import { dateTime } from "@/lib/format";
import type { AdminEvent, CheckinResult } from "@/lib/types";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

const EVENT_KEY = "scanner:event";
/** Ignore the same code for this long so a QR held in front of the camera isn't sent repeatedly. */
const SAME_CODE_COOLDOWN_MS = 4000;

const RESULT_COPY: Record<CheckinResult["result"], { title: string; tone: "ok" | "bad" | "warn" }> = {
  admitted: { title: "Let them in", tone: "ok" },
  already_used: { title: "Already used", tone: "bad" },
  void: { title: "Ticket cancelled", tone: "bad" },
  unpaid: { title: "Not paid", tone: "bad" },
  wrong_event: { title: "Wrong event", tone: "warn" },
  invalid: { title: "Not a valid ticket", tone: "bad" },
};

const TONE_BG = { ok: "bg-ok", bad: "bg-bad", warn: "bg-warn" } as const;

type Shown = { result: CheckinResult; at: number } | { error: string; at: number };

export function Scanner() {
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [eventId, setEventId] = useState("");
  const [stats, setStats] = useState<{ issued: number; checkedIn: number } | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "error">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [entryCode, setEntryCode] = useState("");
  const [reference, setReference] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const busyRef = useRef(false);
  const lastRef = useRef<{ code: string; at: number } | null>(null);
  const eventIdRef = useRef("");

  useEffect(() => {
    api<{ events: AdminEvent[] }>("/api/admin/events")
      .then(({ events }) => {
        const ordered = orderForGate(events);
        setEvents(ordered);
        let saved = "";
        try {
          saved = localStorage.getItem(EVENT_KEY) ?? "";
        } catch {}
        // Tonight's (or the next) event is the likely one; a remembered choice wins if it's still current.
        const savedEvent = ordered.find((e) => e.id === saved);
        const pick = savedEvent && !isOver(savedEvent) ? savedEvent : ordered[0];
        setEventId(pick?.id ?? "");
      })
      .catch((err) => setShown({ error: errorMessage(err), at: Date.now() }));
  }, []);

  const refreshStats = useCallback(async (id: string) => {
    if (!id) return setStats(null);
    try {
      setStats(await api<{ issued: number; checkedIn: number }>(`/api/admin/checkin/stats/${id}`));
    } catch {}
  }, []);

  useEffect(() => {
    eventIdRef.current = eventId;
    try {
      if (eventId) localStorage.setItem(EVENT_KEY, eventId);
    } catch {}
    void refreshStats(eventId);
  }, [eventId, refreshStats]);

  /** What was last checked, so "Switch event" can re-check it against the right event. */
  const lastCheckRef = useRef<{ kind: "scan"; token: string } | { kind: "manual"; entryCode: string; reference: string } | null>(null);

  const check = useCallback(
    async (token: string) => {
      const now = Date.now();
      if (busyRef.current) return;
      if (lastRef.current && lastRef.current.code === token && now - lastRef.current.at < SAME_CODE_COOLDOWN_MS) return;
      lastRef.current = { code: token, at: now };
      lastCheckRef.current = { kind: "scan", token };
      busyRef.current = true;
      try {
        const result = await post<CheckinResult>("/api/admin/checkin", {
          token,
          eventId: eventIdRef.current || undefined,
        });
        setShown({ result, at: Date.now() });
        navigator.vibrate?.(result.result === "admitted" ? 80 : [60, 60, 60]);
        if (result.result === "admitted") void refreshStats(eventIdRef.current);
      } catch (err) {
        setShown({ error: errorMessage(err), at: Date.now() });
      } finally {
        busyRef.current = false;
      }
    },
    [refreshStats],
  );

  async function startCamera() {
    if (!videoRef.current) return;
    setCamera("starting");
    setCameraError(null);
    try {
      const { default: QrScanner } = await import("qr-scanner");
      scannerRef.current?.destroy();
      const scanner = new QrScanner(videoRef.current, (res) => void check(res.data), {
        preferredCamera: "environment",
        highlightScanRegion: true,
        maxScansPerSecond: 5,
        returnDetailedScanResult: true,
      });
      scannerRef.current = scanner;
      await scanner.start();
      setCamera("on");
    } catch (err) {
      setCamera("error");
      setCameraError(
        String(err).includes("NotAllowed") || String(err).includes("Permission")
          ? "Camera access was blocked. Allow camera access for this site in your browser settings, then try again."
          : "Couldn’t start the camera. The scanner needs HTTPS (or localhost) and a device with a camera.",
      );
    }
  }

  /** The ticket belongs to another event: switch the gate to it and check the same ticket again. */
  async function switchAndRecheck(id: string) {
    setEventId(id);
    eventIdRef.current = id;
    const last = lastCheckRef.current;
    if (!last) return;
    try {
      const result =
        last.kind === "scan"
          ? await post<CheckinResult>("/api/admin/checkin", { token: last.token, eventId: id })
          : await post<CheckinResult>("/api/admin/checkin/manual", { entryCode: last.entryCode, reference: last.reference, eventId: id });
      setShown({ result, at: Date.now() });
      navigator.vibrate?.(result.result === "admitted" ? 80 : [60, 60, 60]);
      if (result.result === "admitted") {
        if (last.kind === "manual") {
          setEntryCode("");
          setReference("");
        }
        void refreshStats(id);
      }
    } catch (err) {
      setShown({ error: errorMessage(err), at: Date.now() });
    }
  }

  function stopCamera() {
    scannerRef.current?.stop();
    setCamera("off");
  }

  useEffect(() => () => scannerRef.current?.destroy(), []);

  async function submitManual(e: FormEvent) {
    e.preventDefault();
    if (!entryCode.trim() || !reference.trim() || manualBusy) return;
    setManualBusy(true);
    lastCheckRef.current = { kind: "manual", entryCode, reference };
    try {
      const result = await post<CheckinResult>("/api/admin/checkin/manual", {
        entryCode,
        reference,
        eventId: eventIdRef.current || undefined,
      });
      setShown({ result, at: Date.now() });
      navigator.vibrate?.(result.result === "admitted" ? 80 : [60, 60, 60]);
      if (result.result === "admitted") {
        setEntryCode("");
        setReference("");
        void refreshStats(eventIdRef.current);
      }
    } catch (err) {
      setShown({ error: errorMessage(err), at: Date.now() });
    } finally {
      setManualBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-extrabold">Scan tickets</h1>
        {stats && (
          <p className="text-lg font-semibold tabular-nums">
            {stats.checkedIn} <span className="font-medium text-muted">of {stats.issued} in</span>
          </p>
        )}
      </div>

      {events && events.length === 0 && <Alert tone="warn">There are no events yet, so there&rsquo;s nothing to scan for.</Alert>}
      {events && events.length > 0 && (
        <Field label="Scanning for">
          <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {dateTime(e.startsAt)}
                {e.status === "draft" ? " (draft)" : e.status === "cancelled" ? " (cancelled)" : isOver(e) ? " (ended)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-ink">
        <video ref={videoRef} className={`aspect-square w-full object-cover ${camera === "on" ? "" : "invisible"}`} muted playsInline />
        {camera !== "on" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
            <p className="max-w-xs text-white/80">
              {camera === "error" ? cameraError : "Point the camera at the QR code on the guest’s ticket."}
            </p>
            <Button onClick={startCamera} disabled={camera === "starting" || !eventId}>
              {camera === "starting" ? "Starting camera…" : "Start camera"}
            </Button>
          </div>
        )}
      </div>
      {camera === "on" && (
        <Button variant="ghost" onClick={stopCamera} className="self-center">
          Stop camera
        </Button>
      )}

      <ResultPanel shown={shown} onSwitch={switchAndRecheck} />

      <form onSubmit={submitManual} className="flex flex-col gap-3 rounded-2xl border border-line p-4">
        <div>
          <p className="font-semibold">No camera? Type the ticket in</p>
          <p className="text-sm text-muted">Both are printed on the ticket: the entry code under the QR code, and the order reference.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Entry code">
            <Input
              value={entryCode}
              onChange={(e) => setEntryCode(e.target.value)}
              placeholder="XXXX-XXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
            />
          </Field>
          <Field label="Order reference">
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TK-XXXXX-XXXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
            />
          </Field>
        </div>
        <Button type="submit" variant="secondary" disabled={!entryCode.trim() || !reference.trim() || manualBusy || !eventId}>
          {manualBusy ? "Checking…" : "Check ticket"}
        </Button>
      </form>
    </div>
  );
}

/** Ended this long ago counts as over (late finishes and after-parties still count as tonight). */
const OVER_AFTER_MS = 12 * 60 * 60 * 1000;

function isOver(e: AdminEvent) {
  const end = new Date(e.endsAt ?? e.startsAt).getTime();
  return end + OVER_AFTER_MS < Date.now();
}

/** Current and upcoming events first (soonest first), then past ones (most recent first). */
function orderForGate(events: AdminEvent[]) {
  const time = (e: AdminEvent) => new Date(e.startsAt).getTime();
  const live = events.filter((e) => !isOver(e) && e.status !== "cancelled").sort((a, b) => time(a) - time(b));
  const rest = events.filter((e) => isOver(e) || e.status === "cancelled").sort((a, b) => time(b) - time(a));
  return [...live, ...rest];
}

function ResultPanel({ shown, onSwitch }: { shown: Shown | null; onSwitch: (eventId: string) => void }) {
  if (!shown) return null;
  if ("error" in shown) return <Alert>{shown.error}</Alert>;

  const { result } = shown.result;
  const copy = RESULT_COPY[result];
  const t = shown.result.ticket;
  return (
    <div key={shown.at} role="status" aria-live="assertive" className={`rounded-2xl p-5 text-white ${TONE_BG[copy.tone]}`}>
      <p className="font-display text-4xl font-extrabold">{copy.title}</p>
      {t && (
        <div className="mt-2 text-lg">
          <p className="font-semibold">
            {t.holderName}, {t.ticketTypeName}
          </p>
          <p className="text-white/85">
            {t.orderReference && (
              <>
                Order <span className="whitespace-nowrap">{t.orderReference}</span>
              </>
            )}
          </p>
          {result === "already_used" && t.checkedInAt && (
            <p className="mt-1 font-semibold">First scanned {dateTime(t.checkedInAt)}</p>
          )}
        </div>
      )}
      {result === "invalid" && (
        <p className="mt-2 text-lg">
          No ticket matches. If you typed it in, check both the entry code and the order reference. Otherwise don&rsquo;t admit.
        </p>
      )}
      {result === "wrong_event" && (
        <div className="mt-2 text-lg">
          <p>
            This ticket is for <b>{shown.result.ticketEvent?.title ?? "a different event"}</b>, not the one selected above.
          </p>
          {shown.result.ticketEvent && (
            <button
              type="button"
              onClick={() => onSwitch(shown.result.ticketEvent!.id)}
              className="mt-3 rounded-full bg-white px-4 py-2 text-base font-semibold text-ink"
            >
              Switch to {shown.result.ticketEvent.title} and check again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
