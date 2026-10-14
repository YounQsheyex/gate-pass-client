import { WhatsAppIcon } from "../ui";

const STEPS = [
  { title: "Pick your tickets", body: "Choose an event and how many tickets you need. We hold them for you while you pay." },
  { title: "Pay on WhatsApp", body: "Tap through to WhatsApp with your order ready. We send our account details; you transfer." },
  { title: "Get your QR ticket", body: "Once we confirm your payment, your tickets land in your email as a QR code and a PDF." },
];

/** The buying process, in order. Builds trust for first-timers paying by transfer. */
export function HowItWorks() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">How it works</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl bg-lilac p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-lg font-extrabold text-stub">
                {i === 1 ? <WhatsAppIcon className="h-5 w-5 text-white" /> : i + 1}
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold">{s.title}</h3>
              <p className="mt-2 text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
