import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  AdminValidationError,
  assertAtLeastOneField,
  assertJsonObject,
  hasField,
  optionalAliasedBoolean,
  optionalAliasedInteger,
  optionalAliasedString,
  optionalRequiredString,
  optionalString,
  requiredString,
  validateDayOfWeek,
  validateTime,
  validateUuid,
  type JsonObject,
} from "@/lib/admin/validators";

const CLINIC_SELECT =
  "id, name, slug, category, city, area, address, phone, whatsapp, email, logo_url, description, status, created_at";
const SERVICE_SELECT =
  "id, clinic_id, name, description, category, price_min, price_max, duration_minutes, is_active, created_at";
const DOCTOR_SELECT =
  "id, clinic_id, name, specialty, bio, consultation_fee, image_url, is_active, created_at";
const WORKING_HOUR_SELECT = "id, clinic_id, day_of_week, open_time, close_time, is_closed";
const KNOWLEDGE_SELECT = "id, clinic_id, title, content, category, is_active, updated_at";

type SafeSupabaseError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
};

type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>;

type ClinicProfile = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  area: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  logo_url: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
};

type ClinicService = {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_min: number | null;
  price_max: number | null;
  duration_minutes: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

type ClinicDoctor = {
  id: string;
  clinic_id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  consultation_fee: number | null;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type WorkingHour = {
  id: string;
  clinic_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean | null;
};

type ClinicKnowledge = {
  id: string;
  clinic_id: string;
  title: string;
  content: string;
  category: string | null;
  is_active: boolean | null;
  updated_at: string | null;
};

type ClinicSetup = {
  clinic: ClinicProfile;
  services: ClinicService[];
  doctors: ClinicDoctor[];
  workingHours: WorkingHour[];
  clinicKnowledge: ClinicKnowledge[];
};

export class AdminSetupNotFoundError extends Error {
  constructor(
    readonly resource: string,
    readonly identifier?: string,
  ) {
    super(`${resource} not found.`);
    this.name = "AdminSetupNotFoundError";
  }
}

export class AdminSetupQueryError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(
    readonly stage: string,
    error: SafeSupabaseError,
  ) {
    super(`Unable to ${stage}: ${error.message}`);
    this.name = "AdminSetupQueryError";
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export async function getAdminClinicSetup(slug: string): Promise<ClinicSetup> {
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug, { requireActive: true });

  const [
    { data: services, error: servicesError },
    { data: doctors, error: doctorsError },
    { data: workingHours, error: workingHoursError },
    { data: clinicKnowledge, error: clinicKnowledgeError },
  ] = await Promise.all([
    supabase.from("services").select(SERVICE_SELECT).eq("clinic_id", clinic.id).order("name", { ascending: true }),
    supabase.from("doctors").select(DOCTOR_SELECT).eq("clinic_id", clinic.id).order("name", { ascending: true }),
    supabase
      .from("working_hours")
      .select(WORKING_HOUR_SELECT)
      .eq("clinic_id", clinic.id)
      .order("day_of_week", { ascending: true }),
    supabase
      .from("clinic_knowledge")
      .select(KNOWLEDGE_SELECT)
      .eq("clinic_id", clinic.id)
      .order("title", { ascending: true }),
  ]);

  if (servicesError) {
    throwQueryError("fetch services", servicesError);
  }

  if (doctorsError) {
    throwQueryError("fetch doctors", doctorsError);
  }

  if (workingHoursError) {
    throwQueryError("fetch working hours", workingHoursError);
  }

  if (clinicKnowledgeError) {
    throwQueryError("fetch clinic knowledge", clinicKnowledgeError);
  }

  return {
    clinic,
    services: services ?? [],
    doctors: doctors ?? [],
    workingHours: workingHours ?? [],
    clinicKnowledge: clinicKnowledge ?? [],
  };
}

export async function updateClinicProfile(slug: string, requestBody: unknown): Promise<ClinicProfile> {
  const input = validateClinicProfileUpdate(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);

  const { data: updatedClinic, error } = await supabase
    .from("clinics")
    .update(input)
    .eq("id", clinic.id)
    .select(CLINIC_SELECT)
    .single();

  if (error) {
    throwQueryError("update clinic profile", error);
  }

  return updatedClinic;
}

export async function createClinicService(slug: string, requestBody: unknown): Promise<ClinicService> {
  const input = validateCreateService(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);

  const { data: service, error } = await supabase
    .from("services")
    .insert({
      clinic_id: clinic.id,
      ...input,
    })
    .select(SERVICE_SELECT)
    .single();

  if (error) {
    throwQueryError("create service", error);
  }

  return service;
}

export async function updateClinicService(
  slug: string,
  serviceId: string,
  requestBody: unknown,
): Promise<ClinicService> {
  const input = validateUpdateService(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);
  const normalizedServiceId = validateUuid(serviceId, "serviceId");

  const { data: service, error } = await supabase
    .from("services")
    .update(input)
    .eq("id", normalizedServiceId)
    .eq("clinic_id", clinic.id)
    .select(SERVICE_SELECT)
    .maybeSingle();

  if (error) {
    throwQueryError("update service", error);
  }

  if (!service) {
    throw new AdminSetupNotFoundError("Service", normalizedServiceId);
  }

  return service;
}

export async function createClinicDoctor(slug: string, requestBody: unknown): Promise<ClinicDoctor> {
  const input = validateCreateDoctor(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);

  const { data: doctor, error } = await supabase
    .from("doctors")
    .insert({
      clinic_id: clinic.id,
      ...input,
    })
    .select(DOCTOR_SELECT)
    .single();

  if (error) {
    throwQueryError("create doctor", error);
  }

  return doctor;
}

export async function updateClinicDoctor(slug: string, doctorId: string, requestBody: unknown): Promise<ClinicDoctor> {
  const input = validateUpdateDoctor(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);
  const normalizedDoctorId = validateUuid(doctorId, "doctorId");

  const { data: doctor, error } = await supabase
    .from("doctors")
    .update(input)
    .eq("id", normalizedDoctorId)
    .eq("clinic_id", clinic.id)
    .select(DOCTOR_SELECT)
    .maybeSingle();

  if (error) {
    throwQueryError("update doctor", error);
  }

  if (!doctor) {
    throw new AdminSetupNotFoundError("Doctor", normalizedDoctorId);
  }

  return doctor;
}

export async function replaceClinicWorkingHours(slug: string, requestBody: unknown): Promise<WorkingHour[]> {
  const input = validateWorkingHours(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);

  const { error: deleteError } = await supabase.from("working_hours").delete().eq("clinic_id", clinic.id);

  if (deleteError) {
    throwQueryError("delete working hours", deleteError);
  }

  if (input.length === 0) {
    return [];
  }

  const { data: workingHours, error: insertError } = await supabase
    .from("working_hours")
    .insert(input.map((hours) => ({ clinic_id: clinic.id, ...hours })))
    .select(WORKING_HOUR_SELECT)
    .order("day_of_week", { ascending: true });

  if (insertError) {
    throwQueryError("insert working hours", insertError);
  }

  return workingHours ?? [];
}

export async function createClinicKnowledge(slug: string, requestBody: unknown): Promise<ClinicKnowledge> {
  const input = validateCreateKnowledge(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);

  const { data: knowledge, error } = await supabase
    .from("clinic_knowledge")
    .insert({
      clinic_id: clinic.id,
      ...input,
    })
    .select(KNOWLEDGE_SELECT)
    .single();

  if (error) {
    throwQueryError("create clinic knowledge", error);
  }

  return knowledge;
}

export async function updateClinicKnowledge(
  slug: string,
  knowledgeId: string,
  requestBody: unknown,
): Promise<ClinicKnowledge> {
  const input = validateUpdateKnowledge(requestBody);
  const supabase = createAdminSupabaseClient();
  const clinic = await findClinicBySlug(supabase, slug);
  const normalizedKnowledgeId = validateUuid(knowledgeId, "knowledgeId");

  const { data: knowledge, error } = await supabase
    .from("clinic_knowledge")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", normalizedKnowledgeId)
    .eq("clinic_id", clinic.id)
    .select(KNOWLEDGE_SELECT)
    .maybeSingle();

  if (error) {
    throwQueryError("update clinic knowledge", error);
  }

  if (!knowledge) {
    throw new AdminSetupNotFoundError("Clinic knowledge row", normalizedKnowledgeId);
  }

  return knowledge;
}

function validateClinicProfileUpdate(requestBody: unknown): JsonObject {
  const body = assertJsonObject(requestBody);
  const updates: JsonObject = {};

  assignRequiredString(updates, "name", optionalRequiredString(body, "name"));
  assignRequiredString(updates, "category", optionalRequiredString(body, "category"));
  assignRequiredString(updates, "city", optionalRequiredString(body, "city"));
  assignString(updates, "area", optionalString(body, "area"));
  assignString(updates, "address", optionalString(body, "address"));
  assignString(updates, "phone", optionalString(body, "phone"));
  assignString(updates, "whatsapp", optionalString(body, "whatsapp"));
  assignString(updates, "email", optionalString(body, "email"));
  assignString(updates, "logo_url", optionalString(body, "logo_url"));
  assignString(updates, "description", optionalString(body, "description"));
  assignRequiredString(updates, "status", optionalRequiredString(body, "status"));

  assertAtLeastOneField(updates, "At least one allowed clinic profile field is required.");
  return updates;
}

function validateCreateService(requestBody: unknown): JsonObject {
  const body = assertJsonObject(requestBody);
  const service: JsonObject = {
    name: requiredString(body, "name"),
  };

  assignString(service, "description", optionalString(body, "description"));
  assignString(service, "category", optionalString(body, "category"));
  assignNumber(service, "price_min", optionalAliasedInteger(body, ["priceMin", "price_min"]));
  assignNumber(service, "price_max", optionalAliasedInteger(body, ["priceMax", "price_max"]));
  assignNumber(service, "duration_minutes", optionalAliasedInteger(body, ["durationMinutes", "duration_minutes"]));
  assignBoolean(service, "is_active", optionalAliasedBoolean(body, ["isActive", "is_active"]) ?? true);

  return service;
}

function validateUpdateService(requestBody: unknown): JsonObject {
  const body = assertJsonObject(requestBody);
  const updates: JsonObject = {};

  assignRequiredString(updates, "name", optionalRequiredString(body, "name"));
  assignString(updates, "description", optionalString(body, "description"));
  assignString(updates, "category", optionalString(body, "category"));
  assignNumber(updates, "price_min", optionalAliasedInteger(body, ["priceMin", "price_min"]));
  assignNumber(updates, "price_max", optionalAliasedInteger(body, ["priceMax", "price_max"]));
  assignNumber(updates, "duration_minutes", optionalAliasedInteger(body, ["durationMinutes", "duration_minutes"]));
  assignBoolean(updates, "is_active", optionalAliasedBoolean(body, ["isActive", "is_active"]));

  assertAtLeastOneField(updates, "At least one allowed service field is required.");
  return updates;
}

function validateCreateDoctor(requestBody: unknown): JsonObject {
  const body = assertJsonObject(requestBody);
  const doctor: JsonObject = {
    name: requiredString(body, "name"),
  };

  assignString(doctor, "specialty", optionalString(body, "specialty"));
  assignString(doctor, "bio", optionalString(body, "bio"));
  assignNumber(doctor, "consultation_fee", optionalAliasedInteger(body, ["consultationFee", "consultation_fee"]));
  assignString(doctor, "image_url", optionalAliasedString(body, ["imageUrl", "image_url"]));
  assignBoolean(doctor, "is_active", optionalAliasedBoolean(body, ["isActive", "is_active"]) ?? true);

  return doctor;
}

function validateUpdateDoctor(requestBody: unknown): JsonObject {
  const body = assertJsonObject(requestBody);
  const updates: JsonObject = {};

  assignRequiredString(updates, "name", optionalRequiredString(body, "name"));
  assignString(updates, "specialty", optionalString(body, "specialty"));
  assignString(updates, "bio", optionalString(body, "bio"));
  assignNumber(updates, "consultation_fee", optionalAliasedInteger(body, ["consultationFee", "consultation_fee"]));
  assignString(updates, "image_url", optionalAliasedString(body, ["imageUrl", "image_url"]));
  assignBoolean(updates, "is_active", optionalAliasedBoolean(body, ["isActive", "is_active"]));

  assertAtLeastOneField(updates, "At least one allowed doctor field is required.");
  return updates;
}

function validateWorkingHours(requestBody: unknown): JsonObject[] {
  const body = assertJsonObject(requestBody);
  const workingHours = body.workingHours;

  if (!Array.isArray(workingHours)) {
    throw new AdminValidationError("workingHours must be an array.", "workingHours");
  }

  return workingHours.map((entry, index) => {
    const hours = assertJsonObject(entry);
    const dayOfWeek = hasField(hours, "dayOfWeek") ? hours.dayOfWeek : hours.day_of_week;
    const openTime = hasField(hours, "openTime") ? hours.openTime : hours.open_time;
    const closeTime = hasField(hours, "closeTime") ? hours.closeTime : hours.close_time;
    const isClosed = hasField(hours, "isClosed") ? hours.isClosed : hours.is_closed;

    if (typeof isClosed !== "boolean") {
      throw new AdminValidationError(`workingHours[${index}].isClosed must be a boolean.`, "isClosed");
    }

    return {
      day_of_week: validateDayOfWeek(dayOfWeek, `workingHours[${index}].dayOfWeek`),
      open_time: validateTime(openTime ?? null, `workingHours[${index}].openTime`),
      close_time: validateTime(closeTime ?? null, `workingHours[${index}].closeTime`),
      is_closed: isClosed,
    };
  });
}

function validateCreateKnowledge(requestBody: unknown): JsonObject {
  const body = assertJsonObject(requestBody);
  const knowledge: JsonObject = {
    title: requiredString(body, "title"),
    content: requiredString(body, "content"),
  };

  assignString(knowledge, "category", optionalString(body, "category"));
  assignBoolean(knowledge, "is_active", optionalAliasedBoolean(body, ["isActive", "is_active"]) ?? true);

  return knowledge;
}

function validateUpdateKnowledge(requestBody: unknown): JsonObject {
  const body = assertJsonObject(requestBody);
  const updates: JsonObject = {};

  assignRequiredString(updates, "title", optionalRequiredString(body, "title"));
  assignRequiredString(updates, "content", optionalRequiredString(body, "content"));
  assignString(updates, "category", optionalString(body, "category"));
  assignBoolean(updates, "is_active", optionalAliasedBoolean(body, ["isActive", "is_active"]));

  assertAtLeastOneField(updates, "At least one allowed clinic knowledge field is required.");
  return updates;
}

async function findClinicBySlug(
  supabase: SupabaseAdminClient,
  slug: string,
  options?: { requireActive?: boolean },
): Promise<ClinicProfile> {
  const normalizedSlug = slug.trim();
  let query = supabase.from("clinics").select(CLINIC_SELECT).eq("slug", normalizedSlug);

  if (options?.requireActive) {
    query = query.eq("status", "active");
  }

  const { data: clinic, error } = await query.maybeSingle();

  if (error) {
    throwQueryError("find clinic", error);
  }

  if (!clinic) {
    throw new AdminSetupNotFoundError("Clinic", normalizedSlug);
  }

  return clinic;
}

function assignString(updates: JsonObject, field: string, value: string | null | undefined): void {
  if (value !== undefined) {
    updates[field] = value;
  }
}

function assignRequiredString(updates: JsonObject, field: string, value: string | undefined): void {
  if (value !== undefined) {
    updates[field] = value;
  }
}

function assignNumber(updates: JsonObject, field: string, value: number | null | undefined): void {
  if (value !== undefined) {
    updates[field] = value;
  }
}

function assignBoolean(updates: JsonObject, field: string, value: boolean | undefined): void {
  if (value !== undefined) {
    updates[field] = value;
  }
}

function throwQueryError(stage: string, error: SafeSupabaseError): never {
  console.error("[admin-setup-api] Supabase query failed", {
    stage,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  throw new AdminSetupQueryError(stage, error);
}
