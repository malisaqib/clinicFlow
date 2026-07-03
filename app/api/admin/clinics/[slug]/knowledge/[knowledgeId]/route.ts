import { NextResponse, type NextRequest } from "next/server";

import { requireAdminApiKey } from "@/lib/admin/auth";
import { updateClinicKnowledge } from "@/lib/admin/clinicSetup";
import { adminApiErrorResponse } from "@/lib/admin/responses";
import { readJsonBody } from "@/lib/admin/validators";

type RouteContext = {
  params: Promise<{
    slug: string;
    knowledgeId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = requireAdminApiKey(request);

  if (authError) {
    return authError;
  }

  const { slug, knowledgeId } = await context.params;

  try {
    const requestBody = await readJsonBody(request);
    const knowledge = await updateClinicKnowledge(slug, knowledgeId, requestBody);

    return NextResponse.json({
      knowledge,
    });
  } catch (error) {
    return adminApiErrorResponse(error, "Unable to update clinic knowledge.");
  }
}
