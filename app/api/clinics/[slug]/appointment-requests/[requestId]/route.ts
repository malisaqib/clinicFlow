import { NextResponse, type NextRequest } from "next/server";

import {
  AppointmentRequestNotFoundError,
  AppointmentRequestQueryError,
  AppointmentRequestRecordNotFoundError,
  AppointmentRequestValidationError,
  updateAppointmentRequestForClinic,
} from "@/lib/appointments/queries";
import { SupabaseAdminConfigError } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    slug: string;
    requestId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { slug, requestId } = await context.params;
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
    const appointmentRequest = await updateAppointmentRequestForClinic(normalizedSlug, requestId, requestBody);

    return NextResponse.json({
      appointmentRequest,
    });
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

    if (error instanceof AppointmentRequestRecordNotFoundError) {
      return NextResponse.json(
        {
          error: error.message,
          requestId: error.requestId,
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

    console.error("[appointment-api] Unexpected appointment request update API error", {
      slug: normalizedSlug,
      requestId,
      message: error instanceof Error ? error.message : "Unknown error.",
    });

    return NextResponse.json(
      {
        error: "Unable to update appointment request.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
