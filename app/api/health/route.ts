import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Lightweight health check - don't initialize database on every check
    // This prevents slow health checks that cause Railway to kill the container
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "treasury-take-home",
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
