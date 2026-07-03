import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    app: "ClinicFlow",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
