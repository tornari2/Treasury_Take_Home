import { NextRequest, NextResponse } from 'next/server';
import { applicationHelpers, labelImageHelpers } from '@/lib/db-helpers';
import { auditLogHelpers } from '@/lib/db-helpers';
import { extractLabelData } from '@/lib/openai-service';
import { verifyApplication, determineApplicationStatus } from '@/lib/verification';
import { convertApplicationToApplicationData } from '@/lib/application-converter';
import type { ExtractedData } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    // Convert database Application to ApplicationData format
    const applicationData = convertApplicationToApplicationData(
      application,
      labelImages.map((img) => img.id)
    );

    const verificationResults: Record<string, any[]> = {};
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

        // Verify extracted data against application data
        const verificationResult = verifyApplication(applicationData, extractedData);

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

        // Store results as array to handle duplicate image types
        if (!verificationResults[labelImage.image_type]) {
          verificationResults[labelImage.image_type] = [];
        }
        verificationResults[labelImage.image_type].push({
          image_id: labelImage.id,
          verification_result: verificationResult,
          confidence,
          processing_time_ms: processingTimeMs,
        });

        // Update application status if needed (only if soft mismatch detected)
        if (newStatus === 'needs_review' && application.status === 'pending') {
          applicationHelpers.updateStatus(applicationId, 'needs_review', null);
        }
      } catch (error) {
        console.error(`Error processing label image ${labelImage.id}:`, error);
        // Store error results as array too
        if (!verificationResults[labelImage.image_type]) {
          verificationResults[labelImage.image_type] = [];
        }
        verificationResults[labelImage.image_type].push({
          image_id: labelImage.id,
          error: 'Failed to process image',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;

    // Skip audit logging since authentication is removed

    // Determine overall status from all verification results
    const allResults = Object.values(verificationResults)
      .flat() // Flatten arrays of results per image type
      .flatMap((result) => {
        // Handle both new array format and legacy single-result format
        if (result.verification_result) {
          return Object.values(result.verification_result).filter(
            (v) => typeof v === 'object' && v !== null && 'type' in v
          );
        }
        // Legacy format or error format
        if (result.error) {
          return [];
        }
        return Object.values(result).filter(
          (v) => typeof v === 'object' && v !== null && 'type' in v
        );
      });
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
