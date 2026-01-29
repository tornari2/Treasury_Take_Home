// ============================================================
// TTB Label Verification Module
// Uses validation module as the source of truth for validation rules
// ============================================================

import {
  ApplicationData,
  AIExtractionResult,
  BeerExtractionResult,
  SpiritsExtractionResult,
  WineExtractionResult,
  validateLabel,
  determineApplicationStatus as determineStatusFromValidation,
} from './validation';
import type { ExtractedData, VerificationResult } from '@/types/database';

/**
 * Convert ExtractedData to AIExtractionResult format
 * This converts the legacy extraction format to the new validation format
 */
function convertToAIExtractionResult(
  beverageType: 'spirits' | 'wine' | 'beer',
  extractedData: ExtractedData
): AIExtractionResult {
  const getValue = (key: string): string | null => {
    const field = extractedData[key];
    return field?.value || null;
  };

  const baseExtraction = {
    brandName: getValue('brand_name'),
    fancifulName: getValue('fanciful_name'),
    classType: getValue('class_type'),
    alcoholContent: getValue('alcohol_content'),
    netContents: getValue('net_contents'),
    producerName: getValue('producer_name'),
    producerAddress: getValue('producer_address'),
    producerNamePhrase: getValue('producer_name_phrase'),
    healthWarningText: getValue('health_warning'),
    countryOfOrigin: getValue('country_of_origin'),
  };

  const formatChecks = {
    governmentWarningAllCaps: null, // Not available in current extraction
    governmentWarningBold: null,
    surgeonCapitalized: null,
    generalCapitalized: null,
  };

  const confidenceNotes = null;

  switch (beverageType) {
    case 'beer':
      return {
        extraction: {
          ...baseExtraction,
          colorAdditiveDisclosure: getValue('color_additive_disclosure'),
          sulfiteDeclaration: getValue('sulfite_declaration'),
          aspartameDeclaration: getValue('aspartame_declaration'),
        },
        formatChecks,
        confidenceNotes,
      } as BeerExtractionResult;

    case 'spirits':
      return {
        extraction: {
          ...baseExtraction,
          ageStatement: getValue('age_statement'),
          colorIngredientDisclosure: getValue('color_ingredient_disclosure'),
          commodityStatement: getValue('commodity_statement'),
        },
        formatChecks,
        confidenceNotes,
      } as SpiritsExtractionResult;

    case 'wine':
      return {
        extraction: {
          ...baseExtraction,
          appellation: getValue('appellation_of_origin'),
          vintageDate: null, // Vintage no longer extracted from labels
          sulfiteDeclaration: getValue('sulfite_declaration'),
          foreignWinePercentage: getValue('foreign_wine_percentage'),
          isEstateBottled: null, // Not in current extraction
          colorIngredientDisclosure: getValue('color_ingredient_disclosure'),
        },
        formatChecks,
        confidenceNotes,
      } as WineExtractionResult;

    default:
      throw new Error(`Unknown beverage type: ${beverageType}`);
  }
}

/**
 * Convert ValidationResult to legacy VerificationResult format
 * This maintains backward compatibility with existing API responses
 */
function convertToVerificationResult(validationResult: {
  fieldResults: Array<{
    field: string;
    status: any;
    expected: string | null;
    extracted: string | null;
  }>;
}): VerificationResult {
  const result: VerificationResult = {};

  for (const fieldResult of validationResult.fieldResults) {
    // Map field names from camelCase to snake_case
    const fieldName = mapFieldName(fieldResult.field);

    // Map MatchStatus to legacy type
    let type: 'match' | 'soft_mismatch' | 'hard_mismatch' | 'not_found' | 'not_applicable';
    switch (fieldResult.status) {
      case 'match':
        type = 'match';
        break;
      case 'soft_mismatch':
        type = 'soft_mismatch';
        break;
      case 'hard_mismatch':
      case 'not_found':
        type = fieldResult.status === 'not_found' ? 'not_found' : 'hard_mismatch';
        break;
      case 'not_applicable':
        type = 'not_applicable';
        break;
      default:
        type = 'match'; // SURFACED treated as match for legacy compatibility
    }

    result[fieldName] = {
      match: type === 'match' || type === 'not_applicable',
      type,
      expected: fieldResult.expected || undefined,
      extracted: fieldResult.extracted || undefined,
    };
  }

  return result;
}

/**
 * Map field names from new validation module to legacy format
 */
function mapFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    brandName: 'brand_name',
    fancifulName: 'fanciful_name',
    classType: 'class_type',
    alcoholContent: 'alcohol_content',
    netContents: 'net_contents',
    producerNameAddress: 'producer_name_address', // Combined field
    healthWarning: 'health_warning',
    countryOfOrigin: 'country_of_origin',
    appellation: 'appellation_of_origin',
    vintageDate: 'vintage_date',
    sulfiteDeclaration: 'sulfite_declaration',
    ageStatement: 'age_statement',
    foreignWinePercentage: 'foreign_wine_percentage',
  };

  return (
    fieldMap[field] ||
    field
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  );
}

/**
 * Verify application using the new validation module
 * Now uses ApplicationData directly instead of converting from ExpectedLabelData
 */
export function verifyApplication(
  applicationData: ApplicationData,
  extractedData: ExtractedData
): VerificationResult {
  try {
    // Convert extraction to new format
    const aiResult = convertToAIExtractionResult(applicationData.beverageType, extractedData);

    // Run validation using new module
    const validationResult = validateLabel(applicationData, aiResult);

    // Convert back to legacy format for API compatibility
    return convertToVerificationResult(validationResult);
  } catch (error) {
    console.error('Verification error:', error);
    // Return empty result on error
    return {};
  }
}

/**
 * Determine overall application status based on verification results
 * Maintains backward compatibility with legacy VerificationResult format
 */
export function determineApplicationStatus(
  verificationResult: VerificationResult
): 'pending' | 'needs_review' | 'approved' | 'rejected' {
  const results = Object.values(verificationResult);

  // Check for hard mismatches or not found
  const hasHardMismatch = results.some((r) => r.type === 'hard_mismatch' || r.type === 'not_found');

  // Check for soft mismatches
  const hasSoftMismatch = results.some((r) => r.type === 'soft_mismatch');

  // Hard mismatches or missing fields - needs agent review (stays pending)
  if (hasHardMismatch) {
    return 'pending';
  }

  // Soft mismatches - stays pending (no longer flagged for review)
  if (hasSoftMismatch) {
    return 'pending';
  }

  // All match - ready for agent approval (stays pending until agent approves)
  return 'pending';
}

// Re-export utility functions for backward compatibility
export { normalizeString as normalizeText } from './validation';
