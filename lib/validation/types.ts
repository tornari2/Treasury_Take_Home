// ============================================================
// TTB Label Validation Types
// ============================================================

/**
 * Beverage types supported by TTB
 */
export enum BeverageType {
  BEER = "beer",
  WINE = "wine",
  SPIRITS = "spirits",
}

/**
 * Origin type - indicates whether beverage is domestic or imported
 */
export enum OriginType {
  DOMESTIC = "domestic",
  IMPORTED = "imported",
}

/**
 * Match status for field validation
 */
export enum MatchStatus {
  MATCH = "match",
  SOFT_MISMATCH = "soft_mismatch",
  HARD_MISMATCH = "hard_mismatch",
  NOT_FOUND = "not_found",
  NOT_APPLICABLE = "not_applicable",
  SURFACED = "surfaced",
}

/**
 * Application data from database or manual entry
 */
export interface ApplicationData {
  id: string;
  ttbId?: string | null; // TTB ID for the application

  // Basic Info
  beverageType: BeverageType;
  originType: OriginType; // Whether the beverage is domestic or imported

  // Fields to cross-check against label (all beverage types)
  brandName: string;
  fancifulName?: string | null;
  producerName: string;
  producerAddress: {
    city: string;
    state: string;
  };

  // Wine-specific cross-check fields
  appellation?: string | null;
  varietal?: string | null; // e.g., "Chardonnay", "Cabernet Sauvignon"
  vintageDate?: string | null; // e.g., "2019", "2021"

  // Additional notes/other information
  other?: string | null;

  // Pre-loaded label images (1 to N images)
  labelImages: string[]; // Array of image URLs or base64 strings
}

/**
 * AI extraction result for BEER
 */
export interface BeerExtractionResult {
  extraction: {
    // Validated fields
    brandName: string | null;
    fancifulName: string | null;
    classType: string | null;
    netContents: string | null;
    producerName: string | null;
    producerAddress: string | null;
    producerNamePhrase: string | null; // Phrase preceding producer name (e.g., "Bottled By", "Imported By")
    healthWarningText: string | null;
    countryOfOrigin: string | null;
    alcoholContent: string | null; // Validated with warning if missing (not hard failure)

    // Surfaced fields (displayed but not validated)
    colorAdditiveDisclosure: string | null;
    sulfiteDeclaration: string | null;
    aspartameDeclaration: string | null;
  };

  formatChecks: {
    governmentWarningAllCaps: boolean | null;
    governmentWarningBold: boolean | null;
    remainderBold: boolean | null; // Remainder of warning (after "GOVERNMENT WARNING:") should NOT be bold
    surgeonCapitalized: boolean | null;
    generalCapitalized: boolean | null;
  };

  confidenceNotes: string | null;
}

/**
 * AI extraction result for SPIRITS
 */
export interface SpiritsExtractionResult {
  extraction: {
    // Validated fields
    brandName: string | null;
    fancifulName: string | null;
    classType: string | null;
    alcoholContent: string | null;
    netContents: string | null;
    producerName: string | null;
    producerAddress: string | null;
    producerNamePhrase: string | null; // Phrase preceding producer name (e.g., "Bottled By", "Imported By")
    healthWarningText: string | null;
    countryOfOrigin: string | null;
    ageStatement: string | null; // Conditionally required for spirits

    // Surfaced fields (displayed but not validated)
    colorIngredientDisclosure: string | null;
    commodityStatement: string | null;
  };

  formatChecks: {
    governmentWarningAllCaps: boolean | null;
    governmentWarningBold: boolean | null;
    remainderBold: boolean | null; // Remainder of warning (after "GOVERNMENT WARNING:") should NOT be bold
    surgeonCapitalized: boolean | null;
    generalCapitalized: boolean | null;
  };

  confidenceNotes: string | null;
}

/**
 * AI extraction result for WINE
 */
export interface WineExtractionResult {
  extraction: {
    // Validated fields
    brandName: string | null;
    classType: string | null; // Also known as varietal (e.g., "Chardonnay")
    alcoholContent: string | null;
    netContents: string | null;
    producerName: string | null;
    producerAddress: string | null;
    producerNamePhrase: string | null; // Phrase preceding producer name (e.g., "Bottled By", "Imported By")
    healthWarningText: string | null;
    countryOfOrigin: string | null;
    appellation: string | null;
    vintageDate: string | null; // Cross-checked against application
    sulfiteDeclaration: string | null; // REQUIRED for wine
    foreignWinePercentage: string | null; // Required if label references foreign wine

    // For appellation requirement detection
    isEstateBottled: boolean | null; // True if "Estate Bottled" appears on label

    // Surfaced fields (displayed but not validated)
    colorIngredientDisclosure: string | null;
  };

  formatChecks: {
    governmentWarningAllCaps: boolean | null;
    governmentWarningBold: boolean | null;
    remainderBold: boolean | null; // Remainder of warning (after "GOVERNMENT WARNING:") should NOT be bold
    surgeonCapitalized: boolean | null;
    generalCapitalized: boolean | null;
  };

  confidenceNotes: string | null;
}

/**
 * Union type for all extraction results
 */
export type AIExtractionResult =
  | BeerExtractionResult
  | SpiritsExtractionResult
  | WineExtractionResult;

/**
 * Result for a single field validation
 */
export interface FieldValidationResult {
  field: string;
  status: MatchStatus;
  expected: string | null;
  extracted: string | null;
  rule: string;
  details?: string;
}

/**
 * Surfaced field (displayed but not validated)
 */
export interface SurfacedField {
  field: string;
  value: string | null;
  present: boolean;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  applicationId: string;
  beverageType: BeverageType;
  overallStatus: MatchStatus;
  fieldResults: FieldValidationResult[];
  surfacedFields: SurfacedField[];
  timestamp: string;
  processingTimeMs: number;
}
