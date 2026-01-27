import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { applicationHelpers, labelImageHelpers } from '@/lib/db-helpers';
import { auditLogHelpers } from '@/lib/db-helpers';
import { extractLabelData } from '@/lib/openai-service';
import { verifyApplication, determineApplicationStatus } from '@/lib/verification';
import type { ExpectedLabelData } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (labelImages.length === 0) {
      return NextResponse.json(
        { error: 'No label images found for this application' },
        { status: 400 }
      );
    }

    const expectedLabelData: ExpectedLabelData = JSON.parse(application.expected_label_data);
    const verificationResults: Record<string, any> = {};
    const startTime = Date.now();

    // Process each label image
    for (const labelImage of labelImages) {
      try {
        // Extract data from image using OpenAI
        const { extractedData, confidence, processingTimeMs } = await extractLabelData(
          labelImage.image_data,
          labelImage.mime_type,
          application.beverage_type
        );

        // Verify extracted data against expected data
        const verificationResult = verifyApplication(expectedLabelData, extractedData);

        // Determine if status should change
        const newStatus = determineApplicationStatus(verificationResult);

        // Store results in database
        labelImageHelpers.updateExtraction(
          labelImage.id,
          JSON.stringify(extractedData),
          JSON.stringify(verificationResult),
          confidence,
          processingTimeMs
        );

        verificationResults[labelImage.image_type] = verificationResult;

        // Update application status if needed (only if soft mismatch detected)
        if (newStatus === 'needs_review' && application.status === 'pending') {
          applicationHelpers.updateStatus(applicationId, 'needs_review', null);
        }
      } catch (error) {
        console.error(`Error processing label image ${labelImage.id}:`, error);
        verificationResults[labelImage.image_type] = {
          error: 'Failed to process image',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    // Log verification action
    auditLogHelpers.create(
      user.id,
      'verified',
      applicationId,
      JSON.stringify({ processing_time_ms: totalProcessingTime })
    );

    // Determine overall status
    const allResults = Object.values(verificationResults).flatMap((r) =>
      Object.values(r).filter((v) => typeof v === 'object' && v !== null && 'type' in v)
    );
    const hasHardMismatch = allResults.some(
      (r: any) => r.type === 'hard_mismatch' || r.type === 'not_found'
    );
    const hasSoftMismatch = allResults.some((r: any) => r.type === 'soft_mismatch');
    const overallStatus = hasHardMismatch
      ? 'pending'
      : hasSoftMismatch
        ? 'needs_review'
        : 'pending';

    return NextResponse.json({
      application_id: applicationId,
      verification_results: verificationResults,
      overall_status: overallStatus,
      processing_time_ms: totalProcessingTime,
    });
  } catch (error) {
    console.error('Verify application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
