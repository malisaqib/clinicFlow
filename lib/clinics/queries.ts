import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select(
      "id, name, slug, category, city, area, address, phone, whatsapp, email, logo_url, description, status",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (clinicError) {
    throw new Error(`Unable to fetch clinic: ${clinicError.message}`);
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
    throw new Error(`Unable to fetch clinic services: ${servicesError.message}`);
  }

  if (doctorsError) {
    throw new Error(`Unable to fetch clinic doctors: ${doctorsError.message}`);
  }

  if (workingHoursError) {
    throw new Error(`Unable to fetch clinic working hours: ${workingHoursError.message}`);
  }

  if (knowledgeError) {
    throw new Error(`Unable to fetch clinic knowledge: ${knowledgeError.message}`);
  }

  return {
    clinic,
    services: services ?? [],
    doctors: doctors ?? [],
    workingHours: workingHours ?? [],
    knowledge: knowledge ?? [],
  };
}
