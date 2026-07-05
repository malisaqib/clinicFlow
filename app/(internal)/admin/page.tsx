"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/lib/auth/mock-auth";
import { dayName, formatFee, formatPricePKR } from "@/lib/format";

import {
  addDoctorAction,
  addKnowledgeAction,
  addServiceAction,
  getSetupAction,
  saveProfileAction,
  saveWorkingHoursAction,
  type AdminSetup,
} from "./actions";

const INPUT =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function AdminPage() {
  const { user } = useAuth();
  const slug = user?.clinicSlug ?? "";
  const [setup, setSetup] = useState<AdminSetup | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>("");

  const reload = useCallback(async () => {
    if (!slug) return;
    const res = await getSetupAction(slug);
    if (res.ok) {
      setSetup(res.data);
      setStatus("ready");
    } else {
      setError(res.error);
      setStatus("error");
    }
  }, [slug]);

  useEffect(() => {
    // Load clinic setup on mount / clinic switch; state updates happen after the awaited call.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  if (status === "loading") {
    return <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface-3/70" />;
  }

  if (status === "error" || !setup) {
    return (
      <div className="rounded-2xl border border-st-cancelled/30 bg-st-cancelled-bg/60 p-6">
        <h2 className="font-display text-lg text-st-cancelled">Couldn&apos;t load clinic setup</h2>
        <p className="mt-1.5 text-sm text-ink-soft">{error}</p>
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            reload();
          }}
          className="mt-4 rounded-full border border-st-cancelled/40 px-4 py-2 text-sm font-medium text-st-cancelled hover:bg-st-cancelled-bg"
        >
          Try again
        </button>
      </div>
    );
  }

  const openDays = setup.workingHours.filter((h) => !h.is_closed).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-strong">Clinic setup</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{setup.clinic.name}</h1>
          <p className="mt-1 text-sm text-muted">
            Everything the public page and AI receptionist draw from. Keep it accurate.
          </p>
        </div>
        <div className="flex gap-2 font-mono text-xs">
          <Stat n={setup.services.length} label="services" />
          <Stat n={setup.doctors.length} label="doctors" />
          <Stat n={openDays} label="open days" />
          <Stat n={setup.clinicKnowledge.length} label="kb entries" />
        </div>
      </header>

      <ProfileSection setup={setup} slug={slug} onSaved={reload} />
      <WorkingHoursSection setup={setup} slug={slug} onSaved={reload} />
      <ServicesSection setup={setup} slug={slug} onAdded={reload} />
      <DoctorsSection setup={setup} slug={slug} onAdded={reload} />
      <KnowledgeSection setup={setup} slug={slug} onAdded={reload} />
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span className="rounded-lg border border-line bg-surface-3 px-2.5 py-1.5 text-center">
      <span className="block font-display text-lg text-ink">{n}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </span>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface-3 p-5 shadow-[var(--shadow-calm)] sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Feedback({ result }: { result: { ok: boolean; error?: string } | null }) {
  if (!result) return null;
  return result.ok ? (
    <span className="font-mono text-xs text-st-confirmed">Saved ✓</span>
  ) : (
    <span className="font-mono text-xs text-st-cancelled">{result.error}</span>
  );
}

// ── Clinic profile ───────────────────────────────────────────────────────────
function ProfileSection({ setup, slug, onSaved }: { setup: AdminSetup; slug: string; onSaved: () => void }) {
  const c = setup.clinic;
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: String(f.get("name") ?? "").trim(),
      category: String(f.get("category") ?? "").trim(),
      city: String(f.get("city") ?? "").trim(),
      area: String(f.get("area") ?? ""),
      address: String(f.get("address") ?? ""),
      phone: String(f.get("phone") ?? ""),
      whatsapp: String(f.get("whatsapp") ?? ""),
      email: String(f.get("email") ?? ""),
      description: String(f.get("description") ?? ""),
    };
    setSaving(true);
    setResult(null);
    const res = await saveProfileAction(slug, body);
    setResult(res);
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <Section title="Clinic profile" hint="Name, category, and contact details shown to patients.">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Clinic name" required>
          <input name="name" defaultValue={c.name} required className={INPUT} />
        </Field>
        <Field label="Category" required>
          <input name="category" defaultValue={c.category} required className={INPUT} placeholder="aesthetic / dental" />
        </Field>
        <Field label="City" required>
          <input name="city" defaultValue={c.city} required className={INPUT} />
        </Field>
        <Field label="Area">
          <input name="area" defaultValue={c.area ?? ""} className={INPUT} />
        </Field>
        <Field label="Address" full>
          <input name="address" defaultValue={c.address ?? ""} className={INPUT} />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={c.phone ?? ""} className={INPUT} />
        </Field>
        <Field label="WhatsApp">
          <input name="whatsapp" defaultValue={c.whatsapp ?? ""} className={INPUT} />
        </Field>
        <Field label="Email" full>
          <input name="email" type="email" defaultValue={c.email ?? ""} className={INPUT} />
        </Field>
        <Field label="Description" full>
          <textarea name="description" defaultValue={c.description ?? ""} rows={2} className={INPUT} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-surface-3 hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          <Feedback result={result} />
        </div>
      </form>
    </Section>
  );
}

