"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hrs: Math.floor((s % 86400) / 3600), min: Math.floor((s % 3600) / 60), sec: s % 60 };
}

/** Live countdown to doors opening. Renders nothing on the server so the numbers never flash wrong. */
export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <div className="h-[76px]" aria-hidden="true" />;
  if (now >= target) {
    return <p className="font-display text-2xl font-extrabold text-stub">Happening now</p>;
  }

  const p = parts(target - now);
  const units: [number, string][] = [
    [p.days, p.days === 1 ? "day" : "days"],
    [p.hrs, "hrs"],
    [p.min, "min"],
    [p.sec, "sec"],
  ];
  return (
    <div role="timer" aria-label={`Starts in ${p.days} days, ${p.hrs} hours and ${p.min} minutes`} className="flex gap-2 sm:gap-3">
      {units.map(([n, label]) => (
        <div key={label} className="flex min-w-[64px] flex-col items-center rounded-xl bg-white/10 px-2 py-2 ring-1 ring-white/15 backdrop-blur-sm sm:min-w-[76px]">
          <span className="font-display text-3xl font-extrabold tabular-nums leading-none sm:text-4xl" aria-hidden="true">
            {String(n).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs font-semibold text-white/70" aria-hidden="true">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
