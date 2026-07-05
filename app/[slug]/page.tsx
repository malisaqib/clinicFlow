import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvailabilityRibbon } from "@/components/AvailabilityRibbon";
import { Wordmark } from "@/components/Brand";
import { getClinicBySlug, type ClinicBySlug } from "@/lib/clinics/queries";
import { SupabaseAdminConfigError } from "@/lib/supabase/admin";
import { formatDuration, formatFee, formatPricePKR } from "@/lib/format";

import { SetupNotice } from "@/components/SetupNotice";

import { AppointmentForm } from "./AppointmentForm";
import { ChatWidget } from "./ChatWidget";

type PageProps = { params: Promise<{ slug: string }> };

// Fetch once, tolerating a not-yet-configured Supabase so the page degrades gracefully
// instead of crashing during setup.
async function loadClinic(slug: string): Promise<
  | { ok: true; data: ClinicBySlug }
  | { ok: false; reason: "not-found" }
  | { ok: false; reason: "not-configured"; missing: string[] }
> {
  try {
    const data = await getClinicBySlug(slug.trim());
    if (!data) return { ok: false, reason: "not-found" };
    return { ok: true, data };
  } catch (error) {
    if (error instanceof SupabaseAdminConfigError) {
      return { ok: false, reason: "not-configured", missing: error.missingVariables };
    }
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadClinic(slug);
  if (result.ok) {
    return {
      title: result.data.clinic.name,
      description: result.data.clinic.description ?? `Book an appointment at ${result.data.clinic.name}.`,
    };
  }
  return { title: "Clinic" };
}

export default async function ClinicPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await loadClinic(slug);

  if (!result.ok && result.reason === "not-configured") {
    return <SetupNotice missing={result.missing} />;
  }
  if (!result.ok) {
    notFound();
  }

  const { clinic, services, doctors, workingHours, knowledge } = result.data;
  const contactDigits = (clinic.whatsapp ?? clinic.phone ?? "").replace(/[^\d]/g, "");
  const goodToKnow = knowledge.filter(
    (k) => !["safety", "timings", "location"].includes(k.category ?? ""),
  );

  return (
    <div className="relative min-h-dvh">
      {/* Header */}
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Wordmark />
          <Link
            href="/dashboard"
            className="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
          >
            Clinic staff →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/70">
        <div className="daylight paper pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-3/80 px-3 py-1 font-mono text-xs uppercase tracking-widest text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {clinic.category}
            {clinic.area ? ` · ${clinic.area}` : ""}
          </p>
          <h1 className="mt-4 max-w-2xl text-balance font-display text-4xl leading-[1.05] sm:text-5xl">
            {clinic.name}
          </h1>
          {clinic.description && (
            <p className="mt-4 max-w-xl text-lg text-ink-soft">{clinic.description}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="#book"
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-surface-3 shadow-[var(--shadow-calm)] transition-colors hover:bg-brand-strong"
            >
              Request appointment
            </a>
            {clinic.phone && (
              <a
                href={`tel:${clinic.phone.replace(/\s/g, "")}`}
                className="rounded-full border border-line bg-surface-3 px-5 py-2.5 font-mono text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
              >
                {clinic.phone}
              </a>
            )}
            {contactDigits && (
              <a
                href={`https://wa.me/${contactDigits}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line bg-surface-3 px-5 py-2.5 text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
              >
                WhatsApp
              </a>
            )}
          </div>

          {/* Signature availability ribbon */}
          <div className="mt-9 rounded-2xl border border-line bg-surface-3/70 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted">This week</h2>
              <span className="font-mono text-xs text-muted">Open hours</span>
            </div>
            <AvailabilityRibbon workingHours={workingHours} />
            {clinic.address && (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                <span aria-hidden="true">📍</span>
                {clinic.address}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Body: content + booking aside */}
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_360px] lg:items-start">
        <main className="space-y-12">
          {/* Services */}
          {services.length > 0 && (
            <section>
              <SectionHeading eyebrow="What we do" title="Services & pricing" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-line bg-surface-3 p-5 transition-colors hover:border-brand/25"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg text-brand-strong">{s.name}</h3>
                      {s.category && (
                        <span className="rounded-full bg-brand-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand">
                          {s.category}
                        </span>
                      )}
                    </div>
                    {s.description && <p className="mt-2 text-sm text-ink-soft">{s.description}</p>}
                    <div className="mt-3 flex items-center gap-3 font-mono text-xs">
                      <span className="text-accent-strong">{formatPricePKR(s.price_min, s.price_max)}</span>
                      {formatDuration(s.duration_minutes) && (
                        <span className="text-muted">· {formatDuration(s.duration_minutes)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Doctors */}
          {doctors.length > 0 && (
            <section>
              <SectionHeading eyebrow="Who you'll see" title="Our team" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {doctors.map((d) => (
                  <div key={d.id} className="flex gap-4 rounded-2xl border border-line bg-surface-3 p-5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-tint font-display text-lg text-brand">
                      {d.name.replace(/^Dr\.?\s*/i, "").slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-brand-strong">{d.name}</h3>
                      {d.specialty && <p className="text-sm text-ink-soft">{d.specialty}</p>}
                      {d.bio && <p className="mt-1.5 text-sm text-muted">{d.bio}</p>}
                      {formatFee(d.consultation_fee) && (
                        <p className="mt-2 font-mono text-xs text-accent-strong">
                          Consultation {formatFee(d.consultation_fee)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Good to know */}
          {goodToKnow.length > 0 && (
            <section>
              <SectionHeading eyebrow="Before you come in" title="Good to know" />
              <div className="mt-5 space-y-3">
                {goodToKnow.map((k) => (
                  <div key={k.id} className="rounded-2xl border border-line bg-surface-3 p-5">
                    <h3 className="font-display text-base text-brand-strong">{k.title}</h3>
                    <p className="mt-1.5 text-sm text-ink-soft">{k.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Booking aside */}
        <aside id="book" className="lg:sticky lg:top-6">
          <div className="rounded-2xl border border-line bg-surface-2 p-6 shadow-[var(--shadow-calm)]">
            <div className="mb-1 font-mono text-xs uppercase tracking-widest text-accent-strong">
              Request an appointment
            </div>
            <h2 className="font-display text-2xl">Pick a time that suits you</h2>
            <p className="mt-1.5 mb-5 text-sm text-ink-soft">
              We&apos;ll confirm by phone — this form sends a request, not a locked booking.
            </p>
            <AppointmentForm
              slug={clinic.slug}
              clinicName={clinic.name}
              services={services.map((s) => ({ id: s.id, name: s.name }))}
              doctors={doctors.map((d) => ({ id: d.id, name: d.name, specialty: d.specialty }))}
            />
          </div>
        </aside>
      </div>

      <footer className="border-t border-line/70">
        <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-muted">
          {clinic.name} · Powered by ClinicFlow. The AI receptionist shares clinic information only and
          hands medical questions to qualified staff.
        </div>
      </footer>

      <ChatWidget
        slug={clinic.slug}
        clinicName={clinic.name}
        phone={clinic.phone}
        whatsapp={clinic.whatsapp}
      />
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent-strong">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl sm:text-3xl">{title}</h2>
    </div>
  );
}
