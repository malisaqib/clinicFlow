import { createClient } from "@supabase/supabase-js";

export class SupabaseAdminConfigError extends Error {
  constructor(readonly missingVariables: string[]) {
    super(`Missing required Supabase server environment variables: ${missingVariables.join(", ")}.`);
    this.name = "SupabaseAdminConfigError";
  }
}

// Server-only helper. Do not import this file into client components because it uses the Supabase service role key.
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    const missingVariables = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter((name): name is string => Boolean(name));

    throw new SupabaseAdminConfigError(missingVariables);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
