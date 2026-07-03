import { NextResponse, type NextRequest } from "next/server";

import { updateClinicService } from "@/lib/admin/clinicSetup";
import { adminApiErrorResponse } from "@/lib/admin/responses";
import { readJsonBody } from "@/lib/admin/validators";

type RouteContext = {
  params: Promise<{
    slug: string;
    serviceId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { slug, serviceId } = await context.params;

  try {
    const requestBody = await readJsonBody(request);
    const service = await updateClinicService(slug, serviceId, requestBody);

    return NextResponse.json({
      service,
    });
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to update service.");
  }
}
