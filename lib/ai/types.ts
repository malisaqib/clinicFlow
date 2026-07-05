import type { ClinicBySlug } from "@/lib/clinics/queries";

export type ReceptionistIntent =
  | "timings"
  | "location"
  | "services"
  | "appointment"
  | "fees"
  | "doctor"
  | "medical_handoff"
  | "general";

export type ReceptionistSafety = {
  medicalAdviceBlocked: boolean;
};

export type ReceptionistContext = ClinicBySlug;

export type ReceptionistReply = {
  reply: string;
  intent: ReceptionistIntent;
  safety: ReceptionistSafety;
};

export type ReceptionistApiResult = ReceptionistReply & {
  sessionId: string;
};
