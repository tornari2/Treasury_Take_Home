// ============================================================
// TTB Validation Utility Functions
// ============================================================

import {
  REQUIRED_HEALTH_WARNING,
  US_STATE_MAP,
  US_STATE_REVERSE_MAP,
  SPIRITS_STANDARDS_OF_FILL_ML,
  WINE_STANDARDS_OF_FILL_ML,
} from './constants';

/**
 * Normalize string for comparison (trim, collapse whitespace, lowercase)
 */
export function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Normalize string preserving case (trim, collapse whitespace only)
 */
export function normalizeWhitespace(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Check if two strings match (case-insensitive, normalized)
 */
export function stringsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeString(a) === normalizeString(b);
}

/**
 * Check if two strings are a soft mismatch (same when normalized, different in original)
 */
export function isSoftMismatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  const normalizedMatch = normalizeString(a) === normalizeString(b);
  const exactMatch = normalizeWhitespace(a) === normalizeWhitespace(b);
  return normalizedMatch && !exactMatch;
}

/**
 * Check if a string matches any of the given regex patterns
 */
export function matchesAnyPattern(str: string | null | undefined, patterns: RegExp[]): boolean {
  if (!str) return false;
  return patterns.some((pattern) => pattern.test(str.trim()));
}

/**
 * Check if a value exists (not null, undefined, or empty string)
 */
export function valueExists(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() !== '';
}

/**
 * Check if health warning text matches EXACTLY (with whitespace flexibility only)
 * The ENTIRE government warning must appear exactly on the label
 */
export function healthWarningMatchesExact(extracted: string | null | undefined): boolean {
  if (!extracted) return false;
  return normalizeWhitespace(extracted) === normalizeWhitespace(REQUIRED_HEALTH_WARNING);
}

/**
 * Normalize state name or abbreviation to a canonical form
 * State names and two-letter abbreviations are EQUIVALENT
 * Example: "ME" = "Maine" = "maine" = "MAINE"
 * Returns the normalized lowercase state name (full name preferred)
 */
export function normalizeState(state: string | null | undefined): string {
  if (!state) return '';

  const normalized = normalizeString(state);
  if (!normalized) return '';

  // Check if it's already a normalized state name
  if (US_STATE_REVERSE_MAP[normalized]) {
    return normalized; // Already a full state name
  }

  // Check if it's an abbreviation (case-insensitive)
  const upperAbbr = normalized.toUpperCase();
  if (US_STATE_MAP[upperAbbr]) {
    return US_STATE_MAP[upperAbbr]; // Convert abbreviation to full name
  }

  // Return normalized form (might be a partial match or unknown state)
  return normalized;
}

/**
 * Check if two state values are equivalent
 * Handles state name/abbreviation equivalence
 * Example: "ME" matches "Maine", "California" matches "CA"
 */
export function statesMatch(
  state1: string | null | undefined,
  state2: string | null | undefined
): boolean {
  if (!state1 || !state2) return false;

  const normalized1 = normalizeState(state1);
  const normalized2 = normalizeState(state2);

  // Direct match after normalization
  if (normalized1 === normalized2) return true;

  // Cross-check: if one is abbreviation and other is full name
  const upper1 = state1.trim().toUpperCase();
  const upper2 = state2.trim().toUpperCase();

  // Check if state1 is abbreviation and matches state2's full name
  if (US_STATE_MAP[upper1] && US_STATE_MAP[upper1] === normalized2) return true;

  // Check if state2 is abbreviation and matches state1's full name
  if (US_STATE_MAP[upper2] && US_STATE_MAP[upper2] === normalized1) return true;

  return false;
}

/**
 * Parse net contents value and convert to milliliters for comparison
 * Returns the volume in mL, or null if parsing fails
 */
