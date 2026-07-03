import { NextResponse, type NextRequest } from "next/server";

import { createClinicService } from "@/lib/admin/clinicSetup";
import { adminApiErrorResponse } from "@/lib/admin/responses";
import { readJsonBody } from "@/lib/admin/validators";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const requestBody = await readJsonBody(request);
    const service = await createClinicService(slug, requestBody);

    return NextResponse.json(
      {
        service,
      },
      { status: 201 },
    );
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to create service.");
  }
}
