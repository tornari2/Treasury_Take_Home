import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getBatchStatus } from '@/lib/batch-processor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { batchId: string } }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { batchId } = params;
    const status = getBatchStatus(batchId);

    if (!status) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Calculate estimated completion if still processing
    let estimatedCompletion: string | undefined;
    if (status.status === 'processing' && status.processed > 0) {
      const elapsed = Date.now() - new Date(status.started_at).getTime();
      const avgTimePerApp = elapsed / status.processed;
      const remaining = (status.total_applications - status.processed) * avgTimePerApp;
      estimatedCompletion = new Date(Date.now() + remaining).toISOString();
    }

    return NextResponse.json({
      ...status,
      estimated_completion: estimatedCompletion,
    });
  } catch (error) {
    console.error('Get batch status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