export function parseNetContentsToML(value: string | null): number | null {
  if (!value) return null;

  const normalized = value.trim();

  // Extract numeric value
  const numberMatch = normalized.match(/^(\d+(?:\.\d+)?)/);
  if (!numberMatch) return null;

  const numericValue = parseFloat(numberMatch[1]);
  if (isNaN(numericValue)) return null;

  // Check for liters (L, liter, litre, etc.)
  if (
    /^\d+(\.\d+)?\s*[Ll]\.?$/.test(normalized) ||
    /^\d+(\.\d+)?\s*[Ll]iter(s)?$/i.test(normalized) ||
    /^\d+(\.\d+)?\s*[Ll]itre(s)?$/i.test(normalized)
  ) {
    return numericValue * 1000; // Convert liters to milliliters
  }

  // Check for milliliters (mL, ml, etc.)
  if (/^\d+(\.\d+)?\s*m[Ll]\.?$/i.test(normalized)) {
    return numericValue; // Already in milliliters
  }

  // If we can't determine unit, return null
  return null;
}

/**
 * Check if a volume (in mL) matches authorized standards of fill for spirits
 */
export function isValidSpiritsStandardOfFill(volumeML: number | null): boolean {
  if (volumeML === null) return false;

  // Check against authorized standards (allow small tolerance for floating point)
  return SPIRITS_STANDARDS_OF_FILL_ML.some((standard) => Math.abs(volumeML - standard) < 0.01);
}

/**
 * Check if a volume (in mL) matches authorized standards of fill for wine
 * Note: Sizes larger than 3 liters (3000 mL) are allowed in even liters
 */
export function isValidWineStandardOfFill(volumeML: number | null): boolean {
  if (volumeML === null) return false;

  // Check against authorized standards (allow small tolerance for floating point)
  if (WINE_STANDARDS_OF_FILL_ML.some((standard) => Math.abs(volumeML - standard) < 0.01)) {
    return true;
  }

  // For sizes larger than 3 liters, check if it's an even number of liters
  // (4000, 5000, 6000, etc.)
  if (volumeML >= 4000) {
    const liters = volumeML / 1000;
    // Check if it's an even integer (4, 5, 6, etc.)
    return liters >= 4 && Number.isInteger(liters) && liters % 1 === 0;
  }

  return false;
}

/**
 * Parse alcohol percentage from alcohol content string
 * Returns the numeric percentage value, or null if parsing fails
 * Examples: "5% Alc/Vol" -> 5, "13.5% Alcohol by Volume" -> 13.5
 */
export function parseAlcoholPercentage(value: string | null): number | null {
  if (!value) return null;

  // Extract numeric value (with optional decimal)
  const numberMatch = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!numberMatch) return null;

  const numericValue = parseFloat(numberMatch[1]);
  return isNaN(numericValue) ? null : numericValue;
}

/**
 * Check if text contains beer special alcohol terms
 * Returns object with detected terms
 */
export function detectBeerAlcoholTerms(
  alcoholContent: string | null,
  classType: string | null,
  brandName: string | null,
  fancifulName: string | null
): {
  hasLowAlcohol: boolean;
  hasReducedAlcohol: boolean;
  hasNonAlcoholic: boolean;
  hasAlcoholFree: boolean;
} {
  const allText = [alcoholContent, classType, brandName, fancifulName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    hasLowAlcohol: /\blow\s+alcohol\b/i.test(allText),
    hasReducedAlcohol: /\breduced\s+alcohol\b/i.test(allText),
    hasNonAlcoholic: /\bnon[-\s]?alcoholic\b/i.test(allText),
    hasAlcoholFree: /\balcohol[-\s]?free\b/i.test(allText),
  };
}

/**
 * Check if wine class type indicates "table wine" or "light wine"
 */
export function isTableWineOrLightWine(classType: string | null): boolean {
  if (!classType) return false;
  const normalized = normalizeString(classType);
  return (
    normalized.includes('table wine') ||
    normalized.includes('light wine') ||
    normalized === 'table wine' ||
    normalized === 'light wine'
  );
}
