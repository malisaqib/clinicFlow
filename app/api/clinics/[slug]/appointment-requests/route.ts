import { NextResponse, type NextRequest } from "next/server";

import {
  AppointmentRequestNotFoundError,
  AppointmentRequestQueryError,
  AppointmentRequestValidationError,
  createAppointmentRequestForClinicSlug,
} from "@/lib/appointments/queries";
import { SupabaseAdminConfigError } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = slug.trim();

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  try {
    const appointmentRequest = await createAppointmentRequestForClinicSlug(normalizedSlug, requestBody);

    return NextResponse.json(
      {
        success: true,
        appointmentRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppointmentRequestNotFoundError) {
      return NextResponse.json(
        {
          error: error.message,
          slug: error.slug,
        },
        { status: 404 },
      );
    }

    if (error instanceof AppointmentRequestValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          field: error.field,
        },
        { status: 400 },
      );
    }

    if (error instanceof SupabaseAdminConfigError) {
      console.error("[appointment-api] Supabase configuration missing", {
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

    if (error instanceof AppointmentRequestQueryError) {
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

    console.error("[appointment-api] Unexpected appointment request API error", {
      slug: normalizedSlug,
      message: error instanceof Error ? error.message : "Unknown error.",
    });

    return NextResponse.json(
      {
        error: "Unable to create appointment request.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
