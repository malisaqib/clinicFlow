import { NextResponse, type NextRequest } from "next/server";

export function requireAdminApiKey(request: NextRequest) {
  const configuredApiKey = process.env.ADMIN_API_KEY?.trim();

  if (!configuredApiKey) {
    return NextResponse.json(
      {
        error: "Admin API key is not configured.",
      },
      { status: 500 },
    );
  }

  const requestApiKey = request.headers.get("x-admin-api-key")?.trim();

  if (!requestApiKey || requestApiKey !== configuredApiKey) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  return null;
}
