import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { applicationHelpers } from '@/lib/db-helpers';
import { auditLogHelpers } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Log view action
    auditLogHelpers.create(user.id, 'viewed');

    let applications;
    if (status) {
      applications = applicationHelpers.findByStatus(status);
    } else {
      applications = applicationHelpers.findAll();
    }

    // Parse JSON fields
    const parsedApplications = applications.map((app) => {
      const applicationDataField =
        (app as any).application_data || (app as any).expected_label_data;
      return {
        ...app,
        application_data: applicationDataField ? JSON.parse(applicationDataField) : null,
        // Keep expected_label_data for backward compatibility during migration
        expected_label_data: applicationDataField ? JSON.parse(applicationDataField) : null,
      };
    });

    return NextResponse.json({
      applications: parsedApplications,
      count: parsedApplications.length,
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
