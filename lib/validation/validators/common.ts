// ============================================================
// Common Field Validators (used across all beverage types)
// ============================================================

import { MatchStatus, ApplicationData, FieldValidationResult, BeverageType } from '../types';
import {
  ALCOHOL_CONTENT_PATTERNS,
  NET_CONTENTS_PATTERNS,
  REQUIRED_HEALTH_WARNING,
  NUMBER_WITHOUT_UNIT_PATTERN,
} from '../constants';
import { OriginType } from '../types';
import {
  stringsMatch,
  isSoftMismatch,
  isSimilarString,
  differsOnlyByCase,
  matchesAnyPattern,
  containsValidAlcoholFormat,
  containsNetContentsPattern,
  valueExists,
  healthWarningMatchesExact,
  normalizeString,
  statesMatch,
  citiesMatch,
  parseNetContentsToML,
  isValidSpiritsStandardOfFill,
  isValidWineStandardOfFill,
  parseAlcoholPercentage,
  detectBeerAlcoholTerms,
  isTableWineOrLightWine,
  validateBeerNetContentsFormat,
  normalizeBusinessEntitySuffix,
  producerNamesMatchIgnoringEntitySuffix,
  validateWineNetContentsFormat,
} from '../utils';

/**
 * Validate Brand Name
 */
export function validateBrandName(
  application: ApplicationData,
  extracted: string | null
): FieldValidationResult {
  const expected = application.brandName;

  if (!extracted) {
    return {
      field: 'brandName',
      status: MatchStatus.NOT_FOUND,
      expected: expected,
      extracted: 'Field not found',
      rule: 'PRESENCE: Brand name must appear on label',
    };
  }

  if (stringsMatch(expected, extracted)) {
    // Case-only differences are considered equivalent (MATCH)
    if (differsOnlyByCase(expected, extracted)) {
      return {
        field: 'brandName',
        status: MatchStatus.MATCH,
        expected,
        extracted,
        rule: 'CROSS-CHECK: Brand name must match application',
      };
    }
    // Other formatting differences (punctuation, whitespace) are SOFT_MISMATCH
    if (isSoftMismatch(expected, extracted)) {
      return {
        field: 'brandName',
        status: MatchStatus.SOFT_MISMATCH,
        expected,
        extracted,
        rule: 'CROSS-CHECK: Brand name must match application',
        details: 'Formatting difference detected (punctuation or whitespace)',
      };
    }
    return {
      field: 'brandName',
      status: MatchStatus.MATCH,
      expected,
      extracted,
      rule: 'CROSS-CHECK: Brand name must match application',
    };
  }

  // Check for minor misspellings (similar strings with 1-2 character differences)
  // This handles OCR errors and typos like "FROG" vs "Frogg"
  if (isSimilarString(expected, extracted)) {
    return {
      field: 'brandName',
      status: MatchStatus.SOFT_MISMATCH,
      expected,
      extracted,
      rule: 'CROSS-CHECK: Brand name must match application',
      details: 'Minor spelling difference detected (possible OCR error or typo)',
    };
  }

  return {
    field: 'brandName',
    status: MatchStatus.HARD_MISMATCH,
    expected,
    extracted,
    rule: 'CROSS-CHECK: Brand name must match application',
    details: 'Brand names do not match',
  };
}

/**
 * Validate Fanciful Name
 */
export function validateFancifulName(
  application: ApplicationData,
  extracted: string | null
): FieldValidationResult {
  const expected = application.fancifulName;

  const expectedExists = valueExists(expected);
  const extractedExists = valueExists(extracted);

  if (!expectedExists && !extractedExists) {
    return {
      field: 'fancifulName',
      status: MatchStatus.NOT_APPLICABLE,
      expected: null,
      extracted: null,
      rule: 'CROSS-CHECK: Fanciful name not present in application or on label',
    };
  }

  if (expectedExists && !extractedExists) {
    return {
      field: 'fancifulName',
      status: MatchStatus.HARD_MISMATCH,
      expected: expected!,
      extracted: 'Field not found',
      rule: 'CROSS-CHECK: Fanciful name in application must appear on label',
      details: 'Application specifies a fanciful name but it was not found on the label',
    };
  }

  if (!expectedExists && extractedExists) {
    return {
      field: 'fancifulName',
      status: MatchStatus.HARD_MISMATCH,
      expected: 'None',
      extracted: extracted!,
      rule: 'CROSS-CHECK: Fanciful name on label must be in application',
      details: 'Label contains a fanciful name not listed in the application',
    };
  }

  if (stringsMatch(expected, extracted)) {
    if (isSoftMismatch(expected, extracted)) {
      return {
        field: 'fancifulName',
        status: MatchStatus.SOFT_MISMATCH,
        expected: expected!,
        extracted: extracted!,
        rule: 'CROSS-CHECK: Fanciful name must match application',
        details: 'Case or formatting difference detected',
      };
    }
    return {
      field: 'fancifulName',
      status: MatchStatus.MATCH,
      expected: expected!,
      extracted: extracted!,
      rule: 'CROSS-CHECK: Fanciful name must match application',
    };
  }

  // Check for minor misspellings (similar strings with 1-2 character differences)
  // This handles OCR errors and typos
  if (isSimilarString(expected, extracted)) {
    return {
      field: 'fancifulName',
      status: MatchStatus.SOFT_MISMATCH,
      expected: expected!,
      extracted: extracted!,
      rule: 'CROSS-CHECK: Fanciful name must match application',
      details: 'Minor spelling difference detected (possible OCR error or typo)',
    };
  }

  return {
    field: 'fancifulName',
    status: MatchStatus.HARD_MISMATCH,
    expected: expected!,
    extracted: extracted!,
    rule: 'CROSS-CHECK: Fanciful name must match application',
    details: 'Fanciful names do not match',
  };
}

/**
 * Validate Class/Type Designation
 */
