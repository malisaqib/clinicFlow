import { NextResponse, type NextRequest } from "next/server";

import {
  AppointmentRequestNotFoundError,
  AppointmentRequestQueryError,
  AppointmentRequestRecordNotFoundError,
  AppointmentRequestValidationError,
  createAppointmentRequestForClinicSlug,
  listAppointmentRequestsForClinic,
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
    return handleAppointmentRequestError(error, normalizedSlug, "Unable to create appointment request.");
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = slug.trim();
  const status = request.nextUrl.searchParams.get("status");

  try {
    const appointmentRequests = await listAppointmentRequestsForClinic(normalizedSlug, status);

    return NextResponse.json({
      appointmentRequests,
    });
  } catch (error) {
    return handleAppointmentRequestError(error, normalizedSlug, "Unable to list appointment requests.");
  }
}

function handleAppointmentRequestError(error: unknown, slug: string, fallbackMessage: string) {
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

  console.error("[appointment-api] Unexpected appointment request API error", {
    slug,
    message: error instanceof Error ? error.message : "Unknown error.",
  });

  return NextResponse.json(
    {
      error: fallbackMessage,
      details: error instanceof Error ? error.message : "Unknown error.",
    },
    { status: 500 },
  );
}
