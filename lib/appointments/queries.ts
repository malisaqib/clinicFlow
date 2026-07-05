import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const APPOINTMENT_REQUEST_SELECT = `
  id,
  patient_name,
  patient_phone,
  preferred_date,
  preferred_time,
  concern_note,
  source,
  status,
  staff_notes,
  created_at,
  service_id,
  doctor_id,
  service:services(id, name),
  doctor:doctors(id, name, specialty)
`;

export const APPOINTMENT_STATUSES = ["new", "contacted", "confirmed", "completed", "cancelled", "lost"] as const;

type SafeSupabaseError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
};

type AppointmentRequestBody = Record<string, unknown>;
type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

type ActiveClinic = {
  id: string;
  slug: string;
};

type ValidatedAppointmentRequestInput = {
  patientName: string;
  patientPhone: string;
  serviceId: string | null;
  doctorId: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  concernNote: string | null;
};

type ValidatedAppointmentRequestUpdateInput = {
  status?: AppointmentStatus;
  staffNotes?: string | null;
};

export type CreatedAppointmentRequest = {
  id: string;
  status: string;
};

export type DashboardAppointmentRequest = {
  id: string;
  patient_name: string;
  patient_phone: string;
  preferred_date: string | null;
  preferred_time: string | null;
  concern_note: string | null;
  source: string | null;
  status: AppointmentStatus | string | null;
  staff_notes: string | null;
  created_at: string | null;
  service_id: string | null;
  doctor_id: string | null;
  service: {
    id: string;
    name: string;
  } | null;
  doctor: {
    id: string;
    name: string;
    specialty: string | null;
  } | null;
};

type RawDashboardAppointmentRequest = Omit<DashboardAppointmentRequest, "service" | "doctor"> & {
  service:
    | DashboardAppointmentRequest["service"]
    | NonNullable<DashboardAppointmentRequest["service"]>[]
    | null;
  doctor:
    | DashboardAppointmentRequest["doctor"]
    | NonNullable<DashboardAppointmentRequest["doctor"]>[]
    | null;
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

export class AppointmentRequestRecordNotFoundError extends Error {
  constructor(readonly requestId: string) {
    super("Appointment request not found.");
    this.name = "AppointmentRequestRecordNotFoundError";
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
  const clinic = await findActiveClinicBySlug(slug);

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

export async function listAppointmentRequestsForClinic(
  slug: string,
  status: string | null,
): Promise<DashboardAppointmentRequest[]> {
  const appointmentStatus = validateOptionalAppointmentStatus(status);
  const supabase = createAdminSupabaseClient();
  const clinic = await findActiveClinicBySlug(slug);

  let query = supabase
    .from("appointment_requests")
    .select(APPOINTMENT_REQUEST_SELECT)
    .eq("clinic_id", clinic.id)
    .order("created_at", { ascending: false });

  if (appointmentStatus) {
    query = query.eq("status", appointmentStatus);
  }

  const { data: appointmentRequests, error } = await query;

  if (error) {
    throwQueryError("list appointment requests", error);
  }

  return ((appointmentRequests ?? []) as unknown as RawDashboardAppointmentRequest[]).map(
    normalizeDashboardAppointmentRequest,
  );
}

export async function updateAppointmentRequestForClinic(
  slug: string,
  requestId: string,
  requestBody: unknown,
): Promise<DashboardAppointmentRequest> {
  const input = validateAppointmentRequestUpdateBody(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findActiveClinicBySlug(slug);
  const normalizedRequestId = requestId.trim();

  if (!isUuid(normalizedRequestId)) {
    throw new AppointmentRequestValidationError("requestId must be a valid UUID.", "requestId");
  }

  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("appointment_requests")
    .select("id")
    .eq("id", normalizedRequestId)
    .eq("clinic_id", clinic.id)
    .maybeSingle();

  if (existingRequestError) {
    throwQueryError("find appointment request", existingRequestError);
  }

  if (!existingRequest) {
    throw new AppointmentRequestRecordNotFoundError(normalizedRequestId);
  }

  const updates: {
    status?: AppointmentStatus;
    staff_notes?: string | null;
  } = {};

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.staffNotes !== undefined) {
    updates.staff_notes = input.staffNotes;
  }

  const { data: updatedRequest, error: updateError } = await supabase
    .from("appointment_requests")
    .update(updates)
    .eq("id", existingRequest.id)
    .eq("clinic_id", clinic.id)
    .select(APPOINTMENT_REQUEST_SELECT)
    .single();

  if (updateError) {
    throwQueryError("update appointment request", updateError);
  }

  if (!updatedRequest) {
    throw new AppointmentRequestQueryError("update appointment request", {
      message: "Supabase did not return the updated appointment request.",
    });
  }

  return normalizeDashboardAppointmentRequest(updatedRequest as unknown as RawDashboardAppointmentRequest);
}

function normalizeDashboardAppointmentRequest(
  appointmentRequest: RawDashboardAppointmentRequest,
): DashboardAppointmentRequest {
  return {
    ...appointmentRequest,
    service: Array.isArray(appointmentRequest.service)
      ? appointmentRequest.service[0] ?? null
      : appointmentRequest.service,
    doctor: Array.isArray(appointmentRequest.doctor)
      ? appointmentRequest.doctor[0] ?? null
      : appointmentRequest.doctor,
  };
}

function validateAppointmentRequestBody(requestBody: unknown): ValidatedAppointmentRequestInput {
  if (!isPlainObject(requestBody)) {
    throw new AppointmentRequestValidationError("Request body must be a JSON object.");
  }

  const body = requestBody;
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

function validateAppointmentRequestUpdateBody(requestBody: unknown): ValidatedAppointmentRequestUpdateInput {
  if (!isPlainObject(requestBody)) {
    throw new AppointmentRequestValidationError("Request body must be a JSON object.");
  }

  const hasStatus = hasField(requestBody, "status");
  const hasStaffNotes = hasField(requestBody, "staffNotes");

  if (!hasStatus && !hasStaffNotes) {
    throw new AppointmentRequestValidationError("At least one of status or staffNotes is required.");
  }

  const input: ValidatedAppointmentRequestUpdateInput = {};

  if (hasStatus) {
    const status = requiredString(requestBody, "status");
    input.status = validateAppointmentStatus(status);
  }

  if (hasStaffNotes) {
    input.staffNotes = optionalString(requestBody, "staffNotes");
  }

  return input;
}

function validateOptionalAppointmentStatus(status: string | null): AppointmentStatus | null {
  if (status === null) {
    return null;
  }

  return validateAppointmentStatus(status);
}

function validateAppointmentStatus(status: string): AppointmentStatus {
  const normalizedStatus = status.trim();

  if (!APPOINTMENT_STATUSES.includes(normalizedStatus as AppointmentStatus)) {
    throw new AppointmentRequestValidationError(
      `status must be one of: ${APPOINTMENT_STATUSES.join(", ")}.`,
      "status",
    );
  }

  return normalizedStatus as AppointmentStatus;
}

async function findActiveClinicBySlug(slug: string): Promise<ActiveClinic> {
  const supabase = createAdminSupabaseClient();
  const normalizedSlug = slug.trim();

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("id, slug")
    .eq("slug", normalizedSlug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throwQueryError("find clinic", error);
  }

  if (!clinic) {
    throw new AppointmentRequestNotFoundError(normalizedSlug);
  }

  return clinic;
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

function isPlainObject(value: unknown): value is AppointmentRequestBody {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasField(body: AppointmentRequestBody, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, field);
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
