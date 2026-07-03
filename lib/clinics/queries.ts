import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type SafeSupabaseError = {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
};

export class ClinicQueryError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(
    readonly stage: string,
    error: SafeSupabaseError,
  ) {
    super(`Unable to fetch ${stage}: ${error.message}`);
    this.name = "ClinicQueryError";
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export type Clinic = {
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
};

export type ClinicService = {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_min: number | null;
  price_max: number | null;
  duration_minutes: number | null;
  is_active: boolean | null;
};

export type ClinicDoctor = {
  id: string;
  clinic_id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  consultation_fee: number | null;
  image_url: string | null;
  is_active: boolean | null;
};

export type WorkingHour = {
  id: string;
  clinic_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean | null;
};

export type ClinicKnowledge = {
  id: string;
  clinic_id: string;
  title: string;
  content: string;
  category: string | null;
  is_active: boolean | null;
  updated_at: string | null;
};

export type ClinicBySlug = {
  clinic: Clinic;
  services: ClinicService[];
  doctors: ClinicDoctor[];
  workingHours: WorkingHour[];
  knowledge: ClinicKnowledge[];
};

export async function getClinicBySlug(slug: string): Promise<ClinicBySlug | null> {
  const supabase = createAdminSupabaseClient();
  const normalizedSlug = slug.trim();

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select(
      "id, name, slug, category, city, area, address, phone, whatsapp, email, logo_url, description, status",
    )
    .eq("slug", normalizedSlug)
    .eq("status", "active")
    .maybeSingle();

  if (clinicError) {
    throwQueryError("clinic", clinicError);
  }

  if (!clinic) {
    return null;
  }

  const [
    { data: services, error: servicesError },
    { data: doctors, error: doctorsError },
    { data: workingHours, error: workingHoursError },
    { data: knowledge, error: knowledgeError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id, clinic_id, name, description, category, price_min, price_max, duration_minutes, is_active")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("doctors")
      .select("id, clinic_id, name, specialty, bio, consultation_fee, image_url, is_active")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("working_hours")
      .select("id, clinic_id, day_of_week, open_time, close_time, is_closed")
      .eq("clinic_id", clinic.id)
      .order("day_of_week", { ascending: true }),
    supabase
      .from("clinic_knowledge")
      .select("id, clinic_id, title, content, category, is_active, updated_at")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .order("title", { ascending: true }),
  ]);

  if (servicesError) {
    throwQueryError("clinic services", servicesError);
  }

  if (doctorsError) {
    throwQueryError("clinic doctors", doctorsError);
  }

  if (workingHoursError) {
    throwQueryError("clinic working hours", workingHoursError);
  }

  if (knowledgeError) {
    throwQueryError("clinic knowledge", knowledgeError);
  }

  return {
    clinic,
    services: services ?? [],
    doctors: doctors ?? [],
    workingHours: workingHours ?? [],
    knowledge: knowledge ?? [],
  };
}

function throwQueryError(stage: string, error: SafeSupabaseError): never {
  console.error("[clinic-api] Supabase query failed", {
    stage,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  throw new ClinicQueryError(stage, error);
}
