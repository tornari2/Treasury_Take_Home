import { v4 as uuidv4 } from 'uuid';
import {
  extractLabelData,
  validateOpenAIKey,
  OpenAIAPIKeyError,
  OpenAITimeoutError,
  OpenAINetworkError,
  OpenAIAPIError,
} from './openai-service';
import { verifyApplication, determineApplicationStatus } from './verification';
import { applicationHelpers, labelImageHelpers } from './db-helpers';
import { convertApplicationToApplicationData } from './application-converter';
import type { ExtractedData } from '@/types/database';

export interface BatchStatus {
  batch_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_applications: number;
  processed: number;
  successful: number;
  failed: number;
  started_at: string;
  estimated_completion?: string;
  results?: Array<{
    application_id: number;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

// In-memory batch status storage (in production, use Redis or database)
const batchStatuses = new Map<string, BatchStatus>();

const MAX_CONCURRENT = 10;

/**
 * Process a batch of applications with concurrent AI calls
 */
export async function processBatch(applicationIds: number[]): Promise<string> {
  // Validate API key before starting batch
  const keyValidation = validateOpenAIKey();
  if (!keyValidation.valid) {
    const batchId = uuidv4();
    const batchStatus: BatchStatus = {
      batch_id: batchId,
      status: 'failed',
      total_applications: applicationIds.length,
      processed: 0,
      successful: 0,
      failed: applicationIds.length,
      started_at: new Date().toISOString(),
      results: applicationIds.map((id) => ({
        application_id: id,
        status: 'failed',
        error: keyValidation.error || 'OpenAI API key is not configured',
      })),
    };
    batchStatuses.set(batchId, batchStatus);
    return batchId;
  }

  const batchId = uuidv4();
  const startedAt = new Date().toISOString();

  const batchStatus: BatchStatus = {
    batch_id: batchId,
    status: 'processing',
    total_applications: applicationIds.length,
    processed: 0,
    successful: 0,
    failed: 0,
    started_at: startedAt,
    results: [],
  };

  batchStatuses.set(batchId, batchStatus);

  // Process applications in batches of MAX_CONCURRENT
  const processBatchChunk = async (chunk: number[]) => {
    const promises = chunk.map(async (appId) => {
      try {
        const application = applicationHelpers.findById(appId);
        if (!application) {
          throw new Error(`Application ${appId} not found`);
        }

        const labelImages = labelImageHelpers.findByApplicationId(appId);
        if (labelImages.length === 0) {
          throw new Error(`No label images found for application ${appId}`);
        }

        // Reset status to "pending" when re-verifying
        // This ensures that re-verification starts fresh regardless of previous status
        if (application.status !== 'pending') {
          applicationHelpers.updateStatus(appId, 'pending', null);
        }

        // Convert database Application to ApplicationData format
        const applicationData = convertApplicationToApplicationData(
          application,
          labelImages.map((img) => img.id)
        );

        // Process all label images together for this application
        let finalStatus = 'pending';
        try {
          // Prepare all images for extraction
          const images = labelImages.map((img) => ({
            imageBuffer: img.image_data,
            mimeType: img.mime_type,
          }));

          // Extract data from all images using OpenAI (single API call)
          const { extractedData, confidence, processingTimeMs } = await extractLabelData(
            images,
            application.beverage_type
          );

          // Verify extracted data against application data
          const verificationResult = verifyApplication(applicationData, extractedData);
          const newStatus = determineApplicationStatus(verificationResult);

          // Store results in database for each image (same extracted data for all)
          for (const labelImage of labelImages) {
            labelImageHelpers.updateExtraction(
              labelImage.id,
              JSON.stringify(extractedData),
              JSON.stringify(verificationResult),
              confidence,
              processingTimeMs
            );
          }

          // Track the most severe status
          if (newStatus === 'needs_review') {
            finalStatus = 'needs_review';
          }
        } catch (error) {
          console.error(`Error processing label images for app ${appId}:`, error);

          // Determine user-friendly error message
          let errorMessage = 'Unknown error';
          if (error instanceof OpenAIAPIKeyError) {
            errorMessage = 'OpenAI API key is not configured or invalid';
          } else if (error instanceof OpenAITimeoutError) {
            errorMessage = 'Request timed out. Please try again.';
          } else if (error instanceof OpenAINetworkError) {
            errorMessage = 'Network error occurred';
          } else if (error instanceof OpenAIAPIError) {
            if (error.statusCode === 429) {
              errorMessage = 'Rate limit exceeded. Please wait and try again.';
            } else {
              errorMessage = `OpenAI API error: ${error.message}`;
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          throw new Error(errorMessage);
        }

        // Update application status based on verification results
        // Status was already reset to 'pending' at the start, so update it here
        applicationHelpers.updateStatus(appId, finalStatus, null);

        batchStatus.results!.push({
          application_id: appId,
          status: 'success',
        });
        batchStatus.successful++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        batchStatus.results!.push({
          application_id: appId,
          status: 'failed',
          error: errorMessage,
        });
        batchStatus.failed++;
      } finally {
        batchStatus.processed++;
        batchStatuses.set(batchId, { ...batchStatus });
      }
    });

    await Promise.allSettled(promises);
  };

  // Process in chunks
  for (let i = 0; i < applicationIds.length; i += MAX_CONCURRENT) {
    const chunk = applicationIds.slice(i, i + MAX_CONCURRENT);
    await processBatchChunk(chunk);
  }

  batchStatus.status = 'completed';
  batchStatuses.set(batchId, batchStatus);

  return batchId;
}

/**
 * Get batch processing status
 */
export function getBatchStatus(batchId: string): BatchStatus | null {
  return batchStatuses.get(batchId) || null;
}
