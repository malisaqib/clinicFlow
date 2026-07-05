import type { ReceptionistContext, ReceptionistIntent } from "@/lib/ai/types";

export function detectReceptionistIntent(message: string, context: ReceptionistContext): ReceptionistIntent {
  const normalizedMessage = message.toLowerCase();

  if (/\b(timing|timings|hours|open|close|closed|schedule|when)\b/.test(normalizedMessage)) {
    return "timings";
  }

  if (/\b(location|located|address|where|map|directions|area)\b/.test(normalizedMessage)) {
    return "location";
  }

  if (/\b(appointment|book|booking|reserve|visit|consultation)\b/.test(normalizedMessage)) {
    return "appointment";
  }

  if (/\b(fee|fees|cost|price|prices|charges|charge|how much)\b/.test(normalizedMessage)) {
    return "fees";
  }

  if (/\b(doctor|doctors|dr\.?|dermatologist|dentist|specialist|physician)\b/.test(normalizedMessage)) {
    return "doctor";
  }

  const asksAboutService = /\b(service|services|offer|offers|available|hydrafacial|laser|scaling|whitening)\b/.test(
    normalizedMessage,
  );
  const mentionsKnownService = context.services.some((service) =>
    normalizedMessage.includes(service.name.toLowerCase()),
  );

  if (asksAboutService || mentionsKnownService) {
    return "services";
  }

  return "general";
}
