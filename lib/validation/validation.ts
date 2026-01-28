// ============================================================
// Main Validation Functions
// ============================================================

import {
  BeverageType,
  MatchStatus,
  ApplicationData,
  AIExtractionResult,
  BeerExtractionResult,
  SpiritsExtractionResult,
  WineExtractionResult,
  ValidationResult,
  FieldValidationResult,
} from './types';
import {
  validateBrandName,
  validateFancifulName,
  validateClassType,
  validateAlcoholContent,
  validateNetContents,
  validateProducerNameAddress,
  validateHealthWarning,
  validateCountryOfOrigin,
} from './validators/common';
import { validateAgeStatement } from './validators/spirits';
import {
  validateAppellation,
  validateWineVarietal,
  validateVintageDate,
  validateSulfiteDeclaration,
  validateForeignWinePercentage,
} from './validators/wine';
import {
  extractBeerSurfacedFields,
  extractSpiritsSurfacedFields,
  extractWineSurfacedFields,
} from './surfaced';

/**
 * Calculate overall validation status based on field results
 * @param fieldResults - Array of field validation results
 * @param nonFailingFields - Optional array of field names where NOT_FOUND doesn't cause overall failure
 */
export function calculateOverallStatus(
  fieldResults: FieldValidationResult[],
  nonFailingFields: string[] = []
): MatchStatus {
  const applicableResults = fieldResults.filter((r) => r.status !== MatchStatus.NOT_APPLICABLE);

  // Check for hard mismatches, excluding non-failing fields from NOT_FOUND check
  const hasHardMismatch = applicableResults.some((r) => {
    if (r.status === MatchStatus.HARD_MISMATCH) {
      return true;
    }
    if (r.status === MatchStatus.NOT_FOUND) {
      // NOT_FOUND only causes failure if field is not in nonFailingFields list
      return !nonFailingFields.includes(r.field);
    }
    return false;
  });

  if (hasHardMismatch) {
    return MatchStatus.HARD_MISMATCH;
  }

  const hasSoftMismatch = applicableResults.some((r) => r.status === MatchStatus.SOFT_MISMATCH);
  if (hasSoftMismatch) {
    return MatchStatus.SOFT_MISMATCH;
  }

  return MatchStatus.MATCH;
}

/**
 * Validate a BEER label
 */
