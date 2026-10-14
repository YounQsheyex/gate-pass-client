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
  invalid: { title: "Fake or damaged code", tone: "bad" },
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
  const [manual, setManual] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerType | null>(null);
  const busyRef = useRef(false);
  const lastRef = useRef<{ code: string; at: number } | null>(null);
  const eventIdRef = useRef("");

  useEffect(() => {
    api<{ events: AdminEvent[] }>("/api/admin/events")
      .then(({ events }) => {
        // On-sale events that haven't long finished, soonest first (tonight's event is the likely one).
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const upcoming = events
          .filter((e) => e.status === "published" && new Date(e.endsAt ?? e.startsAt).getTime() > cutoff)
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        setEvents(upcoming);
        let saved = "";
        try {
          saved = localStorage.getItem(EVENT_KEY) ?? "";
        } catch {}
        const pick = upcoming.find((e) => e.id === saved)?.id ?? upcoming[0]?.id ?? "";
        setEventId(pick);
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

  const check = useCallback(
    async (token: string) => {
      const now = Date.now();
      if (busyRef.current) return;
      if (lastRef.current && lastRef.current.code === token && now - lastRef.current.at < SAME_CODE_COOLDOWN_MS) return;
      lastRef.current = { code: token, at: now };
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

  function stopCamera() {
    scannerRef.current?.stop();
    setCamera("off");
  }

  useEffect(() => () => scannerRef.current?.destroy(), []);

  function submitManual(e: FormEvent) {
    e.preventDefault();
    if (manual.trim()) {
      lastRef.current = null;
      void check(manual.trim());
      setManual("");
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

      {events && events.length === 0 && <Alert tone="warn">No events are on sale, so there&rsquo;s nothing to scan for.</Alert>}
      {events && events.length > 0 && (
        <Field label="Scanning for">
          <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
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

      <ResultPanel shown={shown} />

      <form onSubmit={submitManual} className="flex flex-col gap-2">
        <Field label="Or paste a ticket code" hint="For when the camera can’t read a screen, e.g. a cracked phone.">
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="T1.…" />
            <Button type="submit" variant="secondary" disabled={!manual.trim()}>
              Check
            </Button>
          </div>
        </Field>
      </form>
    </div>
  );
}

function ResultPanel({ shown }: { shown: Shown | null }) {
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
            Ticket #{t.shortId}
            {t.orderReference && <>, order {t.orderReference}</>}
          </p>
          {result === "already_used" && t.checkedInAt && (
            <p className="mt-1 font-semibold">First scanned {dateTime(t.checkedInAt)}</p>
          )}
        </div>
      )}
      {result === "invalid" && <p className="mt-2 text-lg">This code wasn&rsquo;t issued by us. Don&rsquo;t admit.</p>}
      {result === "wrong_event" && <p className="mt-2 text-lg">This ticket is for a different event.</p>}
    </div>
  );
}
