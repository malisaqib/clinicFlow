import { NextResponse, type NextRequest } from "next/server";

import { ClinicQueryError, getClinicBySlug } from "@/lib/clinics/queries";
import { SupabaseAdminConfigError } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = slug.trim();

  try {
    const clinicData = await getClinicBySlug(normalizedSlug);

    if (!clinicData) {
      return NextResponse.json(
        {
          error: "Clinic not found.",
          slug: normalizedSlug,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(clinicData);
  } catch (error) {
    if (error instanceof SupabaseAdminConfigError) {
      console.error("[clinic-api] Supabase configuration missing", {
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

    if (error instanceof ClinicQueryError) {
      return NextResponse.json(
        {
          error: error.message,
          stage: error.stage,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      );
    }

    console.error("[clinic-api] Unexpected clinic API error", {
      slug: normalizedSlug,
      message: error instanceof Error ? error.message : "Unknown error.",
    });

    return NextResponse.json(
      {
        error: "Unable to fetch clinic.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
