import { NextResponse, type NextRequest } from "next/server";

import { ClinicQueryError } from "@/lib/clinics/queries";
import {
  handleReceptionistMessage,
  ReceptionistNotFoundError,
  ReceptionistQueryError,
  ReceptionistValidationError,
} from "@/lib/ai/receptionist";
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
    const result = await handleReceptionistMessage(normalizedSlug, requestBody);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ReceptionistValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          field: error.field,
        },
        { status: 400 },
      );
    }

    if (error instanceof ReceptionistNotFoundError) {
      return NextResponse.json(
        {
          error: error.message,
          resource: error.resource,
          identifier: error.identifier,
        },
        { status: 404 },
      );
    }

    if (error instanceof SupabaseAdminConfigError) {
      console.error("[ai-receptionist] Supabase configuration missing", {
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

    if (error instanceof ReceptionistQueryError || error instanceof ClinicQueryError) {
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

    console.error("[ai-receptionist] Unexpected receptionist API error", {
      slug: normalizedSlug,
      message: error instanceof Error ? error.message : "Unknown error.",
    });

    return NextResponse.json(
      {
        error: "Unable to process AI receptionist message.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
