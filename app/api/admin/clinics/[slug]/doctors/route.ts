import { NextResponse, type NextRequest } from "next/server";

import { createClinicDoctor } from "@/lib/admin/clinicSetup";
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
    const doctor = await createClinicDoctor(slug, requestBody);

    return NextResponse.json(
      {
        doctor,
      },
      { status: 201 },
    );
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to create doctor.");
  }
}
