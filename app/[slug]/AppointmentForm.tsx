"use client";

import { useId, useRef, useState } from "react";

type Option = { id: string; name: string; specialty?: string | null };

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; field?: string }
  | { kind: "success"; requestId: string };

const TIME_WINDOWS = [
  "Morning (11:00 – 14:00)",
  "Afternoon (14:00 – 17:00)",
  "Evening (17:00 – 20:00)",
  "Any time",
];

export function AppointmentForm({
  slug,
  clinicName,
  services,
  doctors,
}: {
  slug: string;
  clinicName: string;
  services: Option[];
  doctors: Option[];
}) {
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const uid = useId();
  const successRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const patientName = String(data.get("patientName") ?? "").trim();
    const patientPhone = String(data.get("patientPhone") ?? "").trim();

    if (!patientName) {
      setState({ kind: "error", message: "Please enter your name.", field: "patientName" });
      return;
    }
    // Light client validation — Pakistani numbers, forgiving of spaces/+92/03xx.
    const digits = patientPhone.replace(/[^\d]/g, "");
    if (digits.length < 10) {
      setState({ kind: "error", message: "Please enter a valid phone number.", field: "patientPhone" });
      return;
    }

    const payload: Record<string, string> = { patientName, patientPhone };
    const serviceId = String(data.get("serviceId") ?? "");
    const doctorId = String(data.get("doctorId") ?? "");
    const preferredDate = String(data.get("preferredDate") ?? "");
    const preferredTime = String(data.get("preferredTime") ?? "");
    const concernNote = String(data.get("concernNote") ?? "").trim();
    if (serviceId) payload.serviceId = serviceId;
    if (doctorId) payload.doctorId = doctorId;
    if (preferredDate) payload.preferredDate = preferredDate;
    if (preferredTime) payload.preferredTime = preferredTime;
    if (concernNote) payload.concernNote = concernNote;

    setState({ kind: "submitting" });
    try {
      const res = await fetch(`/api/clinics/${slug}/appointment-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          kind: "error",
          message: body?.error ?? "Something went wrong. Please try again or call the clinic.",
          field: body?.field,
        });
        return;
      }
      form.reset();
      setState({ kind: "success", requestId: body?.appointmentRequest?.id ?? "" });
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setState({
        kind: "error",
        message: "Could not reach the clinic. Check your connection and try again.",
      });
    }
  }

  if (state.kind === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="rounded-2xl border border-st-confirmed/30 bg-st-confirmed-bg/70 p-6 focus-visible:outline-none"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-st-confirmed">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-st-confirmed/15 text-lg">✓</span>
          <span className="font-mono text-xs uppercase tracking-widest">Request received</span>
        </div>
        <h3 className="mt-4 font-display text-xl text-brand-strong">Thanks — we&apos;ve got your request</h3>
        <p className="mt-2 text-sm text-ink-soft">
          This is a <strong className="font-semibold text-ink">request, not a confirmed booking</strong>. The
          team at {clinicName} will call or WhatsApp you shortly to confirm a time.
        </p>
        {state.requestId && (
          <p className="mt-3 font-mono text-xs text-muted">
            Ref: {state.requestId.slice(0, 8).toUpperCase()}
          </p>
        )}
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="mt-5 rounded-full border border-brand/30 px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-tint"
        >
          Submit another request
        </button>
      </div>
    );
  }

  const submitting = state.kind === "submitting";
  const errorField = state.kind === "error" ? state.field : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={`${uid}-name`} className="text-sm font-medium text-ink">
          Your name <span className="text-accent-strong">*</span>
        </label>
        <input
          id={`${uid}-name`}
          name="patientName"
          required
          autoComplete="name"
          aria-invalid={errorField === "patientName"}
          className="w-full rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          placeholder="e.g. Ayesha Khan"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-phone`} className="text-sm font-medium text-ink">
          Phone / WhatsApp <span className="text-accent-strong">*</span>
        </label>
        <input
          id={`${uid}-phone`}
          name="patientPhone"
          required
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={errorField === "patientPhone"}
          className="w-full rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 font-mono text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          placeholder="03xx xxxxxxx"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-service`} className="text-sm font-medium text-ink">
            Service <span className="text-muted">(optional)</span>
          </label>
          <select
            id={`${uid}-service`}
            name="serviceId"
            defaultValue=""
            className="w-full rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          >
            <option value="">Not sure yet</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${uid}-doctor`} className="text-sm font-medium text-ink">
            Doctor <span className="text-muted">(optional)</span>
          </label>
          <select
            id={`${uid}-doctor`}
            name="doctorId"
            defaultValue=""
            className="w-full rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          >
            <option value="">No preference</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.specialty ? ` — ${d.specialty}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-date`} className="text-sm font-medium text-ink">
            Preferred date <span className="text-muted">(optional)</span>
          </label>
          <input
            id={`${uid}-date`}
            name="preferredDate"
            type="date"
            min={today}
            className="w-full rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-time`} className="text-sm font-medium text-ink">
            Preferred time <span className="text-muted">(optional)</span>
          </label>
          <select
            id={`${uid}-time`}
            name="preferredTime"
            defaultValue=""
            className="w-full rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          >
            <option value="">Any time</option>
            {TIME_WINDOWS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-note`} className="text-sm font-medium text-ink">
          Anything we should know? <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id={`${uid}-note`}
          name="concernNote"
          rows={3}
          className="w-full resize-y rounded-xl border border-line bg-surface-3 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
          placeholder="A short note about what you'd like to come in for."
        />
        <p className="text-xs text-muted">
          No need to describe symptoms in detail — staff will ask what they need when they call.
        </p>
      </div>

      {state.kind === "error" && (
        <p role="alert" className="rounded-xl bg-st-cancelled-bg px-3.5 py-2.5 text-sm text-st-cancelled">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-surface-3 shadow-[var(--shadow-calm)] transition-all hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Sending request…" : "Request appointment"}
      </button>
      <p className="text-center text-xs text-muted">
        Submitting sends a request only. {clinicName} confirms every appointment by phone.
      </p>
    </form>
  );
}
