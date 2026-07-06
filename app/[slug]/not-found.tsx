import Link from "next/link";

import { Wordmark } from "@/components/Brand";

export default function ClinicNotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <div className="daylight paper pointer-events-none absolute inset-0 -z-10" />
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent-strong">404 · No clinic here</p>
        <h1 className="mt-3 font-display text-3xl">We couldn&apos;t find that clinic</h1>
        <p className="mt-3 text-ink-soft">
          The link may be mistyped or the clinic isn&apos;t active yet. Try one of the demo clinics.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/glowskin-demo"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-surface-3 hover:bg-brand-strong"
          >
            GlowSkin Aesthetic
          </Link>
          <Link
            href="/smilecare-demo"
            className="rounded-full border border-brand/30 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-tint"
          >
            SmileCare Dental
          </Link>
        </div>
      </div>
    </main>
  );
}
