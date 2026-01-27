import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { applicationHelpers, labelImageHelpers } from '@/lib/db-helpers';
import { auditLogHelpers } from '@/lib/db-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const applicationId = parseInt(params.id);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = applicationHelpers.findById(applicationId);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get label images for this application
    const labelImages = labelImageHelpers.findByApplicationId(applicationId);

    // Parse JSON fields and convert image data to base64 for frontend
    const parsedApplication = {
      ...application,
      expected_label_data: JSON.parse(application.expected_label_data),
      label_images: labelImages.map((img) => ({
        ...img,
        image_data_base64: img.image_data.toString('base64'),
        extracted_data: img.extracted_data ? JSON.parse(img.extracted_data) : null,
        verification_result: img.verification_result ? JSON.parse(img.verification_result) : null,
      })),
    };

    // Log view action
    auditLogHelpers.create(user.id, 'viewed', applicationId);

    return NextResponse.json({ application: parsedApplication });
  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const applicationId = parseInt(params.id);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = applicationHelpers.findById(applicationId);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, review_notes } = body;

    if (status && !['pending', 'needs_review', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update application
    if (status) {
      applicationHelpers.updateStatus(applicationId, status, review_notes || null);

      // Log status change
      const action =
        status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'status_changed';
      auditLogHelpers.create(
        user.id,
        action,
        applicationId,
        JSON.stringify({ status, review_notes })
      );
    }

    const updatedApplication = applicationHelpers.findById(applicationId);

    return NextResponse.json({
      application: {
        ...updatedApplication,
        expected_label_data: JSON.parse(updatedApplication!.expected_label_data),
      },
    });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
