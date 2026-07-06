"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/lib/auth/mock-auth";
import { statusMeta, formatDateHuman, formatRelative } from "@/lib/format";
import {
  APPOINTMENT_STATUSES,
  type AppointmentStatus,
  type DashboardAppointmentRequest,
} from "@/lib/types";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string; notConfigured?: boolean }
  | { kind: "ready"; requests: DashboardAppointmentRequest[] };

export default function DashboardPage() {
  const { user } = useAuth();
  const slug = user?.clinicSlug ?? "";
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/clinics/${slug}/appointment-requests`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message: string = body?.error ?? "Could not load appointment requests.";
        setState({ kind: "error", message, notConfigured: message.toLowerCase().includes("configuration") });
        return;
      }
      setState({ kind: "ready", requests: body.appointmentRequests ?? [] });
      setRefreshedAt(new Date());
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Check your connection." });
    }
  }, [slug]);

  useEffect(() => {
    // Fetch leads on mount / clinic switch; state updates happen after the awaited fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const requests = useMemo(() => (state.kind === "ready" ? state.requests : []), [state]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of requests) c[r.status ?? "new"] = (c[r.status ?? "new"] ?? 0) + 1;
    return c;
  }, [requests]);

  const visible = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => (r.status ?? "new") === filter)),
    [requests, filter],
  );

  function applyLocalUpdate(updated: DashboardAppointmentRequest) {
    setState((prev) =>
      prev.kind === "ready"
        ? { kind: "ready", requests: prev.requests.map((r) => (r.id === updated.id ? updated : r)) }
        : prev,
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-strong">Lead desk</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{user?.clinicName}</h1>
          <p className="mt-1 text-sm text-muted">
            {requests.length} appointment request{requests.length === 1 ? "" : "s"} · triage and update status
            as you follow up.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshedAt && (
            <span className="font-mono text-xs text-muted">
              Updated {refreshedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              load();
            }}
            className="rounded-lg border border-line bg-surface-3 px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Pipeline rail — the ribbon motif as a lead funnel. */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {APPOINTMENT_STATUSES.map((s) => {
          const meta = statusMeta(s);
          const active = filter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(active ? "all" : s)}
              aria-pressed={active}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active ? "border-brand/50 bg-brand-tint" : "border-line bg-surface-3 hover:border-brand/30"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                <span className="text-xs text-muted">{meta.label}</span>
              </div>
              <div className="mt-1 font-display text-2xl tabular text-ink">{counts[s] ?? 0}</div>
            </button>
          );
        })}
      </div>

      {/* Filter reset */}
      {filter !== "all" && (
        <button
          type="button"
          onClick={() => setFilter("all")}
          className="mt-4 font-mono text-xs text-brand underline-offset-2 hover:underline"
        >
          ← Show all requests
        </button>
      )}

      {/* Body */}
      <div className="mt-6">
        {state.kind === "loading" && <SkeletonList />}

        {state.kind === "error" && (
          <div className="rounded-2xl border border-st-cancelled/30 bg-st-cancelled-bg/60 p-6">
            <h2 className="font-display text-lg text-st-cancelled">
              {state.notConfigured ? "Supabase isn't connected yet" : "Couldn't load requests"}
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              {state.notConfigured
                ? "Fill the Supabase server variables in .env.local and restart the dev server to see live leads."
                : state.message}
            </p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-full border border-st-cancelled/40 px-4 py-2 text-sm font-medium text-st-cancelled hover:bg-st-cancelled-bg"
            >
              Try again
            </button>
          </div>
        )}

        {state.kind === "ready" && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line-strong bg-surface-3/60 p-10 text-center">
            <p className="font-display text-xl text-ink">No requests here yet</p>
            <p className="mt-1.5 text-sm text-muted">
              {filter === "all"
                ? "New appointment requests from the public page will appear here."
                : `No ${statusMeta(filter).label.toLowerCase()} requests right now.`}
            </p>
          </div>
        )}

        {state.kind === "ready" && visible.length > 0 && (
          <ul className="space-y-3">
            {visible.map((req) => (
              <LeadCard key={req.id} slug={slug} request={req} onUpdated={applyLocalUpdate} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LeadCard({
  slug,
  request,
  onUpdated,
}: {
  slug: string;
  request: DashboardAppointmentRequest;
  onUpdated: (r: DashboardAppointmentRequest) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(request.staff_notes ?? "");

  async function patch(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinics/${slug}/appointment-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Update failed.");
        return;
      }
      onUpdated(body.appointmentRequest);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const preferred = [formatDateHuman(request.preferred_date), request.preferred_time]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rounded-2xl border border-line bg-surface-3 p-4 shadow-[var(--shadow-calm)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-ink">{request.patient_name}</h3>
            <StatusPill status={request.status} />
            {request.source && (
              <span className="rounded-full bg-brand-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand">
                {request.source}
              </span>
            )}
          </div>
          <a
            href={`tel:${request.patient_phone.replace(/\s/g, "")}`}
            className="mt-1 inline-block font-mono text-sm text-brand hover:underline"
          >
            {request.patient_phone}
          </a>
        </div>
        <span className="font-mono text-xs text-muted">{formatRelative(request.created_at)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        {request.service?.name && (
          <Detail label="Service" value={request.service.name} />
        )}
        {request.doctor?.name && (
          <Detail
            label="Doctor"
            value={`${request.doctor.name}${request.doctor.specialty ? ` · ${request.doctor.specialty}` : ""}`}
          />
        )}
        {preferred && <Detail label="Preferred" value={preferred} />}
      </div>

      {request.concern_note && (
        <p className="mt-3 rounded-xl border-l-2 border-brand/30 bg-surface-2 px-3 py-2 text-sm text-ink-soft">
          “{request.concern_note}”
        </p>
      )}

      {/* Triage controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <label className="font-mono text-xs uppercase tracking-wider text-muted" htmlFor={`status-${request.id}`}>
          Status
        </label>
        <select
          id={`status-${request.id}`}
          value={(request.status as AppointmentStatus) ?? "new"}
          disabled={saving}
          onChange={(e) => patch({ status: e.target.value })}
          className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
        >
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusMeta(s).label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          className="rounded-lg border border-line px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
        >
          {request.staff_notes ? "Notes" : "Add note"}
          {request.staff_notes ? " ·" : ""}
        </button>

        {saving && <span className="font-mono text-xs text-muted">Saving…</span>}
        {error && <span className="font-mono text-xs text-st-cancelled">{error}</span>}
        <span className="ml-auto font-mono text-[11px] text-muted">{statusMeta(request.status).hint}</span>
      </div>

      {notesOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Internal note for the team (e.g. called, no answer — try evening)."
            className="w-full resize-y rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => patch({ staffNotes: notes }).then(() => setNotesOpen(false))}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-surface-3 hover:bg-brand-strong disabled:opacity-60"
            >
              Save note
            </button>
            <button
              type="button"
              onClick={() => {
                setNotes(request.staff_notes ?? "");
                setNotesOpen(false);
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </span>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-surface-3/70" />
      ))}
    </ul>
  );
}
