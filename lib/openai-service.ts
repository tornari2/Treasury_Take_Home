import OpenAI from 'openai';
import type { ExtractedData } from '@/types/database';
import {
  getBeverageSpecificInstructions,
  getClassTypeFieldDescription,
} from '@/lib/validation/prompts';

// Custom error types for better error handling
export class OpenAIAPIKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIAPIKeyError';
  }
}

export class OpenAITimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAITimeoutError';
  }
}

export class OpenAINetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAINetworkError';
  }
}

export class OpenAIAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'OpenAIAPIError';
  }
}

// Configuration
const TIMEOUT_MS = 30000; // 30 seconds per image
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // 1 second delay between retries

// Lazy initialization to avoid requiring API key during build time
let openai: OpenAI | null = null;

/**
 * Check if OpenAI API key is configured
 */
export function isOpenAIKeyConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Validate OpenAI API key format (basic check)
 */
export function validateOpenAIKey(): { valid: boolean; error?: string } {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      valid: false,
      error:
        'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.',
    };
  }
  if (!apiKey.startsWith('sk-')) {
    return {
      valid: false,
      error: 'Invalid OpenAI API key format. API keys should start with "sk-".',
    };
  }
  return { valid: true };
}

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const validation = validateOpenAIKey();
    if (!validation.valid) {
      throw new OpenAIAPIKeyError(validation.error || 'OpenAI API key is not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      timeout: TIMEOUT_MS,
    });
  }
  return openai;
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new OpenAITimeoutError(`Request timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on API key errors or client errors (4xx)
      if (
        error instanceof OpenAIAPIKeyError ||
        (error instanceof OpenAIAPIError && error.statusCode && error.statusCode < 500)
      ) {
        throw error;
      }

      // Retry on network errors, timeouts, and server errors (5xx)
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError!;
}

/**
 * Extract label data from multiple images using GPT-4o vision
 * Processes all images together to extract all fields across all images
 */
export async function extractLabelData(
  images: Array<{ imageBuffer: Buffer; mimeType: string }>,
  beverageType: 'spirits' | 'wine' | 'beer'
): Promise<{ extractedData: ExtractedData; processingTimeMs: number }> {
  const startTime = Date.now();

  if (images.length === 0) {
    throw new OpenAIAPIError('At least one image is required');
  }

  // Convert all buffers to base64 data URLs
  const imageDataUrls = images.map((img) => {
    const base64Image = img.imageBuffer.toString('base64');
    return `data:${img.mimeType};base64,${base64Image}`;
  });

  // Define fields to extract based on beverage type
  const fieldDefinitions: Record<string, string> = {
    brand_name: 'Brand name',
    class_type: getClassTypeFieldDescription(beverageType),
    alcohol_content:
      'Alcohol content - CRITICAL: Extract COMPLETE text including any prefix (e.g., "ALC.", "ALCOHOL", "ABV") if present. Example: "ALC. 12.5% BY VOL." not "12.5% BY VOL."',
    net_contents: 'Net contents (volume)',
    producer_name: 'Producer name',
    producer_address: 'Producer address',
    producer_name_phrase:
      'Phrase immediately preceding producer name/address (e.g., "Bottled By", "Imported By", "Imported by", "DISTRIBUTED AND IMPORTED BY", "Distributed and Imported By", or null if no such phrase). For imported beverages, extract phrases like "Imported By" or "DISTRIBUTED AND IMPORTED BY" if present.',
    health_warning: 'Government health warning statement (must be exact)',
  };

  if (beverageType === 'spirits') {
    fieldDefinitions.age_statement = 'Age statement (if applicable)';
    fieldDefinitions.country_of_origin = 'Country of origin (if imported)';
  } else if (beverageType === 'wine') {
    fieldDefinitions.appellation_of_origin = 'Appellation of origin (if applicable)';
    fieldDefinitions.sulfite_declaration = 'Sulfite declaration';
    fieldDefinitions.country_of_origin = 'Country of origin (if imported)';
  } else if (beverageType === 'beer') {
    fieldDefinitions.sulfite_declaration = 'Sulfite declaration (if applicable)';
    fieldDefinitions.country_of_origin = 'Country of origin (if imported)';
  }

  const fieldsList = Object.entries(fieldDefinitions)
    .map(([key, desc]) => `- ${key}: ${desc}`)
    .join('\n');

  // Get beverage-specific instructions
  const beverageSpecificInstructions = getBeverageSpecificInstructions(beverageType);

  // Calculate timeout based on number of images (30 seconds per image, max 2 minutes)
  const timeoutMs = Math.min(TIMEOUT_MS * images.length, 120000);

  return retryWithBackoff(async () => {
    try {
      const client = getOpenAIClient();

      // Build content array with text prompt and all images
      const content: Array<
        { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
      > = [
        {
          type: 'text',
          text: `Extract all label information from these ${images.length} label image(s) (front, back, neck, side, etc.). Look for all fields across ALL images - information may be spread across different label panels. Pay special attention to the health warning - extract it exactly as shown on the label, preserving the capitalization and formatting as it appears.`,
        },
      ];

      // Add all images to the content array
      for (const dataUrl of imageDataUrls) {
        content.push({
          type: 'image_url',
          image_url: {
            url: dataUrl,
          },
        });
      }

      // Race between API call and timeout
      const apiCall = client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting structured data from alcohol beverage labels. Extract the following fields from the label images and return them as JSON. Look across ALL provided images to find each field - information may be spread across front, back, neck, or side labels. If a field is not found in any image, omit it from the response.

IMPORTANT - Preserve exact capitalization for ALL fields:
- CRITICAL: For EVERY field (brand_name, fanciful_name, class_type, producer_name, producer_address, appellation_of_origin, country_of_origin, etc.), preserve the exact capitalization as it appears on the label
- If ANY field appears in ALL CAPS on the label (e.g., "FAR MOUNTAIN", "MOON MOUNTAIN DISTRICT SONOMA COUNTY"), extract it as ALL CAPS
- If ANY field appears in Title Case (e.g., "Far Mountain", "Moon Mountain District Sonoma County"), extract it as Title Case
- Do NOT normalize or change capitalization - extract exactly as shown on the label for all fields

For the health_warning field, extract the EXACT text as it appears on the label.

CRITICAL FOR ALCOHOL_CONTENT FIELD - EXTRACT COMPLETE TEXT INCLUDING PREFIXES:
- You MUST extract the COMPLETE text exactly as shown on the label, including ALL prefix words that appear before the percentage
- Common prefixes include: "ALC.", "ALCOHOL", "ABV", "Alc.", "Alcohol", etc.
- DO NOT extract just the percentage and suffix - you MUST include the prefix if it appears on the label
- Examples of CORRECT extraction:
  * If label shows "ALC. 12.5% BY VOL." → extract "ALC. 12.5% BY VOL." (NOT "12.5% BY VOL.")
  * If label shows "ALCOHOL 14% BY VOLUME" → extract "ALCOHOL 14% BY VOLUME" (NOT "14% BY VOLUME")
  * If label shows "12.5% Alc/Vol" → extract "12.5% Alc/Vol" (complete as shown)
  * If label shows "Alc. 13.5% by Vol." → extract "Alc. 13.5% by Vol." (NOT "13.5% by Vol.")
- This is CRITICAL - omitting the prefix will cause validation failures

CRITICAL FOR IMPORTED BEVERAGES - PRODUCER NAME/ADDRESS:
- If the label indicates the beverage is imported (look for phrases like "Imported By", "Imported by", "DISTRIBUTED AND IMPORTED BY", "Distributed and Imported By", "Imported and Distributed By", or country of origin indicating foreign production), you MUST extract the US importer/distributor name and address, NOT the foreign producer.
- The importer/distributor name/address appears IMMEDIATELY after phrases like "Imported By" or "DISTRIBUTED AND IMPORTED BY".
- The foreign producer information may also appear on the label, but you should IGNORE it and extract only the US importer/distributor.
- Example: If you see "DISTRIBUTED AND IMPORTED BY Geo US Trading, Inc, Lombard, IL" followed by "LTD WINIVERIA., 2200. VILLAGE VARDISUBANI, TELAVI, GEORGIA", extract "Geo US Trading, Inc, Lombard, IL" as producer_name/producer_address, NOT "LTD WINIVERIA..." (which is the foreign producer).

${beverageSpecificInstructions}

Fields to extract:
${fieldsList}

Return JSON in this format:
{
  "brand_name": "...",
  "alcohol_content": "...",
  ...
}`,
          },
          {
            role: 'user',
            content,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      });

      const response = await Promise.race([apiCall, createTimeoutPromise(timeoutMs)]);

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new OpenAIAPIError('No response content from OpenAI API');
      }

      let parsed;
      try {
        parsed = JSON.parse(responseContent);
      } catch (parseError) {
        throw new OpenAIAPIError(
          `Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        );
      }

      const extractedData: ExtractedData = {};

      // Convert response to ExtractedData format
      for (const [key, value] of Object.entries(parsed)) {
        // Handle both old format (with confidence) and new format (direct values)
        if (value && typeof value === 'object' && 'value' in value) {
          // Old format with confidence - extract just the value
          extractedData[key] = {
            value: String(value.value),
            confidence: 0, // Default confidence, not used
          };
        } else if (value !== null && value !== undefined) {
          // New format - direct value
          extractedData[key] = {
            value: String(value),
            confidence: 0, // Default confidence, not used
          };
        }
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        extractedData,
        processingTimeMs,
      };
    } catch (error) {
      // Transform OpenAI SDK errors into our custom error types
      if (error instanceof OpenAITimeoutError || error instanceof OpenAIAPIKeyError) {
        throw error;
      }

      if (error instanceof Error) {
        // Check for network errors
        if (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('ECONNREFUSED')
        ) {
          throw new OpenAINetworkError(`Network error: ${error.message}`);
        }

        // Check for timeout errors
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          throw new OpenAITimeoutError(`Request timed out: ${error.message}`);
        }

        // Check for API key errors
        if (
          error.message.includes('API key') ||
          error.message.includes('authentication') ||
          error.message.includes('401')
        ) {
          throw new OpenAIAPIKeyError(`Invalid or missing API key: ${error.message}`);
        }

        // Check for rate limit errors
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new OpenAIAPIError(`Rate limit exceeded. Please try again later.`, 429);
        }

        // Check for other API errors
        if (error.message.includes('OpenAI') || error.message.includes('API')) {
          throw new OpenAIAPIError(`OpenAI API error: ${error.message}`);
        }
      }

      // Re-throw unknown errors
      throw error;
    }
  });
}
