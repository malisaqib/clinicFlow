// Shared display formatting for clinic data — used by both the public site and dashboard
// so PKR amounts, times, and days read identically everywhere.

import type { AppointmentStatus } from "@/lib/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "—";
}

export function dayShort(dayOfWeek: number): string {
  return DAY_SHORT[dayOfWeek] ?? "—";
}

/** Accepts "HH:MM" or "HH:MM:SS" (Postgres time) and returns "11:00 AM". */
export function formatTime(value: string | null): string | null {
  if (!value) return null;
  const [hStr, mStr] = value.split(":");
  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function formatPricePKR(priceMin: number | null, priceMax: number | null): string {
  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;
  if (priceMin != null && priceMax != null) {
    return priceMin === priceMax ? fmt(priceMin) : `${fmt(priceMin)} – ${fmt(priceMax)}`;
  }
  if (priceMin != null) return `From ${fmt(priceMin)}`;
  if (priceMax != null) return `Up to ${fmt(priceMax)}`;
  return "Fee on request";
}

export function formatFee(fee: number | null): string | null {
  return fee != null ? `PKR ${fee.toLocaleString("en-PK")}` : null;
}

export function formatDuration(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatDateHuman(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatRelative(value: string | null): string {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateHuman(value) ?? "—";
}

type StatusMeta = {
  label: string;
  /** Short helper describing what this stage means for triage. */
  hint: string;
  /** Tailwind classes backed by status tokens in globals.css. */
  chip: string;
  dot: string;
};

export const STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  new: {
    label: "New",
    hint: "Just came in — needs a first response.",
    chip: "bg-st-new-bg text-st-new",
    dot: "bg-st-new",
  },
  contacted: {
    label: "Contacted",
    hint: "Reached out — waiting on the patient.",
    chip: "bg-st-contacted-bg text-st-contacted",
    dot: "bg-st-contacted",
  },
  confirmed: {
    label: "Confirmed",
    hint: "Appointment agreed with the patient.",
    chip: "bg-st-confirmed-bg text-st-confirmed",
    dot: "bg-st-confirmed",
  },
  completed: {
    label: "Completed",
    hint: "Patient was seen at the clinic.",
    chip: "bg-st-completed-bg text-st-completed",
    dot: "bg-st-completed",
  },
  cancelled: {
    label: "Cancelled",
    hint: "Called off by the patient or clinic.",
    chip: "bg-st-cancelled-bg text-st-cancelled",
    dot: "bg-st-cancelled",
  },
  lost: {
    label: "Lost",
    hint: "No response or booked elsewhere.",
    chip: "bg-st-lost-bg text-st-lost",
    dot: "bg-st-lost",
  },
};

export function statusMeta(status: string | null): StatusMeta {
  return STATUS_META[(status ?? "new") as AppointmentStatus] ?? STATUS_META.new;
}
