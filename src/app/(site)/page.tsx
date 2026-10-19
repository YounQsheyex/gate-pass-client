import { Suspense } from "react";
import { api } from "@/lib/api";
import type { PublicEvent } from "@/lib/types";
import { Hero } from "@/components/home/Hero";
import { EventGrid } from "@/components/home/EventGrid";
import { HowItWorks } from "@/components/home/HowItWorks";

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HomeSkeleton />}>
        <Home />
      </Suspense>
      <HowItWorks />
    </>
  );
}

async function Home() {
  let events: PublicEvent[];
  try {
    ({ events } = await api<{ events: PublicEvent[] }>("/api/events"));
  } catch {
    return (
      <EmptyStage
        title="We can’t load events right now"
        body="Refresh the page in a moment."
      />
    );
  }

  if (events.length === 0) {
    return <EmptyStage title="The next show is being booked" body="No events are on sale yet. Check back soon." />;
  }

  // The event the organiser made main; otherwise the soonest one that still has tickets.
  const headliner = events.find((e) => e.isMain) ?? events.find((e) => !e.soldOut) ?? events[0]!;
  const rest = events.filter((e) => e.id !== headliner.id);

  return (
    <>
      <Hero event={headliner} />
      {rest.length > 0 && (
        <section id="events" className="scroll-mt-4 bg-lilac">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="mb-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">More coming up</h2>
            <EventGrid events={rest} />
          </div>
        </section>
      )}
    </>
  );
}

function EmptyStage({ title, body }: { title: string; body: string }) {
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      <div className="stage-lights -z-10" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <h1 className="max-w-3xl font-display text-[clamp(2.75rem,7vw,5.5rem)] font-extrabold leading-[0.9] tracking-tight">{title}</h1>
        <p className="mt-5 text-xl text-white/80">{body}</p>
      </div>
    </section>
  );
}

function HomeSkeleton() {
  return (
    <section className="bg-night" aria-busy="true" aria-label="Loading events">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-16 w-72 animate-pulse rounded-2xl bg-white/10" />
        </div>
        <div className="aspect-[4/5] animate-pulse rounded-[28px] bg-white/10" />
      </div>
    </section>
  );
}