export function validateBeerLabel(
  application: ApplicationData,
  aiResult: BeerExtractionResult
): ValidationResult {
  const startTime = Date.now();
  const fieldResults: FieldValidationResult[] = [];
  const { extraction, formatChecks } = aiResult;

  // Validated fields
  fieldResults.push(validateBrandName(application, extraction.brandName));
  fieldResults.push(validateFancifulName(application, extraction.fancifulName));
  fieldResults.push(validateClassType(extraction.classType));
  fieldResults.push(validateNetContents(extraction.netContents));
  fieldResults.push(
    validateProducerNameAddress(application, extraction.producerName, extraction.producerAddress)
  );
  fieldResults.push(validateHealthWarning(extraction.healthWarningText, formatChecks));
  fieldResults.push(validateCountryOfOrigin(application.originCode, extraction.countryOfOrigin));
  fieldResults.push(validateAlcoholContent(extraction.alcoholContent)); // Surfaced if missing, but doesn't fail

  // Surfaced fields
  const surfacedFields = extractBeerSurfacedFields(extraction);

  // For beer, alcohol content NOT_FOUND doesn't cause overall failure
  const nonFailingFields = ['alcoholContent'];

  return {
    applicationId: application.id,
    beverageType: BeverageType.BEER,
    overallStatus: calculateOverallStatus(fieldResults, nonFailingFields),
    fieldResults,
    surfacedFields,
    timestamp: new Date().toISOString(),
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Validate a SPIRITS label
 */
export function validateSpiritsLabel(
  application: ApplicationData,
  aiResult: SpiritsExtractionResult
): ValidationResult {
  const startTime = Date.now();
  const fieldResults: FieldValidationResult[] = [];
  const { extraction, formatChecks } = aiResult;

  // Validated fields
  fieldResults.push(validateBrandName(application, extraction.brandName));
  fieldResults.push(validateFancifulName(application, extraction.fancifulName));
  fieldResults.push(validateClassType(extraction.classType));
  fieldResults.push(validateAlcoholContent(extraction.alcoholContent));
  fieldResults.push(validateNetContents(extraction.netContents));
  fieldResults.push(
    validateProducerNameAddress(application, extraction.producerName, extraction.producerAddress)
  );
  fieldResults.push(validateHealthWarning(extraction.healthWarningText, formatChecks));
  fieldResults.push(validateCountryOfOrigin(application.originCode, extraction.countryOfOrigin));
  fieldResults.push(validateAgeStatement(extraction.ageStatement)); // REQUIRED for spirits

  // Surfaced fields
  const surfacedFields = extractSpiritsSurfacedFields(extraction);

  return {
    applicationId: application.id,
    beverageType: BeverageType.SPIRITS,
    overallStatus: calculateOverallStatus(fieldResults),
    fieldResults,
    surfacedFields,
    timestamp: new Date().toISOString(),
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Validate a WINE label
 */
export function validateWineLabel(
  application: ApplicationData,
  aiResult: WineExtractionResult
): ValidationResult {
  const startTime = Date.now();
  const fieldResults: FieldValidationResult[] = [];
  const { extraction, formatChecks } = aiResult;

  // Validated fields
  fieldResults.push(validateBrandName(application, extraction.brandName));
  fieldResults.push(validateFancifulName(application, extraction.fancifulName));
  fieldResults.push(validateWineVarietal(application, extraction.classType)); // Cross-check varietal
  fieldResults.push(validateAlcoholContent(extraction.alcoholContent));
  fieldResults.push(validateNetContents(extraction.netContents));
  fieldResults.push(
    validateProducerNameAddress(application, extraction.producerName, extraction.producerAddress)
  );
  fieldResults.push(validateHealthWarning(extraction.healthWarningText, formatChecks));
  fieldResults.push(validateCountryOfOrigin(application.originCode, extraction.countryOfOrigin));
  fieldResults.push(validateAppellation(application, extraction)); // Now takes full extraction for context
  fieldResults.push(validateVintageDate(application, extraction.vintageDate)); // Cross-check vintage
  fieldResults.push(validateSulfiteDeclaration(extraction.sulfiteDeclaration)); // REQUIRED for wine
  fieldResults.push(validateForeignWinePercentage(extraction)); // Required if label references foreign wine

  // Surfaced fields
  const surfacedFields = extractWineSurfacedFields(extraction);

  return {
    applicationId: application.id,
    beverageType: BeverageType.WINE,
    overallStatus: calculateOverallStatus(fieldResults),
    fieldResults,
    surfacedFields,
    timestamp: new Date().toISOString(),
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Main validation function - routes to beverage-specific validator
 */
export function validateLabel(
  application: ApplicationData,
  aiResult: AIExtractionResult
): ValidationResult {
  switch (application.beverageType) {
    case BeverageType.BEER:
      return validateBeerLabel(application, aiResult as BeerExtractionResult);
    case BeverageType.SPIRITS:
      return validateSpiritsLabel(application, aiResult as SpiritsExtractionResult);
    case BeverageType.WINE:
      return validateWineLabel(application, aiResult as WineExtractionResult);
    default:
      throw new Error(`Unknown beverage type: ${application.beverageType}`);
  }
}

/**
 * Determine application status based on validation result
 */
export function determineApplicationStatus(
  validationResult: ValidationResult
): 'pending' | 'needs_review' | 'approved' | 'rejected' {
  switch (validationResult.overallStatus) {
    case MatchStatus.MATCH:
      return 'pending';
    case MatchStatus.SOFT_MISMATCH:
      return 'needs_review';
    case MatchStatus.HARD_MISMATCH:
    case MatchStatus.NOT_FOUND:
      return 'pending';
    default:
      return 'pending';
  }
}
