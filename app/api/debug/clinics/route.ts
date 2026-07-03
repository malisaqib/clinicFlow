import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Development testing route. Remove this before production if it is no longer needed.
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("clinics")
      .select("id, name, slug, category, city")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          error: "Unable to read clinics.",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clinics: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to read clinics.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