export function validateClassType(extracted: string | null): FieldValidationResult {
  if (!extracted) {
    return {
      field: 'classType',
      status: MatchStatus.NOT_FOUND,
      expected: null, // Return null so display logic can show requirement message
      extracted: null,
      rule: 'PRESENCE: Class/type designation must appear on label',
    };
  }

  return {
    field: 'classType',
    status: MatchStatus.MATCH,
    expected: null,
    extracted,
    rule: 'PRESENCE: Class/type designation present on label',
  };
}

/**
 * Validate Alcohol Content
 * Required for all beverage types (beer, wine, spirits).
 * Format must match: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", or "XX% Alcohol by Volume"
 *
 * Beer-specific rules (27 CFR 7.65):
 * - "Low alcohol" or "reduced alcohol" may only be used if alcohol content < 2.5% ABV
 * - "Non-alcoholic" requires statement "contains less than 0.5% (or .5%) alcohol by volume" adjacent
 * - "Alcohol free" may only be used if beverage contains no alcohol
 *
 * Wine-specific rules:
 * - Wines > 14% ABV: numerical alcohol content statement is mandatory
 * - Wines 7-14% ABV: numerical alcohol content statement is optional if "table wine" or "light wine" appears as class/type
 */
export function validateAlcoholContent(
  extracted: string | null,
  beverageType: BeverageType,
  options?: {
    classType?: string | null;
    brandName?: string | null;
    fancifulName?: string | null;
  }
): FieldValidationResult {
  const expectedFormat =
    'Format: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", or "XX% Alcohol by Volume"';

  // Parse alcohol percentage if present
  const alcoholPercentage = parseAlcoholPercentage(extracted);

  // Beer-specific validation
  if (beverageType === BeverageType.BEER) {
    if (!extracted) {
      return {
        field: 'alcoholContent',
        status: MatchStatus.NOT_FOUND,
        expected: null,
        extracted: null,
        rule: 'PRESENCE: Alcohol content must appear on label',
        details: 'Alcohol content is required for beer/malt beverages',
      };
    }

    // Check for special beer terms
    const terms = detectBeerAlcoholTerms(
      extracted,
      options?.classType || null,
      options?.brandName || null,
      options?.fancifulName || null
    );

    // Validate "Low alcohol" or "Reduced alcohol" terms
    if (terms.hasLowAlcohol || terms.hasReducedAlcohol) {
      if (alcoholPercentage === null) {
        return {
          field: 'alcoholContent',
          status: MatchStatus.HARD_MISMATCH,
          expected: expectedFormat,
          extracted,
          rule: 'BEER RULE: "Low alcohol" or "Reduced alcohol" requires numerical alcohol content',
          details:
            'If "low alcohol" or "reduced alcohol" is used, alcohol content must be stated and must be less than 2.5% ABV',
        };
      }
      if (alcoholPercentage >= 2.5) {
        return {
          field: 'alcoholContent',
          status: MatchStatus.HARD_MISMATCH,
          expected:
            'Alcohol content must be less than 2.5% ABV to use "low alcohol" or "reduced alcohol"',
          extracted,
          rule: 'BEER RULE: "Low alcohol" or "Reduced alcohol" may only be used if alcohol content < 2.5% ABV',
          details: `Alcohol content is ${alcoholPercentage}% ABV, which equals or exceeds 2.5% ABV. "Low alcohol" or "reduced alcohol" terms cannot be used.`,
        };
      }
    }

    // Validate "Non-alcoholic" term
    if (terms.hasNonAlcoholic) {
      // Check if required statement appears adjacent (check in alcoholContent field)
      const hasRequiredStatement =
        /\bcontains\s+less\s+than\s+(0\.5|\.5)\s*%\s*(alcohol\s+)?by\s+volume\b/i.test(extracted);
      if (!hasRequiredStatement) {
        return {
          field: 'alcoholContent',
          status: MatchStatus.HARD_MISMATCH,
          expected:
            'If "non-alcoholic" is used, must include statement: "contains less than 0.5% (or .5%) alcohol by volume"',
          extracted,
          rule: 'BEER RULE: "Non-alcoholic" requires adjacent statement "contains less than 0.5% alcohol by volume"',
          details:
            'The term "non-alcoholic" may only be used if the statement "contains less than 0.5% (or .5%) alcohol by volume" appears immediately adjacent to it',
        };
      }
    }

    // Validate "Alcohol free" term
    if (terms.hasAlcoholFree) {
      if (alcoholPercentage === null || alcoholPercentage > 0) {
        return {
          field: 'alcoholContent',
          status: MatchStatus.HARD_MISMATCH,
          expected: 'Alcohol content must be 0% ABV to use "alcohol free"',
          extracted,
          rule: 'BEER RULE: "Alcohol free" may only be used if beverage contains no alcohol',
          details:
            alcoholPercentage === null
              ? 'Alcohol content must be stated and must be 0% to use "alcohol free"'
              : `Alcohol content is ${alcoholPercentage}% ABV. "Alcohol free" may only be used for beverages with 0% alcohol.`,
        };
      }
    }

    // Standard format validation for beer
    // If special terms are used, format validation may be relaxed, but we still check
    const validFormat = matchesAnyPattern(extracted, ALCOHOL_CONTENT_PATTERNS);
    const hasSpecialTerms =
      terms.hasLowAlcohol ||
      terms.hasReducedAlcohol ||
      terms.hasNonAlcoholic ||
      terms.hasAlcoholFree;

    // If no special terms and format doesn't match, flag format issue
    if (!hasSpecialTerms && !validFormat) {
      return {
        field: 'alcoholContent',
        status: MatchStatus.SOFT_MISMATCH,
        expected: expectedFormat,
        extracted,
        rule: 'FORMAT: Alcohol content must use acceptable format',
        details:
          'Format may not meet TTB requirements. Accepted formats: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", or "XX% Alcohol by Volume"',
      };
    }

    // If special terms are used but we can't parse percentage when required, flag it
    if (
      (terms.hasLowAlcohol || terms.hasReducedAlcohol || terms.hasAlcoholFree) &&
      alcoholPercentage === null &&
      !validFormat
    ) {
      return {
        field: 'alcoholContent',
        status: MatchStatus.SOFT_MISMATCH,
        expected: expectedFormat,
        extracted,
        rule: 'FORMAT: Alcohol content must use acceptable format or include required statements',
        details:
          'Special alcohol terms require numerical alcohol content statement in acceptable format',
      };
    }
  }

  // Wine-specific validation
  if (beverageType === BeverageType.WINE) {
    const isTableOrLightWine = isTableWineOrLightWine(options?.classType || null);
    const parsedPercentage = parseAlcoholPercentage(extracted);

    if (!extracted) {
      // Missing alcohol content - check if it's required
      if (!isTableOrLightWine) {
        // If not table/light wine, numerical statement is required (could be > 14% or 7-14% without table/light designation)
        return {
          field: 'alcoholContent',
          status: MatchStatus.NOT_FOUND,
          expected: null,
          extracted: null,
          rule: 'WINE RULE: Wines over 14% ABV require numerical alcohol content statement',
          details:
            'Wines over 14% ABV require a numerical alcohol content statement. Wines 7-14% ABV may omit numerical statement if "table wine" or "light wine" appears as class/type designation.',
        };
      }
      // If table/light wine, numerical statement is optional - this is OK
      // Still show expected format for reference
      return {
        field: 'alcoholContent',
        status: MatchStatus.MATCH,
        expected: expectedFormat + ' (optional for table/light wines)',
        extracted: null,
        rule: 'WINE RULE: For wines 7-14% ABV with "table wine" or "light wine" designation, numerical alcohol content statement is optional',
      };
    }

    // Alcohol content is present - validate format and percentage rules
    if (parsedPercentage !== null) {
      // Wines over 14% ABV: numerical alcohol content statement is mandatory (already present, check format)
      if (parsedPercentage > 14) {
        const validFormat = matchesAnyPattern(extracted, ALCOHOL_CONTENT_PATTERNS);
        if (!validFormat) {
          return {
            field: 'alcoholContent',
            status: MatchStatus.SOFT_MISMATCH,
            expected: expectedFormat,
            extracted,
            rule: 'FORMAT: Alcohol content must use acceptable format',
            details:
              'Format may not meet TTB requirements. Accepted formats: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", or "XX% Alcohol by Volume"',
          };
        }
      }

      // Wines 7-14% ABV: numerical statement is optional if "table wine" or "light wine" appears
      // If present, validate format
      if (parsedPercentage >= 7 && parsedPercentage <= 14) {
        const validFormat = matchesAnyPattern(extracted, ALCOHOL_CONTENT_PATTERNS);
        if (!validFormat) {
          return {
            field: 'alcoholContent',
            status: MatchStatus.SOFT_MISMATCH,
            expected: expectedFormat,
            extracted,
            rule: 'FORMAT: Alcohol content must use acceptable format',
            details:
              'Format may not meet TTB requirements. Accepted formats: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", or "XX% Alcohol by Volume"',
          };
        }
      }

      // Wines under 7% ABV: standard format validation
      if (parsedPercentage < 7) {
        const validFormat = matchesAnyPattern(extracted, ALCOHOL_CONTENT_PATTERNS);
        if (!validFormat) {
          return {
            field: 'alcoholContent',
            status: MatchStatus.SOFT_MISMATCH,
            expected: expectedFormat,
            extracted,
            rule: 'FORMAT: Alcohol content must use acceptable format',
            details:
              'Format may not meet TTB requirements. Accepted formats: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", or "XX% Alcohol by Volume"',
          };
        }
      }
    } else {
      // Extracted value present but no numerical percentage found
      // Check format - if it doesn't match standard patterns, flag it
      const validFormat = matchesAnyPattern(extracted, ALCOHOL_CONTENT_PATTERNS);
      if (!validFormat) {
        // If not table/light wine, this is a problem (should have numerical statement)
        if (!isTableOrLightWine) {
          return {
            field: 'alcoholContent',
            status: MatchStatus.HARD_MISMATCH,
            expected:
              'Numerical alcohol content statement required. For wines 7-14% ABV, statement is optional if "table wine" or "light wine" appears.',
            extracted,
            rule: 'WINE RULE: Wines over 14% ABV require numerical alcohol content statement',
            details:
              'No numerical alcohol percentage found. Wines over 14% ABV require numerical statement. Wines 7-14% ABV may omit if "table wine" or "light wine" appears.',
          };
        }
        // If table/light wine, format issue is soft mismatch
        return {
          field: 'alcoholContent',
          status: MatchStatus.SOFT_MISMATCH,
          expected: expectedFormat,
          extracted,
          rule: 'FORMAT: Alcohol content must use acceptable format',
          details: 'Format may not meet TTB requirements',
        };
      }
    }
  }

  // Spirits validation (standard format check)
  if (beverageType === BeverageType.SPIRITS) {
    if (!extracted) {
      return {
        field: 'alcoholContent',
        status: MatchStatus.NOT_FOUND,
        expected: null,
        extracted: null,
        rule: 'PRESENCE: Alcohol content must appear on label',
        details: 'Alcohol content is required for spirits',
      };
    }

    // Use containsValidAlcoholFormat to allow additional text like proof statements
    // Proof statements are allowed even though not mandatory and not satisfactory alone
    const validFormat = containsValidAlcoholFormat(extracted);
    if (!validFormat) {
      return {
        field: 'alcoholContent',
        status: MatchStatus.SOFT_MISMATCH,
        expected: expectedFormat,
        extracted,
        rule: 'FORMAT: Alcohol content must use acceptable format',
        details:
          'Format may not meet TTB requirements. Accepted formats: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", or "XX% Alcohol by Volume". Additional text like proof statements is allowed.',
      };
    }
  }

  // If we get here, validation passed
  // Return expected format so user knows what format is required (even when validation passes)
  return {
    field: 'alcoholContent',
    status: MatchStatus.MATCH,
    expected: expectedFormat,
    extracted,
    rule: 'PRESENCE + FORMAT: Alcohol content present and properly formatted',
  };
}

