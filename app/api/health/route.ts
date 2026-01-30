import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureMigrations } from '@/lib/migrations';

export const dynamic = 'force-dynamic';

// Ensure migrations are run before health check
ensureMigrations();

export async function GET() {
  try {
    // Simple database health check
    db.prepare('SELECT 1').get();

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
