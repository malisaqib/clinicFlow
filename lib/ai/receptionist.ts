import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getClinicBySlug } from "@/lib/clinics/queries";
import { detectReceptionistIntent } from "@/lib/ai/intents";
import { evaluateMedicalSafety, medicalHandoffReply } from "@/lib/ai/safety";
import type { ReceptionistApiResult, ReceptionistContext, ReceptionistIntent, ReceptionistReply } from "@/lib/ai/types";

type SafeSupabaseError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
};

type ReceptionistRequestBody = Record<string, unknown>;

type ValidatedReceptionistRequest = {
  message: string;
  sessionId: string | null;
  patientPhone: string | null;
};

type ChatSession = {
  id: string;
  clinic_id: string;
};

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class ReceptionistValidationError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ReceptionistValidationError";
  }
}

export class ReceptionistNotFoundError extends Error {
  constructor(
    readonly resource: string,
    readonly identifier?: string,
  ) {
    super(`${resource} not found.`);
    this.name = "ReceptionistNotFoundError";
  }
}

export class ReceptionistQueryError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(
    readonly stage: string,
    error: SafeSupabaseError,
  ) {
    super(`Unable to ${stage}: ${error.message}`);
    this.name = "ReceptionistQueryError";
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export async function handleReceptionistMessage(slug: string, requestBody: unknown): Promise<ReceptionistApiResult> {
  const input = validateReceptionistRequestBody(requestBody);
  const clinicData = await getClinicBySlug(slug);

  if (!clinicData) {
    throw new ReceptionistNotFoundError("Clinic", slug.trim());
  }

  const session = input.sessionId
    ? await findExistingChatSession(input.sessionId, clinicData.clinic.id)
    : await createChatSession(clinicData.clinic.id, input.patientPhone);

  await insertChatMessage({
    sessionId: session.id,
    clinicId: clinicData.clinic.id,
    role: "user",
    message: input.message,
  });

  const receptionistReply = await generateReceptionistReply(input.message, clinicData);

  await insertChatMessage({
    sessionId: session.id,
    clinicId: clinicData.clinic.id,
    role: "assistant",
    message: receptionistReply.reply,
    intent: receptionistReply.intent,
  });

  return {
    sessionId: session.id,
    ...receptionistReply,
  };
}

async function generateReceptionistReply(message: string, context: ReceptionistContext): Promise<ReceptionistReply> {
  const safety = evaluateMedicalSafety(message);

  if (safety.medicalAdviceBlocked) {
    return {
      reply: medicalHandoffReply(),
      intent: "medical_handoff",
      safety,
    };
  }

  const intent = detectReceptionistIntent(message, context);
  const fallbackReply = buildRuleBasedReply(intent, context);
  const llmReply = await maybeGenerateLlmReply(message, context, intent);

  return {
    reply: llmReply ?? fallbackReply,
    intent,
    safety,
  };
}

function buildRuleBasedReply(intent: ReceptionistIntent, context: ReceptionistContext): string {
  switch (intent) {
    case "timings":
      return timingsReply(context);
    case "location":
      return locationReply(context);
    case "services":
      return servicesReply(context);
    case "appointment":
      return appointmentReply(context);
    case "fees":
      return feesReply(context);
    case "doctor":
      return doctorsReply(context);
    case "medical_handoff":
      return medicalHandoffReply();
    case "general":
    default:
      return generalReply(context);
  }
}

function timingsReply(context: ReceptionistContext): string {
  const knowledgeTiming = context.knowledge.find((row) => row.category === "timings")?.content;

  if (knowledgeTiming) {
    return knowledgeTiming;
  }

  const hours = context.workingHours.map((hour) => {
    const day = dayName(hour.day_of_week);

    if (hour.is_closed) {
      return `${day}: closed`;
    }

    return `${day}: ${hour.open_time ?? "opening time not listed"} to ${hour.close_time ?? "closing time not listed"}`;
  });

  return hours.length > 0
    ? `${context.clinic.name} timings: ${hours.join("; ")}.`
    : `I do not have timings listed for ${context.clinic.name} yet. Please contact the clinic staff to confirm.`;
}

function locationReply(context: ReceptionistContext): string {
  const location = [context.clinic.address, context.clinic.area, context.clinic.city].filter(Boolean).join(", ");

  if (location) {
    return `${context.clinic.name} is located at ${location}.`;
  }

  return `I do not have the full location for ${context.clinic.name} yet. Please contact the clinic staff for directions.`;
}

function servicesReply(context: ReceptionistContext): string {
  if (context.services.length === 0) {
    return `${context.clinic.name} has not listed active services yet. Clinic staff can confirm available services.`;
  }

  return `${context.clinic.name} offers: ${context.services.map((service) => service.name).join(", ")}.`;
}

function appointmentReply(context: ReceptionistContext): string {
  const appointmentKnowledge = context.knowledge.find((row) => row.category === "appointments")?.content;
  const baseReply =
    appointmentKnowledge ??
    "You can submit an appointment request with your name, phone number, preferred date/time, service, doctor, and concern note. Clinic staff will contact you to confirm manually.";

  return `${baseReply} Please share your name, phone, preferred date/time, and service of interest in the appointment form.`;
}

function feesReply(context: ReceptionistContext): string {
  const feeKnowledge = context.knowledge.find((row) => row.category === "fees")?.content;

  if (feeKnowledge) {
    return feeKnowledge;
  }

  const serviceFees = context.services
    .filter((service) => service.price_min !== null || service.price_max !== null)
    .map((service) => `${service.name}: ${formatPriceRange(service.price_min, service.price_max)}`);
  const doctorFees = context.doctors
    .filter((doctor) => doctor.consultation_fee !== null)
    .map((doctor) => `${doctor.name}: PKR ${doctor.consultation_fee}`);
  const fees = [...serviceFees, ...doctorFees];

  return fees.length > 0
    ? `Available fee information: ${fees.join("; ")}.`
    : "I do not have fee information listed yet. Clinic staff can confirm current fees.";
}

function doctorsReply(context: ReceptionistContext): string {
  if (context.doctors.length === 0) {
    return `${context.clinic.name} has not listed active doctors yet. Clinic staff can confirm availability.`;
  }

  const doctors = context.doctors.map((doctor) =>
    [doctor.name, doctor.specialty, doctor.consultation_fee ? `PKR ${doctor.consultation_fee}` : null]
      .filter(Boolean)
      .join(" - "),
  );

  return `Listed doctors: ${doctors.join("; ")}.`;
}

function generalReply(context: ReceptionistContext): string {
  return `I can help with ${context.clinic.name} services, timings, location, fees, doctors, and appointment request steps. For medical concerns, clinic staff or a qualified professional should guide you.`;
}

async function maybeGenerateLlmReply(
  message: string,
  context: ReceptionistContext,
  intent: ReceptionistIntent,
): Promise<string | null> {
  const llmApiKey = process.env.LLM_API_KEY?.trim();
  const llmModel = process.env.LLM_MODEL?.trim();

  if (!llmApiKey || !llmModel) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llmModel,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content: [
              "You are ClinicFlow AI receptionist.",
              "You are not a doctor.",
              "Never diagnose, prescribe medicine, suggest dosage, decide treatment, or tell a patient what procedure they need.",
              "Only use the provided clinic context.",
              "If unsure or if the user asks medical questions, hand off to clinic staff or a qualified clinician.",
              "Keep replies short and helpful.",
            ].join(" "),
          },
          {
            role: "user",
            content: `Clinic context:\n${formatClinicContext(context)}\n\nDetected intent: ${intent}\nPatient message: ${message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[ai-receptionist] LLM request failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const data = (await response.json()) as OpenAiChatCompletionResponse;
    const reply = data.choices?.[0]?.message?.content?.trim();

    return reply && reply.length > 0 ? reply : null;
  } catch (error) {
    console.error("[ai-receptionist] LLM request error", {
      message: error instanceof Error ? error.message : "Unknown error.",
    });
    return null;
  }
}

function formatClinicContext(context: ReceptionistContext): string {
  return [
    `Clinic: ${context.clinic.name}`,
    `Category: ${context.clinic.category}`,
    `City: ${context.clinic.city}`,
    `Area: ${context.clinic.area ?? "not listed"}`,
    `Address: ${context.clinic.address ?? "not listed"}`,
    `Phone: ${context.clinic.phone ?? "not listed"}`,
    `WhatsApp: ${context.clinic.whatsapp ?? "not listed"}`,
    `Description: ${context.clinic.description ?? "not listed"}`,
    `Services: ${context.services
      .map((service) => `${service.name} (${formatPriceRange(service.price_min, service.price_max)})`)
      .join(", ")}`,
    `Doctors: ${context.doctors
      .map((doctor) => `${doctor.name}${doctor.specialty ? `, ${doctor.specialty}` : ""}`)
      .join(", ")}`,
    `Working hours: ${context.workingHours
      .map((hour) =>
        hour.is_closed
          ? `${dayName(hour.day_of_week)} closed`
          : `${dayName(hour.day_of_week)} ${hour.open_time ?? "not listed"}-${hour.close_time ?? "not listed"}`,
      )
      .join("; ")}`,
    `Knowledge: ${context.knowledge.map((row) => `${row.title}: ${row.content}`).join(" | ")}`,
  ].join("\n");
}

async function findExistingChatSession(sessionId: string, clinicId: string): Promise<ChatSession> {
  const normalizedSessionId = validateUuid(sessionId, "sessionId");
  const supabase = createAdminSupabaseClient();

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .select("id, clinic_id")
    .eq("id", normalizedSessionId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) {
    throwQueryError("find chat session", error);
  }

  if (!session) {
    throw new ReceptionistNotFoundError("Chat session", normalizedSessionId);
  }

  return session;
}

async function createChatSession(clinicId: string, patientPhone: string | null): Promise<ChatSession> {
  const supabase = createAdminSupabaseClient();

  const { data: session, error } = await supabase
    .from("chat_sessions")
    .insert({
      clinic_id: clinicId,
      patient_phone: patientPhone,
    })
    .select("id, clinic_id")
    .single();

  if (error) {
    throwQueryError("create chat session", error);
  }

  return session;
}

async function insertChatMessage(input: {
  sessionId: string;
  clinicId: string;
  role: "user" | "assistant";
  message: string;
  intent?: ReceptionistIntent;
}): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("chat_messages").insert({
    session_id: input.sessionId,
    clinic_id: input.clinicId,
    role: input.role,
    message: input.message,
    intent: input.intent ?? null,
  });

  if (error) {
    throwQueryError("save chat message", error);
  }
}

function validateReceptionistRequestBody(requestBody: unknown): ValidatedReceptionistRequest {
  if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
    throw new ReceptionistValidationError("Request body must be a JSON object.");
  }

  const body = requestBody as ReceptionistRequestBody;

  return {
    message: requiredString(body, "message"),
    sessionId: optionalString(body, "sessionId"),
    patientPhone: optionalString(body, "patientPhone"),
  };
}

function requiredString(body: ReceptionistRequestBody, field: string): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ReceptionistValidationError(`${field} is required.`, field);
  }

  return value.trim();
}

function optionalString(body: ReceptionistRequestBody, field: string): string | null {
  const value = body[field];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ReceptionistValidationError(`${field} must be a string.`, field);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateUuid(value: string, field: string): string {
  const normalizedValue = value.trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedValue)) {
    throw new ReceptionistValidationError(`${field} must be a valid UUID.`, field);
  }

  return normalizedValue;
}

function dayName(dayOfWeek: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek] ?? "Unknown";
}

function formatPriceRange(priceMin: number | null, priceMax: number | null): string {
  if (priceMin !== null && priceMax !== null) {
    return priceMin === priceMax ? `PKR ${priceMin}` : `PKR ${priceMin}-${priceMax}`;
  }

  if (priceMin !== null) {
    return `from PKR ${priceMin}`;
  }

  if (priceMax !== null) {
    return `up to PKR ${priceMax}`;
  }

  return "fee not listed";
}

function throwQueryError(stage: string, error: SafeSupabaseError): never {
  console.error("[ai-receptionist] Supabase query failed", {
    stage,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  throw new ReceptionistQueryError(stage, error);
}
