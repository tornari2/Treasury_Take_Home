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
 * Normalize business entity suffixes for comparison
 * Removes common business entity suffixes: CO, CO., COMPANY, LLC, INC, INC., INCORPORATED, LTD, LIMITED
 * Handles multiple suffixes (e.g., "Co LLC" -> removes both)
 */
function normalizeBusinessEntitySuffix(str: string): string {
  // Remove all common business entity suffixes (case-insensitive, can be multiple)
  // Keep removing until no more suffixes found
  let result = str.trim();
  let previousResult = '';

  while (result !== previousResult) {
    previousResult = result;
    result = result
      .replace(/\s*(co\.?|company|llc|inc\.?|incorporated|ltd\.?|limited)\s*$/i, '')
      .trim();
  }

  return result;
}

/**
 * Check if two strings match (case-insensitive, normalized)
 * For producer names, also normalizes business entity suffixes
 */
export function stringsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
  options?: { normalizeEntitySuffix?: boolean }
): boolean {
  const normalizedA = normalizeString(a);
  const normalizedB = normalizeString(b);

  // If entity suffix normalization is requested, compare without suffixes
  if (options?.normalizeEntitySuffix && a && b) {
    const aWithoutSuffix = normalizeBusinessEntitySuffix(normalizedA);
    const bWithoutSuffix = normalizeBusinessEntitySuffix(normalizedB);
    return aWithoutSuffix === bWithoutSuffix;
  }

  return normalizedA === normalizedB;
}

/**
 * Check if two producer names match when ignoring entity suffixes
 * Returns true if the core business name matches (ignoring entity type suffixes)
 */
export function producerNamesMatchIgnoringEntitySuffix(
  expected: string | null | undefined,
  extracted: string | null | undefined
): boolean {
  if (!expected || !extracted) return false;

  const normalizedExpected = normalizeString(expected);
  const normalizedExtracted = normalizeString(extracted);

  const expectedWithoutSuffix = normalizeBusinessEntitySuffix(normalizedExpected);
  const extractedWithoutSuffix = normalizeBusinessEntitySuffix(normalizedExtracted);

  return expectedWithoutSuffix === extractedWithoutSuffix;
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
 * Parse US customary net contents value and convert to fluid ounces for comparison
 * Returns the volume in fl oz, or null if parsing fails
 * Handles complex formats like "1 pint 8 fl oz", "2 quarts 1 pint", etc.
 * Conversion factors:
 * - 1 pint = 16 fl oz
 * - 1 quart = 32 fl oz
 * - 1 gallon = 128 fl oz
 */
export function parseNetContentsToFlOz(value: string | null): number | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  let totalFlOz = 0;

  // Parse gallons (allow optional U.S. or US prefix)
  const gallonMatch = normalized.match(/(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:U\.?S\.?)?\s*gallon(s)?/i);
  if (gallonMatch) {
    const numStr = gallonMatch[1];
    let num: number;
    if (numStr.includes('/')) {
      const [n, d] = numStr.split('/').map(Number);
      if (isNaN(n) || isNaN(d) || d === 0) return null;
      num = n / d;
    } else {
      num = parseFloat(numStr);
      if (isNaN(num)) return null;
    }
    totalFlOz += num * 128;
  }

  // Parse quarts (allow optional U.S. or US prefix)
  const quartMatch = normalized.match(/(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:U\.?S\.?)?\s*quart(s)?/i);
  if (quartMatch) {
    const numStr = quartMatch[1];
    let num: number;
    if (numStr.includes('/')) {
      const [n, d] = numStr.split('/').map(Number);
      if (isNaN(n) || isNaN(d) || d === 0) return null;
      num = n / d;
    } else {
      num = parseFloat(numStr);
      if (isNaN(num)) return null;
    }
    totalFlOz += num * 32;
  }

  // Parse pints (allow optional U.S. or US prefix)
  const pintMatch = normalized.match(/(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:U\.?S\.?)?\s*pint(s)?/i);
  if (pintMatch) {
    const numStr = pintMatch[1];
    let num: number;
    if (numStr.includes('/')) {
      const [n, d] = numStr.split('/').map(Number);
      if (isNaN(n) || isNaN(d) || d === 0) return null;
      num = n / d;
    } else {
      num = parseFloat(numStr);
      if (isNaN(num)) return null;
    }
    totalFlOz += num * 16;
  }

  // Parse fluid ounces
  const flOzMatch = normalized.match(
    /(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:fl\.?\s*oz\.?|fluid\s+ounce(s)?)/i
  );
  if (flOzMatch) {
    const numStr = flOzMatch[1];
    let num: number;
    if (numStr.includes('/')) {
      const [n, d] = numStr.split('/').map(Number);
      if (isNaN(n) || isNaN(d) || d === 0) return null;
      num = n / d;
    } else {
      num = parseFloat(numStr);
      if (isNaN(num)) return null;
    }
    totalFlOz += num;
  }

  // If we found at least one unit, return the total
  if (gallonMatch || quartMatch || pintMatch || flOzMatch) {
    return totalFlOz;
  }

  return null;
}