/**
 * Validate Net Contents
 *
 * Rules by beverage type:
 * - Beer: U.S. customary units REQUIRED (fl. oz., pints, quarts, gallons), metric optional
 * - Wine/Spirits: Metric units REQUIRED (mL, L), U.S. customary optional
 *
 * Normalization handled:
 * - mL, ml., ML, milliliter, milliliters → treated as metric milliliters
 * - L, litre, liter → treated as liters
 * - fl. oz., fluid ounces → U.S. units
 */
export function validateNetContents(
  extracted: string | null,
  beverageType: BeverageType
): FieldValidationResult {
  // Determine expected format based on beverage type
  const requiresMetric =
    beverageType === BeverageType.WINE || beverageType === BeverageType.SPIRITS;
  const requiresUSCustomary = beverageType === BeverageType.BEER;

  const expectedFormat = requiresMetric
    ? 'Metric units required (e.g., "750 mL", "1 L"). U.S. customary units optional.'
    : 'U.S. customary units required (e.g., "12 fl oz", "1 pint"). Metric units optional.';

  if (!extracted) {
    return {
      field: 'netContents',
      status: MatchStatus.NOT_FOUND,
      expected: 'Field not found',
      extracted: null,
      rule: 'PRESENCE: Net contents must appear on label',
    };
  }

  // Normalize the extracted value (trim whitespace)
  const normalized = extracted.trim();

  // Check which unit types match (using containsNetContentsPattern to handle cases like "710 ML / 1 PINT 8 FL OZ")
  const matchesMetric = containsNetContentsPattern(normalized, NET_CONTENTS_PATTERNS.metric);
  const matchesUSCustomary = containsNetContentsPattern(
    normalized,
    NET_CONTENTS_PATTERNS.usCustomary
  );

  // Check if metric is present but formatted incorrectly (has number but missing unit)
  // This is especially important for wine/spirits where metric is required
  const hasNumberButNoUnit = NUMBER_WITHOUT_UNIT_PATTERN.test(normalized);
  if (requiresMetric && hasNumberButNoUnit && !matchesMetric && !matchesUSCustomary) {
    return {
      field: 'netContents',
      status: MatchStatus.HARD_MISMATCH,
      expected: expectedFormat,
      extracted,
      rule: 'FORMAT: Wine and spirits must use metric units (mL, L)',
      details:
        'Number detected but unit missing. Metric units (mL, L) are required for wine and spirits.',
    };
  }

  // Check if required unit type is present
  if (requiresMetric && !matchesMetric) {
    // Wine/Spirits: Metric required
    if (matchesUSCustomary) {
      // Has US customary but not metric - HARD MISMATCH (wrong unit type)
      return {
        field: 'netContents',
        status: MatchStatus.HARD_MISMATCH,
        expected: expectedFormat,
        extracted,
        rule: 'FORMAT: Wine and spirits must use metric units (mL, L). U.S. customary units are optional.',
        details: 'Metric units required for wine/spirits. Found U.S. customary units instead.',
      };
    }
    // Neither metric nor US customary - invalid format
    return {
      field: 'netContents',
      status: MatchStatus.HARD_MISMATCH,
      expected: expectedFormat,
      extracted,
      rule: 'FORMAT: Wine and spirits must use metric units (mL, L)',
      details: 'Invalid format. Metric units (mL, L) are required for wine and spirits.',
    };
  }

  if (requiresUSCustomary && !matchesUSCustomary) {
    // Beer: US customary required
    if (matchesMetric) {
      // Has metric but not US customary - HARD MISMATCH (wrong unit type)
      return {
        field: 'netContents',
        status: MatchStatus.HARD_MISMATCH,
        expected: expectedFormat,
        extracted,
        rule: 'FORMAT: Beer must use U.S. customary units (fl. oz., pints, quarts, gallons). Metric units are optional.',
        details: 'U.S. customary units required for beer. Found metric units instead.',
      };
    }
    // Neither US customary nor metric - invalid format
    return {
      field: 'netContents',
      status: MatchStatus.HARD_MISMATCH,
      expected: expectedFormat,
      extracted,
      rule: 'FORMAT: Beer must use U.S. customary units (fl. oz., pints, quarts, gallons)',
      details: 'Invalid format. U.S. customary units are required for beer.',
    };
  }

  // Required unit type is present - validate formatting requirements
  if (requiresUSCustomary && beverageType === BeverageType.BEER) {
    // Validate beer formatting requirements per 27 CFR 7.70
    const formatError = validateBeerNetContentsFormat(normalized);
    if (formatError) {
      return {
        field: 'netContents',
        status: MatchStatus.HARD_MISMATCH,
        expected: expectedFormat,
        extracted,
        rule: 'FORMAT: Beer net contents must follow U.S. standard measure formatting requirements (27 CFR 7.70)',
        details: formatError,
      };
    }
  }

  // Required unit type is present - check standards of fill for spirits and wine
  if (requiresMetric) {
    // For wine, validate formatting requirements for containers 4L+ per 27 CFR 4.72
    if (beverageType === BeverageType.WINE) {
      const formatError = validateWineNetContentsFormat(normalized);
      if (formatError) {
        return {
          field: 'netContents',
          status: MatchStatus.HARD_MISMATCH,
          expected: expectedFormat,
          extracted,
          rule: 'FORMAT: Wine net contents must follow metric formatting requirements (27 CFR 4.72)',
          details: formatError,
        };
      }
    }

    // For wine and spirits, check if the volume matches authorized standards of fill
    const volumeML = parseNetContentsToML(normalized);

    if (volumeML !== null) {
      const isValidStandard =
        beverageType === BeverageType.SPIRITS
          ? isValidSpiritsStandardOfFill(volumeML)
          : isValidWineStandardOfFill(volumeML);

      if (!isValidStandard) {
        // Volume doesn't match authorized standards - flag for review (SOFT_MISMATCH)
        const beverageName = beverageType === BeverageType.SPIRITS ? 'spirits' : 'wine';
        const standardsList =
          beverageType === BeverageType.SPIRITS
            ? '3.75L, 3L, 2L, 1.8L, 1.75L, 1.5L, 1L, 945mL, 900mL, 750mL, 720mL, 710mL, 700mL, 570mL, 500mL, 475mL, 375mL, 355mL, 350mL, 331mL, 250mL, 200mL, 187mL, 100mL, 50mL'
            : '3L, 2.25L, 1.8L, 1.5L, 1L, 750mL, 720mL, 700mL, 620mL, 600mL, 568mL, 550mL, 500mL, 473mL, 375mL, 360mL, 355mL, 330mL, 300mL, 250mL, 200mL, 187mL, 180mL, 100mL, 50mL (or even liters ≥4L)';

        return {
          field: 'netContents',
          status: MatchStatus.SOFT_MISMATCH,
          expected: `${expectedFormat} Must match authorized standards of fill: ${standardsList}`,
          extracted,
          rule: `STANDARDS OF FILL: ${beverageName.charAt(0).toUpperCase() + beverageName.slice(1)} must use authorized container sizes`,
          details: `Volume ${normalized} does not match authorized standards of fill for ${beverageName}. This requires review.`,
        };
      }
    }
  }

  // Required unit type is present and (if applicable) matches standards of fill - MATCH
  // (Optional unit type may also be present, which is fine)
  return {
    field: 'netContents',
    status: MatchStatus.MATCH,
    expected: expectedFormat,
    extracted,
    rule: requiresMetric
      ? 'PRESENCE + FORMAT: Net contents present with required metric units (U.S. customary optional)'
      : 'PRESENCE + FORMAT: Net contents present with required U.S. customary units (metric optional)',
  };
}

