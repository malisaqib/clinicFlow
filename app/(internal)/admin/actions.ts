"use server";

// Server actions for admin onboarding. These call the admin lib directly (server-side,
// service role) instead of the key-guarded HTTP admin API — the mock staff session stands
// in for authorization until Supabase Auth ships. Swap this boundary when real auth lands.

import {
  AdminSetupNotFoundError,
  AdminSetupQueryError,
  createClinicDoctor,
  createClinicKnowledge,
  createClinicService,
  getAdminClinicSetup,
  replaceClinicWorkingHours,
  updateClinicProfile,
} from "@/lib/admin/clinicSetup";
import { AdminValidationError } from "@/lib/admin/validators";
import { SupabaseAdminConfigError } from "@/lib/supabase/admin";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string; notConfigured?: boolean };

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof SupabaseAdminConfigError) {
      return { ok: false, error: `Supabase not configured (missing ${error.missingVariables.join(", ")}).`, notConfigured: true };
    }
    if (error instanceof AdminValidationError) {
      return { ok: false, error: error.message, field: error.field };
    }
    if (error instanceof AdminSetupNotFoundError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof AdminSetupQueryError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}

export async function getSetupAction(slug: string) {
  return run(() => getAdminClinicSetup(slug));
}

export async function saveProfileAction(slug: string, body: Record<string, unknown>) {
  return run(() => updateClinicProfile(slug, body));
}

export async function addServiceAction(slug: string, body: Record<string, unknown>) {
  return run(() => createClinicService(slug, body));
}

export async function addDoctorAction(slug: string, body: Record<string, unknown>) {
  return run(() => createClinicDoctor(slug, body));
}

export async function saveWorkingHoursAction(slug: string, workingHours: unknown[]) {
  return run(() => replaceClinicWorkingHours(slug, { workingHours }));
}

export async function addKnowledgeAction(slug: string, body: Record<string, unknown>) {
  return run(() => createClinicKnowledge(slug, body));
}

export type AdminSetup = Extract<Awaited<ReturnType<typeof getSetupAction>>, { ok: true }>["data"];
