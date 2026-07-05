import Link from "next/link";

import { Wordmark } from "@/components/Brand";

const DEMO_CLINICS = [
  {
    slug: "glowskin-demo",
    name: "GlowSkin Aesthetic Clinic",
    category: "Aesthetic & skin",
    city: "Islamabad · F-7",
    blurb: "HydraFacials, laser, dermatology consults.",
  },
  {
    slug: "smilecare-demo",
    name: "SmileCare Dental Clinic",
    category: "Dental",
    city: "Islamabad · Blue Area",
    blurb: "Scaling, whitening, braces, implants.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="daylight paper pointer-events-none absolute inset-0 -z-10" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link
          href="/dashboard"
          className="rounded-full border border-line bg-surface-3 px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
        >
          Staff sign in →
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-8 pt-10 sm:pt-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface-3/80 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> For clinics in Pakistan
        </p>
        <h1 className="max-w-3xl text-balance font-display text-4xl leading-[1.05] sm:text-6xl">
          Every question answered. Every lead captured. Calmly.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          ClinicFlow gives aesthetic, dental, and skin clinics a warm public booking page, a safe
          AI receptionist that never plays doctor, and one dashboard where staff triage every
          appointment request.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
          Open a live demo clinic
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_CLINICS.map((clinic) => (
            <Link
              key={clinic.slug}
              href={`/${clinic.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface-3 p-6 shadow-[var(--shadow-calm)] transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-accent-strong">
                    {clinic.category}
                  </div>
                  <h3 className="mt-1 font-display text-2xl">{clinic.name}</h3>
                </div>
                <span className="text-brand transition-transform group-hover:translate-x-1">→</span>
              </div>
              <p className="mt-3 text-sm text-ink-soft">{clinic.blurb}</p>
              <p className="mt-4 font-mono text-xs text-muted">{clinic.city}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand-tint/50 p-5 transition-colors hover:bg-brand-tint"
          >
            <div>
              <div className="font-display text-lg text-brand-strong">Clinic dashboard</div>
              <p className="text-sm text-ink-soft">Triage incoming appointment requests.</p>
            </div>
            <span className="text-brand">→</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-2xl border border-brand/20 bg-brand-tint/50 p-5 transition-colors hover:bg-brand-tint"
          >
            <div>
              <div className="font-display text-lg text-brand-strong">Admin onboarding</div>
              <p className="text-sm text-ink-soft">Set up a clinic&apos;s profile and knowledge.</p>
            </div>
            <span className="text-brand">→</span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>ClinicFlow · 7-day MVP demo</p>
          <p className="max-w-md text-xs">
            Not an AI doctor. The receptionist shares clinic info only and hands medical questions
            to qualified staff.
          </p>
        </div>
      </footer>
    </main>
  );
}