/**
 * Validate Producer Name & Address
 * Only validates producer name, city, and state - does not validate full street address
 *
 * For Spirits and Wine: Name and address must immediately follow "Bottled By" or "Imported By" with no intervening text
 * For Imported Beer: Importer name and address must immediately follow "Imported by" or similar phrase with no intervening text
 */
// Helper functions for validateProducerNameAddress

/**
 * Check if city appears in the given address string
 */
function checkCityInAddress(address: string, expectedCity: string): boolean {
  if (!address) return false;

  // Check if city appears in address parts (split by comma)
  const parts = normalizeString(address).split(',').map((p) => p.trim());
  for (const part of parts) {
    if (citiesMatch(part, expectedCity)) {
      return true;
    }
  }

  // Also check if city appears anywhere in the address string
  const words = normalizeString(address).split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    // Check single word
    if (citiesMatch(words[i], expectedCity)) {
      return true;
    }
    // Check two-word combinations (for cities like "New York")
    if (i < words.length - 1) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      if (citiesMatch(twoWords, expectedCity)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if state appears in the given address string
 */
function checkStateInAddress(address: string | null, expectedState: string): boolean {
  if (!address) return false;
  if (!address) return false;

  const normalizedAddress = normalizeString(address);

  // Extract potential state from address (last part after comma, or last 2-3 words)
  const parts = normalizedAddress.split(',').map((p) => p.trim());
  const lastPart = parts[parts.length - 1] || '';

  // Remove ZIP code from last part if present (e.g., "va 20176" -> "va")
  const lastPartWithoutZip = lastPart.replace(/\s+\d{5}(-\d{4})?.*$/, '').trim();
  const stateToCheck = lastPartWithoutZip || lastPart;

  // Check if last part (without ZIP) matches the expected state (handles abbreviations)
  if (statesMatch(stateToCheck, expectedState)) {
    return true;
  }

  // Also check if any part of the address contains a state equivalent
  // Handle multi-word states like "New York", "North Carolina"
  const words = normalizedAddress.split(/\s+/);
  const lastWords = words.slice(-2).join(' '); // Last 2 words
  // Remove ZIP from last words if present
  const lastWordsWithoutZip = lastWords.replace(/\s+\d{5}(-\d{4})?.*$/, '').trim();
  if (statesMatch(lastWordsWithoutZip || lastWords, expectedState)) {
    return true;
  }

  // Try checking if state appears anywhere in the address
  // Remove ZIP codes from all parts before checking
  const addressWithoutZip = normalizedAddress.replace(/\s+\d{5}(-\d{4})?/g, '');
  const allParts = addressWithoutZip.split(/[,\s]+/);
  for (const part of allParts) {
    if (statesMatch(part, expectedState)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if name matches (with entity suffix handling)
 */
function checkNameMatch(
  expectedName: string,
  extractedName: string | null,
  extractedWithoutZip: string
): boolean {
  if (!extractedName) {
    // If no separate name field, check if name appears in combined string
    const extractedNameFromCombined = extractedWithoutZip.split(',')[0]?.trim() || '';
    const expectedNameNorm = normalizeString(expectedName);
    return (
      extractedWithoutZip.includes(expectedNameNorm) ||
      producerNamesMatchIgnoringEntitySuffix(expectedName, extractedNameFromCombined)
    );
  }

  // Check if name matches using various matching strategies
  const expectedNameNorm = normalizeString(expectedName);
  return (
    stringsMatch(expectedName, extractedName) ||
    producerNamesMatchIgnoringEntitySuffix(expectedName, extractedName) ||
    normalizeString(extractedName).includes(expectedNameNorm)
  );
}

/**
 * Check if all parts (name, city, state) are present in the extracted value
 */
function checkAllPartsPresent(
  expectedName: string,
  expectedCity: string,
  expectedState: string,
  extractedName: string | null,
  extractedAddress: string | null,
  extractedWithoutZip: string
): { hasName: boolean; hasCity: boolean; hasState: boolean } {
  const expectedNameNorm = normalizeString(expectedName);
  const expectedNameWithoutSuffix = normalizeBusinessEntitySuffix(expectedNameNorm);
  const extractedNameNorm = normalizeString(extractedName || '');
  const extractedNameWithoutSuffix = normalizeBusinessEntitySuffix(extractedNameNorm);

  // Check if name appears
  const hasName = Boolean(
    extractedWithoutZip.includes(expectedNameNorm) ||
      extractedWithoutZip.includes(expectedNameWithoutSuffix) ||
      extractedNameWithoutSuffix === expectedNameWithoutSuffix ||
      (extractedName && producerNamesMatchIgnoringEntitySuffix(expectedName, extractedName))
  );

  // Check if city appears
  const hasCity = (() => {
    // Check if city appears in combined string
    const parts = extractedWithoutZip.split(',').map((p) => p.trim());
    for (const part of parts) {
      if (citiesMatch(part, expectedCity)) {
        return true;
      }
    }
    // Also check if city appears anywhere in the combined string
    const words = extractedWithoutZip.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      // Check single word
      if (citiesMatch(words[i], expectedCity)) {
        return true;
      }
      // Check two-word combinations (for cities like "New York")
      if (i < words.length - 1) {
        const twoWords = `${words[i]} ${words[i + 1]}`;
        if (citiesMatch(twoWords, expectedCity)) {
          return true;
        }
      }
    }
    return false;
  })();

  // Check if state appears
  const hasState = (() => {
    // Check state with ZIP code handling - check both address and combined string
    const addressNorm = normalizeString(extractedAddress || '');
    const addressWithoutZip = addressNorm.replace(/\s+\d{5}(-\d{4})?.*$/, '').trim();

    // Check if state appears in address (with or without ZIP)
    if (statesMatch(addressWithoutZip, expectedState) || statesMatch(addressNorm, expectedState)) {
      return true;
    }

    // Check if state appears in combined string (after removing ZIP)
    const combinedWithoutZip = extractedWithoutZip;

    // Extract potential state from combined string (last part after comma, or last 2-3 words)
    const parts = combinedWithoutZip.split(',').map((p) => p.trim());
    const lastPart = parts[parts.length - 1] || '';

    // Remove ZIP code from last part if present
    const lastPartWithoutZip = lastPart.replace(/\s+\d{5}(-\d{4})?.*$/, '').trim();
    const stateToCheck = lastPartWithoutZip || lastPart;

    // Use statesMatch to handle abbreviation vs full name equivalence
    if (statesMatch(stateToCheck, expectedState)) {
      return true;
    }

    // Also check last 2 words for multi-word states like "New York", "North Carolina"
    const words = combinedWithoutZip.split(/\s+/);
    const lastWords = words.slice(-2).join(' ');
    const lastWordsWithoutZip = lastWords.replace(/\s+\d{5}(-\d{4})?.*$/, '').trim();
    if (statesMatch(lastWordsWithoutZip || lastWords, expectedState)) {
      return true;
    }

    // Try checking if state appears anywhere in the combined string
    const allParts = combinedWithoutZip.split(/[,\s]+/);
    for (const part of allParts) {
      if (statesMatch(part, expectedState)) {
        return true;
      }
    }

    return false;
  })();

  return { hasName, hasCity, hasState };
}

/**
 * Validate phrase requirement (Bottled By/Imported By)
 */
function validatePhraseRequirement(
  beverageType: BeverageType | undefined,
  producerNamePhrase: string | null | undefined,
  isImported: boolean,
  expectedName: string,
  expectedCity: string,
  expectedState: string,
  extractedName: string | null,
  extractedAddress: string | null
): FieldValidationResult | null {
  if (!beverageType || !extractedName || !extractedAddress) {
    return null;
  }

  const normalizedPhrase = producerNamePhrase ? normalizeString(producerNamePhrase) : '';

  // For imported beverages, enforce that extracted name/address must follow "Imported By"
  if (isImported) {
    const hasImportedBy = /imported\s+by/i.test(normalizedPhrase);

    if (!hasImportedBy) {
      return {
        field: 'producerNameAddress',
        status: MatchStatus.HARD_MISMATCH,
        expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
        extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
        rule: 'CROSS-CHECK: For imported beverages, must extract the importer name/address that follows "Imported By"',
        details:
          'This appears to be an imported beverage, but the extracted name/address does not follow "Imported By". For imported beverages, extract the importer name/address (following "Imported By"), not the producer name/address.',
      };
    }
  }

  // Check phrase requirement for Spirits and Wine
  if (beverageType === BeverageType.SPIRITS || beverageType === BeverageType.WINE) {
    const hasBottledBy = /bottled\s+by/i.test(normalizedPhrase);
    const hasImportedBy = /imported\s+by/i.test(normalizedPhrase);

    // For domestic beverages, require "Bottled By" phrase
    if (!isImported && !hasBottledBy && !hasImportedBy) {
      return {
        field: 'producerNameAddress',
        status: MatchStatus.SOFT_MISMATCH,
        expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
        extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
        rule: 'FORMAT: Producer name and address must immediately follow "Bottled By" or "Imported By" with no intervening text',
        details:
          'Producer name/address should immediately follow "Bottled By" or "Imported By" phrase. No such phrase detected or intervening text may be present.',
      };
    }
  }

  // Check phrase requirement for Imported Beer
  if (beverageType === BeverageType.BEER && isImported) {
    const hasImportedBy = /imported\s+by/i.test(normalizedPhrase);

    if (!hasImportedBy) {
      return {
        field: 'producerNameAddress',
        status: MatchStatus.SOFT_MISMATCH,
        expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
        extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
        rule: 'FORMAT: Importer name and address must immediately follow "Imported by" or similar phrase with no intervening text',
        details:
          'Importer name/address should immediately follow "Imported by" or similar phrase. No such phrase detected or intervening text may be present.',
      };
    }
  }

  return null;
}

export function validateProducerNameAddress(
  application: ApplicationData,
  extractedName: string | null,
  extractedAddress: string | null,
  options?: {
    beverageType?: BeverageType;
    producerNamePhrase?: string | null;
  }
): FieldValidationResult {
  const expectedName = application.producerName;
  const expectedCity = application.producerAddress.city;
  const expectedState = application.producerAddress.state;

  if (!extractedName && !extractedAddress) {
    return {
      field: 'producerNameAddress',
      status: MatchStatus.NOT_FOUND,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: 'Field not found',
      rule: 'PRESENCE: Producer name and location (city, state) must appear on label',
    };
  }

  // Handle cases where name or address might contain the full combined string
  // Check if either field contains the complete expected information (name, city, state)
  const combinedExtracted =
    extractedName && extractedAddress
      ? `${extractedName}, ${extractedAddress}`
      : extractedName || extractedAddress || '';
  const expectedCombined = `${expectedName}, ${expectedCity}, ${expectedState}`;
  const normalizedCombined = normalizeString(combinedExtracted);

  // Remove ZIP code from extracted for comparison
  const extractedWithoutZip = normalizedCombined.replace(/\s+\d{5}(-\d{4})?/g, '');

  // Check if all three parts (name, city, state) appear in the extracted value
  const { hasName, hasCity, hasState } = checkAllPartsPresent(
    expectedName,
    expectedCity,
    expectedState,
    extractedName,
    extractedAddress,
    extractedWithoutZip
  );

  // If all parts are present in the extracted value, treat as match
  if (hasName && hasCity && hasState) {
    // Verify name matches - check if name appears in extracted (allows for combined format)
    const nameMatches = checkNameMatch(expectedName, extractedName, extractedWithoutZip);

    if (nameMatches) {
      // All required parts found - treat as match
      return {
        field: 'producerNameAddress',
        status: MatchStatus.MATCH,
        expected: expectedCombined,
        extracted: combinedExtracted,
        rule: 'CROSS-CHECK: Producer name, city, and state match application',
      };
    }
  }

  // Compare producer names - check if core name matches (ignoring entity suffixes)
  // This allows "CO." vs "LLC" to be considered a soft mismatch if core name matches
  const coreNameMatches =
    extractedName && producerNamesMatchIgnoringEntitySuffix(expectedName, extractedName);
  const exactNameMatches = extractedName && stringsMatch(expectedName, extractedName);
  const nameSoftMismatch = extractedName && isSoftMismatch(expectedName, extractedName);

  // If names match when normalized (case-insensitive), treat as MATCH regardless of case differences
  // Case-only differences (e.g., "BREWERY" vs "Brewery") should be MATCH, not SOFT_MISMATCH
  const hasEntitySuffixDifference = coreNameMatches && !exactNameMatches;
  // Only treat as soft mismatch if there are formatting differences (punctuation/whitespace)
  // AND names don't match exactly when normalized (case differences alone don't count)
  // If exactNameMatches is true, we skip soft mismatch check (case differences are acceptable)
  const hasNonCaseFormattingDifference = nameSoftMismatch && !exactNameMatches;

  // Also check if the name field contains address information (combined format)
  // This handles cases where extraction puts everything in one field
  const nameContainsAddress =
    extractedName &&
    (citiesMatch(extractedName, expectedCity) ||
      normalizeString(extractedName).includes(normalizeString(expectedState)));

  // If name contains address info, use name for city/state checking too
  const addressToCheck = nameContainsAddress ? extractedName : extractedAddress;

  // Only validate city and state from the address, not the full street address
  const addressContainsCity = checkCityInAddress(addressToCheck || '', expectedCity);
  const addressContainsState = checkStateInAddress(addressToCheck || '', expectedState);

  // If core name doesn't match at all, check for minor misspellings before hard mismatch
  if (!coreNameMatches && extractedName) {
    // Check for minor misspellings (similar strings with 1-2 character differences)
    // This handles OCR errors and typos in producer names
    if (isSimilarString(expectedName, extractedName)) {
      // If city and state also match, treat as soft mismatch
      if (addressContainsCity && addressContainsState) {
        return {
          field: 'producerNameAddress',
          status: MatchStatus.SOFT_MISMATCH,
          expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
          extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
          rule: 'CROSS-CHECK: Producer name, city, and state must match application',
          details:
            'Minor spelling difference in producer name detected (possible OCR error or typo)',
        };
      }
      // If city/state don't match, still hard mismatch
    }
    return {
      field: 'producerNameAddress',
      status: MatchStatus.HARD_MISMATCH,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
      rule: 'CROSS-CHECK: Producer name must match application',
      details: 'Producer name does not match',
    };
  }

  // If core name matches but exact doesn't (entity suffix difference), continue validation
  // but we'll flag it as soft mismatch later if city/state also match

  if (!addressContainsCity || !addressContainsState) {
    return {
      field: 'producerNameAddress',
      status: MatchStatus.HARD_MISMATCH,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
      rule: 'CROSS-CHECK: City and state must match application (street address not validated)',
      details:
        'City or state does not match (note: state abbreviations are equivalent to full names, e.g., "ME" = "Maine")',
    };
  }

  // Validate phrase requirement (Bottled By/Imported By)
  const beverageType = options?.beverageType;
  const producerNamePhrase = options?.producerNamePhrase;
  const isImported = application.originType === OriginType.IMPORTED;

  const phraseValidationResult = validatePhraseRequirement(
    beverageType,
    producerNamePhrase,
    isImported,
    expectedName,
    expectedCity,
    expectedState,
    extractedName,
    extractedAddress
  );
  if (phraseValidationResult) {
    return phraseValidationResult;
  }

  // Check for soft mismatches (formatting differences or entity suffix differences)
  // Only flag as soft mismatch if:
  // 1. Entity suffix difference (e.g., "CO." vs "LLC") - core name matches but suffix differs
  // 2. Non-case formatting differences (punctuation, whitespace) - but NOT case-only differences
  // Case-only differences (e.g., "BREWERY" vs "Brewery") are treated as MATCH above
  if (hasEntitySuffixDifference || hasNonCaseFormattingDifference) {
    return {
      field: 'producerNameAddress',
      status: MatchStatus.SOFT_MISMATCH,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
      rule: 'CROSS-CHECK: Producer name, city, and state must match application',
      details: hasEntitySuffixDifference
        ? 'Business entity suffix difference (e.g., "CO." vs "LLC") - core business name matches'
        : 'Minor formatting difference in name (punctuation or whitespace)',
    };
  }

  return {
    field: 'producerNameAddress',
    status: MatchStatus.MATCH,
    expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
    extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
    rule: 'CROSS-CHECK: Producer name, city, and state match application',
  };
}

/**
 * Validate Health Warning Statement
 * The ENTIRE government warning must appear EXACTLY on the label
 */
export function validateHealthWarning(
  extractedText: string | null,
  formatChecks: {
    governmentWarningAllCaps: boolean | null;
    governmentWarningBold: boolean | null;
    remainderBold: boolean | null;
    surgeonCapitalized: boolean | null;
    generalCapitalized: boolean | null;
  }
): FieldValidationResult {
  // Check presence
  if (!extractedText) {
    return {
      field: 'healthWarning',
      status: MatchStatus.NOT_FOUND,
      expected: REQUIRED_HEALTH_WARNING,
      extracted: 'Field not found',
      rule: 'PRESENCE: Health warning statement must appear on label',
    };
  }

  // Check EXACT text match (this is the primary validation)
  if (!healthWarningMatchesExact(extractedText)) {
    return {
      field: 'healthWarning',
      status: MatchStatus.HARD_MISMATCH,
      expected: REQUIRED_HEALTH_WARNING,
      extracted: extractedText,
      rule: 'FORMAT: Health warning must match EXACT required text word-for-word',
      details: 'The entire government warning text does not match the required wording exactly',
    };
  }

  // Check "GOVERNMENT WARNING" is all caps
  if (formatChecks.governmentWarningAllCaps === false) {
    return {
      field: 'healthWarning',
      status: MatchStatus.HARD_MISMATCH,
      expected: '"GOVERNMENT WARNING" must be in ALL CAPS',
      extracted: extractedText,
      rule: 'FORMAT: "GOVERNMENT WARNING" must be in capital letters',
      details: '"GOVERNMENT WARNING" is not in all caps',
    };
  }

  // Check "GOVERNMENT WARNING" is bold
  if (formatChecks.governmentWarningBold === false) {
    return {
      field: 'healthWarning',
      status: MatchStatus.HARD_MISMATCH,
      expected: '"GOVERNMENT WARNING" must be bold',
      extracted: extractedText,
      rule: 'FORMAT: "GOVERNMENT WARNING" must be in bold type',
      details: '"GOVERNMENT WARNING" is not bold',
    };
  }

  // Check remainder of warning is NOT bold (only "GOVERNMENT WARNING" should be bold)
  if (formatChecks.remainderBold === true) {
    return {
      field: 'healthWarning',
      status: MatchStatus.HARD_MISMATCH,
      expected: 'Only "GOVERNMENT WARNING" must be bold; remainder of warning must NOT be bold',
      extracted: extractedText,
      rule: 'FORMAT: Remainder of warning statement may not appear in bold type',
      details:
        'The remainder of the warning statement after "GOVERNMENT WARNING:" appears in bold type, but it should not be bold',
    };
  }

  // Check "Surgeon" is capitalized
  if (formatChecks.surgeonCapitalized === false) {
    return {
      field: 'healthWarning',
      status: MatchStatus.HARD_MISMATCH,
      expected: '"Surgeon" must have capital S',
      extracted: extractedText,
      rule: 'FORMAT: "Surgeon" must be capitalized',
      details: '"Surgeon" is not capitalized',
    };
  }

  // Check "General" is capitalized
  if (formatChecks.generalCapitalized === false) {
    return {
      field: 'healthWarning',
      status: MatchStatus.HARD_MISMATCH,
      expected: '"General" must have capital G',
      extracted: extractedText,
      rule: 'FORMAT: "General" must be capitalized',
      details: '"General" is not capitalized',
    };
  }

  return {
    field: 'healthWarning',
    status: MatchStatus.MATCH,
    expected: REQUIRED_HEALTH_WARNING,
    extracted: extractedText,
    rule: 'PRESENCE + FORMAT: Health warning present with exact required text and formatting',
  };
}

/**
 * Validate Country of Origin
 * Required for ALL imported beverages (beer, wine, spirits). No cross-checking - filled in by TTB agents.
 */
export function validateCountryOfOrigin(
  originType: OriginType,
  extracted: string | null
): FieldValidationResult {
  // Domestic products don't require country of origin
  if (originType === OriginType.DOMESTIC) {
    return {
      field: 'countryOfOrigin',
      status: MatchStatus.NOT_APPLICABLE,
      expected: 'N/A - Domestic',
      extracted: null,
      rule: 'PRESENCE: Country of origin not required for domestic products',
    };
  }

  // Imported products require country of origin (applies to all beverage types: beer, wine, spirits)
  if (!extracted) {
    return {
      field: 'countryOfOrigin',
      status: MatchStatus.NOT_FOUND,
      expected: 'Required for imported beverages',
      extracted: null,
      rule: 'PRESENCE: Country of origin must appear on label for all imported beverages',
    };
  }

  // Country of origin is present - no cross-checking needed (filled by TTB agents)
  // For imported products, show that it's required even though we don't cross-check the specific value
  return {
    field: 'countryOfOrigin',
    status: MatchStatus.MATCH,
    expected: 'Required for imported beverages',
    extracted,
    rule: 'PRESENCE: Country of origin present on label',
  };
}