/**
 * Validate beer net contents formatting per 27 CFR 7.70
 * Returns validation error message or null if valid
 */
export function validateBeerNetContentsFormat(value: string | null): string | null {
  if (!value) return null;

  const volumeFlOz = parseNetContentsToFlOz(value);
  if (volumeFlOz === null) return null; // Can't parse, will be caught by other validation

  const normalized = value.trim().toLowerCase();

  // Less than 1 pint (16 fl oz): must be in fluid ounces or fractions of a pint
  if (volumeFlOz < 16) {
    // Check if it's stated in fluid ounces or fractions of a pint
    const hasFlOz = /fl\.?\s*oz\.?/i.test(value) || /fluid\s+ounce(s)?/i.test(value);
    const hasPintFraction = /pint/i.test(value) && (/\//.test(value) || /\d+\s*pint/i.test(value));

    if (!hasFlOz && !hasPintFraction) {
      return 'For volumes less than 1 pint, net contents must be stated in fluid ounces or fractions of a pint';
    }
  }

  // Exactly 1 pint, 1 quart, or 1 gallon: must be stated exactly as "1 pint", "1 quart", or "1 gallon"
  // Allow optional "U.S." or "US" prefix
  if (Math.abs(volumeFlOz - 16) < 0.01) {
    // Exactly 1 pint - must be exactly "1 pint" or "1 U.S. pint" (no fractions, no additional units)
    if (
      !/^1\s+(?:U\.?S\.?)?\s*pint(?!\s)/i.test(normalized) &&
      !/^1\s+(?:U\.?S\.?)?\s*pint\s*$/i.test(normalized)
    ) {
      return 'For exactly 1 pint, net contents must be stated as "1 pint"';
    }
  } else if (Math.abs(volumeFlOz - 32) < 0.01) {
    // Exactly 1 quart - must be exactly "1 quart" or "1 U.S. quart"
    if (
      !/^1\s+(?:U\.?S\.?)?\s*quart(?!\s)/i.test(normalized) &&
      !/^1\s+(?:U\.?S\.?)?\s*quart\s*$/i.test(normalized)
    ) {
      return 'For exactly 1 quart, net contents must be stated as "1 quart"';
    }
  } else if (Math.abs(volumeFlOz - 128) < 0.01) {
    // Exactly 1 gallon - must be exactly "1 gallon" or "1 U.S. gallon"
    if (
      !/^1\s+(?:U\.?S\.?)?\s*gallon(?!\s)/i.test(normalized) &&
      !/^1\s+(?:U\.?S\.?)?\s*gallon\s*$/i.test(normalized)
    ) {
      return 'For exactly 1 gallon, net contents must be stated as "1 gallon"';
    }
  }

  // More than 1 pint but less than 1 quart (16-32 fl oz): fractions of a quart, or pints and fluid ounces
  if (volumeFlOz > 16 && volumeFlOz < 32) {
    const hasQuartFraction =
      /quart/i.test(value) && (/\//.test(value) || /\d+\s*quart/i.test(value));
    const hasPintsAndFlOz =
      /pint/i.test(value) && (/fl\.?\s*oz\.?/i.test(value) || /fluid\s+ounce/i.test(value));

    if (!hasQuartFraction && !hasPintsAndFlOz) {
      return 'For volumes more than 1 pint but less than 1 quart, net contents must be stated in fractions of a quart, or in pints and fluid ounces';
    }
  }

  // More than 1 quart but less than 1 gallon (32-128 fl oz): fractions of a gallon, or quarts, pints, and fluid ounces
  if (volumeFlOz > 32 && volumeFlOz < 128) {
    const hasGallonFraction =
      /gallon/i.test(value) && (/\//.test(value) || /\d+\s*gallon/i.test(value));
    const hasMultipleUnits =
      /quart/i.test(value) ||
      (/pint/i.test(value) && (/fl\.?\s*oz\.?/i.test(value) || /fluid\s+ounce/i.test(value)));

    if (!hasGallonFraction && !hasMultipleUnits) {
      return 'For volumes more than 1 quart but less than 1 gallon, net contents must be stated in fractions of a gallon, or in quarts, pints, and fluid ounces';
    }
  }

  // More than 1 gallon: gallons and fractions thereof
  if (volumeFlOz > 128) {
    if (!/gallon/i.test(value)) {
      return 'For volumes more than 1 gallon, net contents must be stated in gallons and fractions thereof';
    }
  }

  return null; // Valid format
}

/**
 * Validate wine net contents formatting per 27 CFR 4.72
 * Returns validation error message or null if valid
 *
 * Rules:
 * - Containers 4-17 liters: must be expressed in whole liters (4L, 5L, 6L, etc.)
 * - Containers 18+ liters: must be expressed in liters with decimal portions accurate to nearest one-hundredth
 */
export function validateWineNetContentsFormat(value: string | null): string | null {
  if (!value) return null;

  const volumeML = parseNetContentsToML(value);
  if (volumeML === null) return null; // Can't parse, will be caught by other validation

  const volumeLiters = volumeML / 1000;
  const normalized = value.trim().toLowerCase();

  // Only validate formatting for containers 4L and above
  if (volumeLiters < 4) {
    return null; // Standard formatting rules apply (handled by standards of fill check)
  }

  // Containers 4-17 liters: must be expressed in whole liters (4L, 5L, 6L, etc.)
  // "Even liters" here means whole numbers, not odd/even
  if (volumeLiters >= 4 && volumeLiters <= 17) {
    // Check if it's a whole number (integer)
    if (!Number.isInteger(volumeLiters)) {
      return 'For containers 4-17 liters, net contents must be expressed in whole liters (e.g., 4 liters, 5 liters, 6 liters). Decimal portions are not allowed.';
    }

    // Check if format matches "X liters" or "X L" where X is an integer
    const integerLiters = Math.floor(volumeLiters);
    // Allow formats like "4 liters", "4 L", "4 liter", "4L", etc.
    const formatMatch = new RegExp(`^${integerLiters}\\s*(liter(s)?|l\\.?)$`, 'i');
    if (!formatMatch.test(normalized)) {
      return `For containers 4-17 liters, net contents must be expressed as "${integerLiters} liters" or "${integerLiters} L" (whole numbers only, no decimals)`;
    }
  }

  // Containers 18+ liters: must be expressed in liters and decimal portions accurate to nearest one-hundredth
  if (volumeLiters >= 18) {
    // Check if decimal portion is accurate to nearest one-hundredth (max 2 decimal places)
    const decimalPlaces = (volumeLiters.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return 'For containers 18 liters or more, net contents must be expressed in liters accurate to the nearest one-hundredth of a liter (maximum 2 decimal places)';
    }

    // Check if format matches "X.XX liters" or "X.XX L" with up to 2 decimal places
    // Also allow whole numbers (e.g., "18 liters")
    const formatMatch = /^\d+(\.\d{1,2})?\s*(liter(s)?|l\\.?)$/i;
    if (!formatMatch.test(normalized)) {
      return 'For containers 18 liters or more, net contents must be expressed in liters and decimal portions accurate to the nearest one-hundredth of a liter (e.g., 18.50 liters, 20.25 L)';
    }
  }

  return null; // Valid format
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
