import { NextResponse, type NextRequest } from "next/server";

import { updateClinicProfile } from "@/lib/admin/clinicSetup";
import { adminApiErrorResponse } from "@/lib/admin/responses";
import { readJsonBody } from "@/lib/admin/validators";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const requestBody = await readJsonBody(request);
    const clinic = await updateClinicProfile(slug, requestBody);

    return NextResponse.json({
      clinic,
    });
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to update clinic profile.");
  }
}
