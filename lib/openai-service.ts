import OpenAI from 'openai';
import type { ExtractedData } from '@/types/database';

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
 * Extract label data from an image using GPT-4o vision
 */
export async function extractLabelData(
  imageBuffer: Buffer,
  mimeType: string,
  beverageType: 'spirits' | 'wine' | 'beer'
): Promise<{ extractedData: ExtractedData; confidence: number; processingTimeMs: number }> {
  const startTime = Date.now();

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  // Define fields to extract based on beverage type
  const fieldDefinitions: Record<string, string> = {
    brand_name: 'Brand name',
    class_type: 'Class/type designation',
    alcohol_content: 'Alcohol content percentage',
    net_contents: 'Net contents (volume)',
    producer_name: 'Producer name',
    producer_address: 'Producer address',
    producer_name_phrase:
      'Phrase immediately preceding producer name/address (e.g., "Bottled By", "Imported By", "Imported by", or null if no such phrase)',
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

  return retryWithBackoff(async () => {
    try {
      const client = getOpenAIClient();

      // Race between API call and timeout
      const apiCall = client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting structured data from alcohol beverage labels. Extract the following fields from the label image and return them as JSON with confidence scores (0-1) for each field. If a field is not found, omit it from the response. For the health_warning field, extract the EXACT text as it appears on the label.

Fields to extract:
${fieldsList}

Return JSON in this format:
{
  "brand_name": { "value": "...", "confidence": 0.95 },
  "alcohol_content": { "value": "...", "confidence": 0.92 },
  ...
}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all label information from this image. Pay special attention to the health warning - extract it exactly as shown on the label, preserving the capitalization and formatting as it appears.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      });

      const response = await Promise.race([apiCall, createTimeoutPromise(TIMEOUT_MS)]);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new OpenAIAPIError('No response content from OpenAI API');
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        throw new OpenAIAPIError(
          `Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        );
      }

      const extractedData: ExtractedData = {};

      // Convert response to ExtractedData format
      for (const [key, value] of Object.entries(parsed)) {
        if (value && typeof value === 'object' && 'value' in value && 'confidence' in value) {
          extractedData[key] = {
            value: String(value.value),
            confidence: Number(value.confidence),
          };
        }
      }

      // Calculate overall confidence (average of all field confidences)
      const confidences = Object.values(extractedData).map((f) => f.confidence);
      const overallConfidence =
        confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

      const processingTimeMs = Date.now() - startTime;

      return {
        extractedData,
        confidence: overallConfidence,
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
