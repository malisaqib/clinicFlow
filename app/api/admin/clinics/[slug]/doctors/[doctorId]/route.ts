import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApiKey } from "@/lib/admin/auth";
import { updateClinicDoctor } from "@/lib/admin/clinicSetup";
import { adminApiErrorResponse } from "@/lib/admin/responses";
import { readJsonBody } from "@/lib/admin/validators";

type RouteContext = {
  params: Promise<{
    slug: string;
    doctorId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = requireAdminApiKey(request);

  if (authError) {
    return authError;
  }

  const { slug, doctorId } = await context.params;

  try {
    const requestBody = await readJsonBody(request);
    const doctor = await updateClinicDoctor(slug, doctorId, requestBody);

    return NextResponse.json({
      doctor,
    });
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to update doctor.");
  }
}
