import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApiKey } from "@/lib/admin/auth";
import { getAdminClinicSetup } from "@/lib/admin/clinicSetup";
import { adminApiErrorResponse } from "@/lib/admin/responses";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = requireAdminApiKey(request);

  if (authError) {
    return authError;
  }

  const { slug } = await context.params;

  try {
    const setup = await getAdminClinicSetup(slug);
    return NextResponse.json(setup);
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to load clinic setup.");
  }
}
