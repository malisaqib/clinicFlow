// Frontend-facing type barrel. Re-exports the shapes the backend lib already defines
// so components import from one stable place.

export type {
  Clinic,
  ClinicService,
  ClinicDoctor,
  WorkingHour,
  ClinicKnowledge,
  ClinicBySlug,
} from "@/lib/clinics/queries";

export type { DashboardAppointmentRequest } from "@/lib/appointments/queries";
export { APPOINTMENT_STATUSES } from "@/lib/appointments/queries";

export type AppointmentStatus = "new" | "contacted" | "confirmed" | "completed" | "cancelled" | "lost";

export type ReceptionistIntent =
  | "timings"
  | "location"
  | "services"
  | "appointment"
  | "fees"
  | "doctor"
  | "medical_handoff"
  | "general";

export type ReceptionistApiResult = {
  sessionId: string;
  reply: string;
  intent: ReceptionistIntent;
  safety: { medicalAdviceBlocked: boolean };
};
