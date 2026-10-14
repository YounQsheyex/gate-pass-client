import { stubDate } from "@/lib/format";
import { EventImage } from "./EventImage";

const PALETTES = [
  ["#d81b72", "#6d4cf2", "#ffd54a"],
  ["#6d4cf2", "#1fa8a0", "#ffd54a"],
  ["#ff7a3d", "#d81b72", "#261d63"],
  ["#ffd54a", "#ff7a3d", "#6d4cf2"],
  ["#1fa8a0", "#6d4cf2", "#d81b72"],
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * An event's artwork: the uploaded cover if there is one, otherwise a generated
 * gig-poster (colours picked from the title, so each event keeps its own look).
 */
export function Poster({
  title,
  startsAt,
  src,
  className = "",
  showTitle = false,
  showDate = true,
}: {
  title: string;
  startsAt: string;
  src: string | null;
  className?: string;
  /** Print the event title on the generated poster (used for the big hero poster). */
  showTitle?: boolean;
  /** Print the big date on the generated poster (cards already show a date stub). */
  showDate?: boolean;
}) {
  const h = hash(title);
  const [a, b, c] = PALETTES[h % PALETTES.length]!;
  const d = stubDate(startsAt);
  return (
    <div className={`relative overflow-hidden bg-night [container-type:inline-size] ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 60% at ${20 + (h % 50)}% 25%, ${a}, transparent 70%),
            radial-gradient(60% 70% at ${80 - (h % 30)}% 80%, ${b}, transparent 70%),
            radial-gradient(40% 40% at 50% 55%, ${c}66, transparent 70%), var(--color-night)`,
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between p-[7%] text-white">
        {showTitle ? (
          <span className="font-display text-[11cqw] font-extrabold leading-[0.88] tracking-tight [text-shadow:0_2px_30px_rgb(0_0_0/0.35)] text-balance">
            {title}
          </span>
        ) : (
          <span />
        )}
        <span className={`flex items-end justify-between ${showDate ? "" : "hidden"}`}>
          <span className="font-display text-[26cqw] font-extrabold leading-[0.78] tracking-tighter text-white/90 [text-shadow:0_4px_40px_rgb(0_0_0/0.3)]">
            {d.day}
          </span>
          <span className="font-display text-[9cqw] font-extrabold uppercase leading-none text-white/90">{d.month}</span>
        </span>
      </div>
      <EventImage src={src} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}
