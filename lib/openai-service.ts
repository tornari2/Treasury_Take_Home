import OpenAI from 'openai';
import type { ExtractedData } from '@/types/database';

// Lazy initialization to avoid requiring API key during build time
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.'
      );
    }
    openai = new OpenAI({
      apiKey,
    });
  }
  return openai;
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

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
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
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}
