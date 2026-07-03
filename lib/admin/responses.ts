import { NextResponse } from "next/server";

import { AdminSetupNotFoundError, AdminSetupQueryError } from "@/lib/admin/clinicSetup";
import { AdminValidationError } from "@/lib/admin/validators";
import { SupabaseAdminConfigError } from "@/lib/supabase/admin";

export function adminApiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        field: error.field,
      },
      { status: 400 },
    );
  }

  if (error instanceof AdminSetupNotFoundError) {
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
    console.error("[admin-setup-api] Supabase configuration missing", {
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

  if (error instanceof AdminSetupQueryError) {
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

  console.error("[admin-setup-api] Unexpected admin setup API error", {
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
