import { NextResponse, type NextRequest } from "next/server";

import { getClinicBySlug } from "@/lib/clinics/queries";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  try {
    const clinicData = await getClinicBySlug(slug);

    if (!clinicData) {
      return NextResponse.json(
        {
          error: "Clinic not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(clinicData);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to fetch clinic.",
        details: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