// ── Working hours ────────────────────────────────────────────────────────────
type HourRow = { isClosed: boolean; open: string; close: string };

function WorkingHoursSection({ setup, slug, onSaved }: { setup: AdminSetup; slug: string; onSaved: () => void }) {
  const initial: HourRow[] = Array.from({ length: 7 }, (_, dow) => {
    const h = setup.workingHours.find((w) => w.day_of_week === dow);
    return {
      isClosed: h ? Boolean(h.is_closed) : dow === 0,
      open: h?.open_time?.slice(0, 5) ?? "11:00",
      close: h?.close_time?.slice(0, 5) ?? "20:00",
    };
  });
  const [rows, setRows] = useState<HourRow[]>(initial);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function update(dow: number, patch: Partial<HourRow>) {
    setRows((prev) => prev.map((r, i) => (i === dow ? { ...r, ...patch } : r)));
  }

  async function save() {
    setSaving(true);
    setResult(null);
    const payload = rows.map((r, dow) => ({
      dayOfWeek: dow,
      isClosed: r.isClosed,
      openTime: r.isClosed ? null : r.open || null,
      closeTime: r.isClosed ? null : r.close || null,
    }));
    const res = await saveWorkingHoursAction(slug, payload);
    setResult(res);
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <Section title="Working hours" hint="Drives the availability ribbon on the public page.">
      <div className="space-y-1.5">
        {rows.map((r, dow) => (
          <div key={dow} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2">
            <span className="w-24 text-sm font-medium text-ink">{dayName(dow)}</span>
            <label className="flex items-center gap-1.5 text-sm text-muted">
              <input
                type="checkbox"
                checked={!r.isClosed}
                onChange={(e) => update(dow, { isClosed: !e.target.checked })}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              Open
            </label>
            <div className="flex items-center gap-2 font-mono">
              <input
                type="time"
                value={r.open}
                disabled={r.isClosed}
                onChange={(e) => update(dow, { open: e.target.value })}
                className="rounded-lg border border-line bg-surface-3 px-2 py-1 text-sm disabled:opacity-40"
              />
              <span className="text-muted">–</span>
              <input
                type="time"
                value={r.close}
                disabled={r.isClosed}
                onChange={(e) => update(dow, { close: e.target.value })}
                className="rounded-lg border border-line bg-surface-3 px-2 py-1 text-sm disabled:opacity-40"
              />
            </div>
            {r.isClosed && <span className="font-mono text-xs text-muted">Closed</span>}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-surface-3 hover:bg-brand-strong disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save hours"}
        </button>
        <Feedback result={result} />
      </div>
    </Section>
  );
}

// ── Services ─────────────────────────────────────────────────────────────────
function ServicesSection({ setup, slug, onAdded }: { setup: AdminSetup; slug: string; onAdded: () => void }) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const body: Record<string, unknown> = { name: String(f.get("name") ?? "").trim() };
    const desc = String(f.get("description") ?? "").trim();
    const cat = String(f.get("category") ?? "").trim();
    if (desc) body.description = desc;
    if (cat) body.category = cat;
    numberOrSkip(body, "priceMin", f.get("priceMin"));
    numberOrSkip(body, "priceMax", f.get("priceMax"));
    numberOrSkip(body, "durationMinutes", f.get("durationMinutes"));
    setSaving(true);
    setResult(null);
    const res = await addServiceAction(slug, body);
    setResult(res);
    setSaving(false);
    if (res.ok) {
      form.reset();
      onAdded();
    }
  }

  return (
    <Section title="Services" hint="What patients can book and the price ranges you show.">
      {setup.services.length > 0 && (
        <ul className="mb-5 divide-y divide-line rounded-xl border border-line">
          {setup.services.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <span className="text-sm font-medium text-ink">{s.name}</span>
                {!s.is_active && <span className="ml-2 font-mono text-[10px] uppercase text-muted">inactive</span>}
              </div>
              <span className="font-mono text-xs text-accent-strong">
                {formatPricePKR(s.price_min, s.price_max)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Service name" required>
          <input name="name" required className={INPUT} placeholder="e.g. HydraFacial" />
        </Field>
        <Field label="Category">
          <input name="category" className={INPUT} placeholder="facial / laser / cleaning" />
        </Field>
        <Field label="Description" full>
          <input name="description" className={INPUT} />
        </Field>
        <Field label="Price min (PKR)">
          <input name="priceMin" type="number" min="0" className={INPUT} />
        </Field>
        <Field label="Price max (PKR)">
          <input name="priceMax" type="number" min="0" className={INPUT} />
        </Field>
        <Field label="Duration (minutes)">
          <input name="durationMinutes" type="number" min="0" className={INPUT} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-surface-3 hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add service"}
          </button>
          <Feedback result={result} />
        </div>
      </form>
    </Section>
  );
}

// ── Doctors ──────────────────────────────────────────────────────────────────
function DoctorsSection({ setup, slug, onAdded }: { setup: AdminSetup; slug: string; onAdded: () => void }) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const body: Record<string, unknown> = { name: String(f.get("name") ?? "").trim() };
    const specialty = String(f.get("specialty") ?? "").trim();
    const bio = String(f.get("bio") ?? "").trim();
    if (specialty) body.specialty = specialty;
    if (bio) body.bio = bio;
    numberOrSkip(body, "consultationFee", f.get("consultationFee"));
    setSaving(true);
    setResult(null);
    const res = await addDoctorAction(slug, body);
    setResult(res);
    setSaving(false);
    if (res.ok) {
      form.reset();
      onAdded();
    }
  }

  return (
    <Section title="Doctors" hint="The team patients can request by name.">
      {setup.doctors.length > 0 && (
        <ul className="mb-5 divide-y divide-line rounded-xl border border-line">
          {setup.doctors.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <span className="text-sm font-medium text-ink">{d.name}</span>
                {d.specialty && <span className="ml-2 text-xs text-muted">{d.specialty}</span>}
              </div>
              {formatFee(d.consultation_fee) && (
                <span className="font-mono text-xs text-accent-strong">{formatFee(d.consultation_fee)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Doctor name" required>
          <input name="name" required className={INPUT} placeholder="e.g. Dr. Sara Khan" />
        </Field>
        <Field label="Specialty">
          <input name="specialty" className={INPUT} placeholder="Dermatologist" />
        </Field>
        <Field label="Bio" full>
          <input name="bio" className={INPUT} />
        </Field>
        <Field label="Consultation fee (PKR)">
          <input name="consultationFee" type="number" min="0" className={INPUT} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-surface-3 hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add doctor"}
          </button>
          <Feedback result={result} />
        </div>
      </form>
    </Section>
  );
}

// ── Knowledge base ───────────────────────────────────────────────────────────
function KnowledgeSection({ setup, slug, onAdded }: { setup: AdminSetup; slug: string; onAdded: () => void }) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const body: Record<string, unknown> = {
      title: String(f.get("title") ?? "").trim(),
      content: String(f.get("content") ?? "").trim(),
    };
    const cat = String(f.get("category") ?? "").trim();
    if (cat) body.category = cat;
    setSaving(true);
    setResult(null);
    const res = await addKnowledgeAction(slug, body);
    setResult(res);
    setSaving(false);
    if (res.ok) {
      form.reset();
      onAdded();
    }
  }

  return (
    <Section
      title="Knowledge base"
      hint="Facts the AI receptionist may share (timings, location, fees, policies). Never medical advice."
    >
      {setup.clinicKnowledge.length > 0 && (
        <ul className="mb-5 space-y-2">
          {setup.clinicKnowledge.map((k) => (
            <li key={k.id} className="rounded-xl border border-line bg-surface-2 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{k.title}</span>
                {k.category && (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand">
                    {k.category}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{k.content}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" required>
          <input name="title" required className={INPUT} placeholder="Parking & access" />
        </Field>
        <Field label="Category">
          <input name="category" className={INPUT} placeholder="timings / location / fees / policy" />
        </Field>
        <Field label="Content" full>
          <textarea name="content" required rows={3} className={INPUT} placeholder="Plain-language answer the receptionist can share." />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-surface-3 hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add entry"}
          </button>
          <Feedback result={result} />
        </div>
      </form>
    </Section>
  );
}

function Field({
  label,
  children,
  required,
  full,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-ink">
        {label} {required && <span className="text-accent-strong">*</span>}
      </span>
      {children}
    </label>
  );
}

function numberOrSkip(body: Record<string, unknown>, key: string, raw: FormDataEntryValue | null) {
  const str = String(raw ?? "").trim();
  if (str === "") return;
  const n = Number(str);
  if (Number.isFinite(n)) body[key] = Math.round(n);
}
