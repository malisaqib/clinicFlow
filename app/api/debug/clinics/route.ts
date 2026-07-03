import { NextResponse } from "next/server";

import { createAdminSupabaseClient, SupabaseAdminConfigError } from "@/lib/supabase/admin";

// Development testing route. Remove this before production if it is no longer needed.
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("clinics")
      .select("id, name, slug, category, city")
      .order("name", { ascending: true });

    if (error) {
      console.error("[debug-clinics-api] Supabase query failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return NextResponse.json(
        {
          error: "Unable to read clinics.",
          details: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clinics: data ?? [],
    });
  } catch (error) {
    if (error instanceof SupabaseAdminConfigError) {
      console.error("[debug-clinics-api] Supabase configuration missing", {
        missingVariables: error.missingVariables,
      });

      return NextResponse.json(
        {
          error: "Supabase server configuration is missing.",
          missingVariables: error.missingVariables,
        },
        { status: 500 },
      );
    }

    console.error("[debug-clinics-api] Unexpected debug clinics API error", {
      message: error instanceof Error ? error.message : "Unknown error.",
    });

    return NextResponse.json(
      {
        error: "Unable to read clinics.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
