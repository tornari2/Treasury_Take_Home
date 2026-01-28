import { v4 as uuidv4 } from 'uuid';
import { extractLabelData } from './openai-service';
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

        // Convert database Application to ApplicationData format
        const applicationData = convertApplicationToApplicationData(
          application,
          labelImages.map((img) => img.id)
        );

        // Process all label images for this application
        for (const labelImage of labelImages) {
          try {
            const { extractedData, confidence, processingTimeMs } = await extractLabelData(
              labelImage.image_data,
              labelImage.mime_type,
              application.beverage_type
            );

            // Verify extracted data against application data
            const verificationResult = verifyApplication(applicationData, extractedData);
            const newStatus = determineApplicationStatus(verificationResult);

            labelImageHelpers.updateExtraction(
              labelImage.id,
              JSON.stringify(extractedData),
              JSON.stringify(verificationResult),
              confidence,
              processingTimeMs
            );

            if (newStatus === 'needs_review' && application.status === 'pending') {
              applicationHelpers.updateStatus(appId, 'needs_review', null);
            }
          } catch (error) {
            console.error(`Error processing label image for app ${appId}:`, error);
            throw error;
          }
        }

        batchStatus.results!.push({
          application_id: appId,
          status: 'success',
        });
        batchStatus.successful++;
      } catch (error) {
        batchStatus.results!.push({
          application_id: appId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
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
