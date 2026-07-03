import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApiKey } from "@/lib/admin/auth";
import { replaceClinicWorkingHours } from "@/lib/admin/clinicSetup";
import { adminApiErrorResponse } from "@/lib/admin/responses";
import { readJsonBody } from "@/lib/admin/validators";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = requireAdminApiKey(request);

  if (authError) {
    return authError;
  }

  const { slug } = await context.params;

  try {
    const requestBody = await readJsonBody(request);
    const workingHours = await replaceClinicWorkingHours(slug, requestBody);

    return NextResponse.json({
      workingHours,
    });
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to update working hours.");
  }
}
