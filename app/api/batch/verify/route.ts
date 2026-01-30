import { NextRequest, NextResponse } from 'next/server';
import { processBatch } from '@/lib/batch-processor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { application_ids } = body;

    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      return NextResponse.json(
        { error: 'application_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (application_ids.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 applications per batch' }, { status: 400 });
    }

    // Start batch processing (async - returns batchId immediately, processes in background)
    const batchId = await processBatch(application_ids);

    // Skip audit logging since authentication is removed

    return NextResponse.json(
      {
        batch_id: batchId,
        total_applications: application_ids.length,
        status: 'processing',
        status_url: `/api/batch/status/${batchId}`,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Batch verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
