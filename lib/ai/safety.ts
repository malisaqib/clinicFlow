import type { ReceptionistSafety } from "@/lib/ai/types";

const MEDICAL_ADVICE_PATTERNS = [
  /\bdiagnos(e|is|ing)\b/i,
  /\bprescrib(e|ed|ing|tion)\b/i,
  /\b(medicine|medication|tablet|antibiotic|painkiller)\b/i,
  /\b(dosage|dose)\b/i,
  /\bside effects?\b/i,
  /\bwhat treatment do i need\b/i,
  /\bwhich treatment\b/i,
  /\bwhat procedure should i\b/i,
  /\bwhich procedure should i\b/i,
  /\bshould i (take|use)\b/i,
  /\bcan i (take|use)\b/i,
  /\bis .+ dangerous\b/i,
  /\b(pain|swelling|bleeding|infection|infected|fever|pus|injury|symptoms?)\b/i,
];

export function evaluateMedicalSafety(message: string): ReceptionistSafety {
  return {
    medicalAdviceBlocked: MEDICAL_ADVICE_PATTERNS.some((pattern) => pattern.test(message)),
  };
}

export function medicalHandoffReply(): string {
  return [
    "Thanks for sharing.",
    "I can help with clinic information and appointment requests, but I cannot diagnose, prescribe medicine, suggest dosage, or decide treatment.",
    "Please book a consultation or share your concern with clinic staff so a qualified professional can guide you.",
    "If you want, share your name, phone, preferred date/time, and service of interest for an appointment request.",
  ].join(" ");
}
