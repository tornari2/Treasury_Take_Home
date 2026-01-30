import { NextRequest, NextResponse } from "next/server";
import { applicationHelpers, labelImageHelpers } from "@/lib/db-helpers";
import {
  extractLabelData,
  validateOpenAIKey,
  OpenAIAPIKeyError,
  OpenAITimeoutError,
  OpenAINetworkError,
  OpenAIAPIError,
} from "@/lib/openai-service";
import {
  verifyApplication,
  determineApplicationStatus,
} from "@/lib/verification";
import { convertApplicationToApplicationData } from "@/lib/application-converter";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate API key before processing
    const keyValidation = validateOpenAIKey();
    if (!keyValidation.valid) {
      return NextResponse.json(
        {
          error: "Configuration Error",
          message: keyValidation.error || "OpenAI API key is not configured",
          details:
            "Please configure the OPENAI_API_KEY environment variable to enable verification.",
        },
        { status: 503 },
      );
    }

    const applicationId = parseInt(params.id);

    if (isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 },
      );
    }

    const application = applicationHelpers.findById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    // Get label images for this application
    const labelImages = labelImageHelpers.findByApplicationId(applicationId);

    if (labelImages.length === 0) {
      return NextResponse.json(
        { error: "No label images found for this application" },
        { status: 400 },
      );
    }

    // Reset status to "pending" and clear review notes when re-verifying
    // This ensures that re-verification starts fresh regardless of previous status
    applicationHelpers.updateStatus(applicationId, "pending", null);

    // CRITICAL: Clear old verification results BEFORE processing new verification
    // This prevents showing stale verification results when re-verifying
    labelImageHelpers.clearVerificationResults(applicationId);

    // Convert database Application to ApplicationData format
    const applicationData = convertApplicationToApplicationData(
      application,
      labelImages.map((img) => img.id),
    );

    const verificationResults: Record<string, any[]> = {};
    const startTime = Date.now();

    // Process all label images together with a hard timeout safeguard
    try {
      const verificationTimeoutMs = 180000; // 3 minutes max for the whole verification
      await Promise.race([
        (async () => {
          // Prepare all images for extraction
          const images = labelImages.map((img) => ({
            imageBuffer: img.image_data,
            mimeType: img.mime_type,
          }));

          // Extract data from all images using OpenAI (single API call)
          const { extractedData, processingTimeMs } = await extractLabelData(
            images,
            application.beverage_type,
          );

          // Verify extracted data against application data
          const verificationResult = verifyApplication(
            applicationData,
            extractedData,
          );

          // Determine if status should change
          const newStatus = determineApplicationStatus(verificationResult);

          // Cache JSON strings to avoid repeated stringification
          const extractedDataJson = JSON.stringify(extractedData);
          const verificationResultJson = JSON.stringify(verificationResult);

          // Store results in database for each image (same extracted data for all)
          for (const labelImage of labelImages) {
            labelImageHelpers.updateExtraction(
              labelImage.id,
              extractedDataJson,
              verificationResultJson,
              null, // confidence_score no longer used
              processingTimeMs,
            );

            // Store results as array to handle duplicate image types
            if (!verificationResults[labelImage.image_type]) {
              verificationResults[labelImage.image_type] = [];
            }
            verificationResults[labelImage.image_type].push({
              image_id: labelImage.id,
              verification_result: verificationResult,
              processing_time_ms: processingTimeMs,
            });
          }

          // Update application status based on verification results
          // Note: needs_review status is no longer used - soft mismatches stay as pending
          if (newStatus === "needs_review") {
            // Convert needs_review to pending
            applicationHelpers.updateStatus(applicationId, "pending", null);
          }
        })(),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new OpenAITimeoutError(
                  `Verification timed out after ${verificationTimeoutMs}ms`,
                ),
              ),
            verificationTimeoutMs,
          ),
        ),
      ]);
    } catch (error) {
      console.error(
        `Error processing label images for application ${applicationId}:`,
        error,
      );

      // Determine error type and user-friendly message
      let errorType = "Processing Error";
      let errorMessage = "Failed to process images";
      let userMessage = "Verification failed. Please try again.";

      if (error instanceof OpenAIAPIKeyError) {
        errorType = "Configuration Error";
        errorMessage = error.message;
        userMessage =
          "OpenAI API key is not configured or invalid. Please contact administrator.";
      } else if (error instanceof OpenAITimeoutError) {
        errorType = "Timeout Error";
        errorMessage = error.message;
        userMessage =
          "Verification timed out. The images may be too large or the service is busy. Please try again.";
      } else if (error instanceof OpenAINetworkError) {
        errorType = "Network Error";
        errorMessage = error.message;
        userMessage =
          "Network error occurred. Please check your connection and try again.";
      } else if (error instanceof OpenAIAPIError) {
        errorType = "API Error";
        errorMessage = error.message;
        if (error.statusCode === 429) {
          userMessage =
            "Rate limit exceeded. Please wait a moment and try again.";
        } else {
          userMessage = "OpenAI API error occurred. Please try again later.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Store error results for all images
      for (const labelImage of labelImages) {
        if (!verificationResults[labelImage.image_type]) {
          verificationResults[labelImage.image_type] = [];
        }
        verificationResults[labelImage.image_type].push({
          image_id: labelImage.id,
          error: errorType,
          message: errorMessage,
          user_message: userMessage,
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
            (v) => typeof v === "object" && v !== null && "type" in v,
          );
        }
        // Legacy format or error format
        if (result.error) {
          return [];
        }
        return Object.values(result).filter(
          (v) => typeof v === "object" && v !== null && "type" in v,
        );
      });
    const hasHardMismatch = allResults.some(
      (r: any) => r.type === "hard_mismatch" || r.type === "not_found",
    );
    const hasSoftMismatch = allResults.some(
      (r: any) => r.type === "soft_mismatch",
    );
    const overallStatus = hasHardMismatch
      ? "pending"
      : hasSoftMismatch
        ? "pending" // Soft mismatches stay as pending (needs_review no longer used)
        : "pending";

    // Update application status based on overall verification results
    // Status was already reset to 'pending' at the start, so update it here
    applicationHelpers.updateStatus(applicationId, overallStatus, null);

    return NextResponse.json({
      application_id: applicationId,
      verification_results: verificationResults,
      overall_status: overallStatus,
      processing_time_ms: totalProcessingTime,
    });
  } catch (error) {
    console.error("Verify application error:", error);

    // Handle specific error types
    if (error instanceof OpenAIAPIKeyError) {
      return NextResponse.json(
        {
          error: "Configuration Error",
          message: error.message,
          details: "Please configure the OPENAI_API_KEY environment variable.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred during verification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
