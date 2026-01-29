import { NextRequest, NextResponse } from 'next/server';
import { auditLogHelpers } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const applicationId = searchParams.get('application_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    let logs;

    if (userId) {
      logs = auditLogHelpers.findByUserId(parseInt(userId), limit);
    } else if (applicationId) {
      logs = auditLogHelpers.findByApplicationId(parseInt(applicationId));
    } else {
      // Get all logs (in production, implement pagination)
      logs = auditLogHelpers.findByUserId(0, limit); // This is a placeholder
    }

    // Parse JSON details
    const parsedLogs = logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return NextResponse.json({
      logs: parsedLogs,
      count: parsedLogs.length,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
