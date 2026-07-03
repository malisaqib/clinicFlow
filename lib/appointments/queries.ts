import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SafeSupabaseError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
};

type AppointmentRequestBody = Record<string, unknown>;

type ValidatedAppointmentRequestInput = {
  patientName: string;
  patientPhone: string;
  serviceId: string | null;
  doctorId: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  concernNote: string | null;
};

export type CreatedAppointmentRequest = {
  id: string;
  status: string;
};

export class AppointmentRequestValidationError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "AppointmentRequestValidationError";
  }
}

export class AppointmentRequestNotFoundError extends Error {
  constructor(readonly slug: string) {
    super("Clinic not found.");
    this.name = "AppointmentRequestNotFoundError";
  }
}

export class AppointmentRequestQueryError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(
    readonly stage: string,
    error: SafeSupabaseError,
  ) {
    super(`Unable to ${stage}: ${error.message}`);
    this.name = "AppointmentRequestQueryError";
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export async function createAppointmentRequestForClinicSlug(
  slug: string,
  requestBody: unknown,
): Promise<CreatedAppointmentRequest> {
  const input = validateAppointmentRequestBody(requestBody);
  const supabase = createAdminSupabaseClient();
  const normalizedSlug = slug.trim();

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("id, slug")
    .eq("slug", normalizedSlug)
    .eq("status", "active")
    .maybeSingle();

  if (clinicError) {
    throwQueryError("find clinic", clinicError);
  }

  if (!clinic) {
    throw new AppointmentRequestNotFoundError(normalizedSlug);
  }

  if (input.serviceId) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("id", input.serviceId)
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .maybeSingle();

    if (serviceError) {
      throwQueryError("validate service", serviceError);
    }

    if (!service) {
      throw new AppointmentRequestValidationError(
        "serviceId must refer to an active service for this clinic.",
        "serviceId",
      );
    }
  }

  if (input.doctorId) {
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id")
      .eq("id", input.doctorId)
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .maybeSingle();

    if (doctorError) {
      throwQueryError("validate doctor", doctorError);
    }

    if (!doctor) {
      throw new AppointmentRequestValidationError(
        "doctorId must refer to an active doctor for this clinic.",
        "doctorId",
      );
    }
  }

  // Medical concerns are stored only as notes for staff review. This API does not diagnose, prescribe, or confirm care.
  const { data: appointmentRequest, error: insertError } = await supabase
    .from("appointment_requests")
    .insert({
      clinic_id: clinic.id,
      service_id: input.serviceId,
      doctor_id: input.doctorId,
      patient_name: input.patientName,
      patient_phone: input.patientPhone,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime,
      concern_note: input.concernNote,
      source: "web",
      status: "new",
    })
    .select("id, status")
    .single();

  if (insertError) {
    throwQueryError("create appointment request", insertError);
  }

  if (!appointmentRequest) {
    throw new AppointmentRequestQueryError("create appointment request", {
      message: "Supabase did not return the created appointment request.",
    });
  }

  return {
    id: appointmentRequest.id,
    status: appointmentRequest.status,
  };
}

function validateAppointmentRequestBody(requestBody: unknown): ValidatedAppointmentRequestInput {
  if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
    throw new AppointmentRequestValidationError("Request body must be a JSON object.");
  }

  const body = requestBody as AppointmentRequestBody;
  const serviceId = optionalString(body, "serviceId");
  const doctorId = optionalString(body, "doctorId");
  const preferredDate = optionalString(body, "preferredDate");

  if (serviceId && !isUuid(serviceId)) {
    throw new AppointmentRequestValidationError("serviceId must be a valid UUID.", "serviceId");
  }

  if (doctorId && !isUuid(doctorId)) {
    throw new AppointmentRequestValidationError("doctorId must be a valid UUID.", "doctorId");
  }

  if (preferredDate && !isIsoDate(preferredDate)) {
    throw new AppointmentRequestValidationError("preferredDate must use YYYY-MM-DD format.", "preferredDate");
  }

  return {
    patientName: requiredString(body, "patientName"),
    patientPhone: requiredString(body, "patientPhone"),
    serviceId,
    doctorId,
    preferredDate,
    preferredTime: optionalString(body, "preferredTime"),
    concernNote: optionalString(body, "concernNote"),
  };
}

function requiredString(body: AppointmentRequestBody, field: string): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppointmentRequestValidationError(`${field} is required.`, field);
  }

  return value.trim();
}

function optionalString(body: AppointmentRequestBody, field: string): string | null {
  const value = body[field];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppointmentRequestValidationError(`${field} must be a string.`, field);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function throwQueryError(stage: string, error: SafeSupabaseError): never {
  console.error("[appointment-api] Supabase query failed", {
    stage,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  throw new AppointmentRequestQueryError(stage, error);
}
