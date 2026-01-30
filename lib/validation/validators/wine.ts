// ============================================================
// Wine-Specific Field Validators
// ============================================================

import {
  MatchStatus,
  ApplicationData,
  FieldValidationResult,
  WineExtractionResult,
} from "../types";
import {
  stringsMatch,
  isSoftMismatch,
  isSimilarString,
  valueExists,
  normalizeString,
} from "../utils";

/**
 * Validate Appellation of Origin (wine only)
 * Required if label contains: varietal, semi-generic type, or "Estate Bottled"
 */
export function validateAppellation(
  application: ApplicationData,
  extraction: WineExtractionResult["extraction"],
): FieldValidationResult {
  const expected = application.appellation;
  const extracted = extraction.appellation;

  // Determine if appellation is required based on what's on the label
  const hasVarietal = valueExists(extraction.classType);
  const isEstateBottled = extraction.isEstateBottled === true;

  // Appellation is required if any of these conditions are met
  const appellationRequired = hasVarietal || isEstateBottled;

  // If appellation is required but not present on label
  if (appellationRequired && !valueExists(extracted)) {
    const reasons: string[] = [];
    if (hasVarietal) reasons.push("varietal designation");
    if (isEstateBottled) reasons.push("estate bottled");

    // Show expected appellation if it exists in application, otherwise show requirement message
    const expectedValue = valueExists(expected)
      ? expected!
      : "Required (see details)";

    return {
      field: "appellation",
      status: MatchStatus.NOT_FOUND,
      expected: expectedValue,
      extracted: "Field not found",
      rule: "PRESENCE: Appellation required when label contains varietal or estate bottled",
      details: `Appellation required because label contains: ${reasons.join(", ")}`,
    };
  }

  // If neither application nor label has appellation, and it's not required
  if (!valueExists(expected) && !valueExists(extracted)) {
    return {
      field: "appellation",
      status: MatchStatus.NOT_APPLICABLE,
      expected: null,
      extracted: null,
      rule: "CROSS-CHECK: Appellation not specified in application and not required on label",
    };
  }

  // If application has appellation but label doesn't (and it's not otherwise required)
  if (valueExists(expected) && !valueExists(extracted)) {
    return {
      field: "appellation",
      status: MatchStatus.NOT_FOUND,
      expected: expected!,
      extracted: "Field not found",
      rule: "CROSS-CHECK: Appellation in application must appear on label",
    };
  }

  // If label has appellation but application doesn't (CROSS-CHECK: must exist in both if exists in one)
  if (!valueExists(expected) && valueExists(extracted)) {
    return {
      field: "appellation",
      status: MatchStatus.HARD_MISMATCH,
      expected: null,
      extracted: extracted!,
      rule: "CROSS-CHECK: Appellation on label must be in application",
      details: "Label contains an appellation not listed in the application",
    };
  }

  // Both have appellations - check if they match
  if (stringsMatch(expected, extracted)) {
    if (isSoftMismatch(expected, extracted)) {
      return {
        field: "appellation",
        status: MatchStatus.SOFT_MISMATCH,
        expected: expected!,
        extracted: extracted!,
        rule: "CROSS-CHECK: Appellation must match application",
        details: "Minor formatting difference",
      };
    }
    return {
      field: "appellation",
      status: MatchStatus.MATCH,
      expected: expected!,
      extracted: extracted!,
      rule: "CROSS-CHECK: Appellation matches application",
    };
  }

  // Check if extracted value contains the expected appellation (handles cases like "Virginia, USA" matching "VIRGINIA")
  const expectedNormalized = normalizeString(expected!);
  const extractedNormalized = normalizeString(extracted!);

  // Check if extracted contains expected as a whole word (to avoid partial matches)
  // This handles cases like "Virginia, USA" containing "virginia"
  const expectedWords = expectedNormalized.split(/\s+/);
  if (expectedWords.length === 1) {
    // Single word appellation (e.g., "virginia") - check if it appears as a whole word in extracted
    const wordBoundaryRegex = new RegExp(
      `\\b${expectedNormalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    );
    if (wordBoundaryRegex.test(extractedNormalized)) {
      // Extracted contains expected appellation - treat as match
      return {
        field: "appellation",
        status: MatchStatus.MATCH,
        expected: expected!,
        extracted: extracted!,
        rule: "CROSS-CHECK: Appellation matches application",
        details: "Appellation found in extracted value with additional text",
      };
    }
  } else {
    // Multi-word appellation - check if all words appear in extracted
    const allWordsFound = expectedWords.every((word) =>
      extractedNormalized.includes(word),
    );
    if (allWordsFound) {
      // Extracted contains expected appellation - treat as match
      return {
        field: "appellation",
        status: MatchStatus.MATCH,
        expected: expected!,
        extracted: extracted!,
        rule: "CROSS-CHECK: Appellation matches application",
        details: "Appellation found in extracted value with additional text",
      };
    }
  }

  // Check for minor misspellings (similar strings with 1-2 character differences)
  // This handles OCR errors and typos
  if (isSimilarString(expected, extracted)) {
    return {
      field: "appellation",
      status: MatchStatus.SOFT_MISMATCH,
      expected: expected!,
      extracted: extracted!,
      rule: "CROSS-CHECK: Appellation must match application",
      details:
        "Minor spelling difference detected (possible OCR error or typo)",
    };
  }

  return {
    field: "appellation",
    status: MatchStatus.HARD_MISMATCH,
    expected: expected!,
    extracted: extracted!,
    rule: "CROSS-CHECK: Appellation must match application",
    details: "Appellation does not match application",
  };
}

/**
 * Validate Wine Class/Type (wine only)
 * REQUIRED on label (PRESENCE check only).
 * If application has a varietal, the classType IS the varietal and must be cross-checked.
 */
export function validateWineVarietal(
  application: ApplicationData,
  extracted: string | null,
): FieldValidationResult {
  const expectedVarietal = application.varietal;

  // Class/Type is REQUIRED on wine labels
  if (!extracted) {
    // If application has varietal, show it as expected; otherwise show requirement message
    const expectedValue = valueExists(expectedVarietal)
      ? expectedVarietal!
      : "Required (see details)";

    return {
      field: "classType",
      status: MatchStatus.NOT_FOUND,
      expected: expectedValue,
      extracted: "Field not found",
      rule: "PRESENCE: Class/type designation must appear on wine label",
      details: "Class/type designation is required on the label",
    };
  }

  // If application has a varietal, the classType IS the varietal and must be cross-checked
  if (valueExists(expectedVarietal)) {
    // Cross-check: classType must match application varietal
    if (stringsMatch(expectedVarietal, extracted)) {
      if (isSoftMismatch(expectedVarietal, extracted)) {
        return {
          field: "classType",
          status: MatchStatus.SOFT_MISMATCH,
          expected: expectedVarietal!,
          extracted: extracted!,
          rule: "PRESENCE + CROSS-CHECK: Class/type (varietal) must match application",
          details: "Case or formatting difference detected",
        };
      }
      return {
        field: "classType",
        status: MatchStatus.MATCH,
        expected: expectedVarietal!,
        extracted: extracted!,
        rule: "PRESENCE + CROSS-CHECK: Class/type (varietal) present and matches application",
      };
    }

    // Check for minor misspellings (similar strings with 1-2 character differences)
    // This handles OCR errors and typos
    if (isSimilarString(expectedVarietal, extracted)) {
      return {
        field: "classType",
        status: MatchStatus.SOFT_MISMATCH,
        expected: expectedVarietal!,
        extracted: extracted!,
        rule: "PRESENCE + CROSS-CHECK: Class/type (varietal) must match application",
        details:
          "Minor spelling difference detected (possible OCR error or typo)",
      };
    }

    return {
      field: "classType",
      status: MatchStatus.HARD_MISMATCH,
      expected: expectedVarietal!,
      extracted: extracted!,
      rule: "PRESENCE + CROSS-CHECK: Class/type (varietal) must match application",
      details: "Class/type does not match application varietal",
    };
  }

  // Application doesn't have varietal - classType just needs to be present (no cross-check)
  return {
    field: "classType",
    status: MatchStatus.MATCH,
    expected: null,
    extracted: extracted!,
    rule: "PRESENCE: Class/type designation present on label",
  };
}

/**
 * Validate Vintage Date (wine only)
 * If present on label, must match application
 */
export function validateVintageDate(
  application: ApplicationData,
  extracted: string | null,
): FieldValidationResult {
  const expected = application.vintageDate;

  const expectedExists = valueExists(expected);
  const extractedExists = valueExists(extracted);

  // Neither has vintage date - that's OK
  if (!expectedExists && !extractedExists) {
    return {
      field: "vintageDate",
      status: MatchStatus.NOT_APPLICABLE,
      expected: null,
      extracted: null,
      rule: "CROSS-CHECK: Vintage date not specified in application or on label",
    };
  }

  // Application has vintage but label doesn't
  if (expectedExists && !extractedExists) {
    return {
      field: "vintageDate",
      status: MatchStatus.NOT_FOUND,
      expected: expected!,
      extracted: "Field not found",
      rule: "CROSS-CHECK: Vintage date in application must appear on label",
      details:
        "Application specifies a vintage date but it was not found on the label",
    };
  }

  // Label has vintage but application doesn't
  if (!expectedExists && extractedExists) {
    return {
      field: "vintageDate",
      status: MatchStatus.HARD_MISMATCH,
      expected: null,
      extracted: extracted!,
      rule: "CROSS-CHECK: Vintage date on label must be in application",
      details: "Label contains a vintage date not listed in the application",
    };
  }

  // Both have vintage dates - check if they match
  if (stringsMatch(expected, extracted)) {
    if (isSoftMismatch(expected, extracted)) {
      return {
        field: "vintageDate",
        status: MatchStatus.SOFT_MISMATCH,
        expected: expected!,
        extracted: extracted!,
        rule: "CROSS-CHECK: Vintage date must match application",
        details: "Minor formatting difference detected",
      };
    }
    return {
      field: "vintageDate",
      status: MatchStatus.MATCH,
      expected: expected!,
      extracted: extracted!,
      rule: "CROSS-CHECK: Vintage date matches application",
    };
  }

  // Check for minor misspellings (similar strings with 1-2 character differences)
  // This handles OCR errors and typos
  if (isSimilarString(expected, extracted)) {
    return {
      field: "vintageDate",
      status: MatchStatus.SOFT_MISMATCH,
      expected: expected!,
      extracted: extracted!,
      rule: "CROSS-CHECK: Vintage date must match application",
      details:
        "Minor spelling difference detected (possible OCR error or typo)",
    };
  }

  return {
    field: "vintageDate",
    status: MatchStatus.HARD_MISMATCH,
    expected: expected!,
    extracted: extracted!,
    rule: "CROSS-CHECK: Vintage date must match application",
    details: "Vintage dates do not match",
  };
}

/**
 * Validate Sulfite Declaration (REQUIRED for wine)
 * Rule: "No sulfites added" may be stated but must appear together with
 * "contains naturally occurring sulfites" or "may contain naturally occurring sulfites."
 */
export function validateSulfiteDeclaration(
  extracted: string | null,
): FieldValidationResult {
  if (!extracted) {
    return {
      field: "sulfiteDeclaration",
      status: MatchStatus.NOT_FOUND,
      expected: null,
      extracted: null,
      rule: "PRESENCE: Sulfite declaration must appear on wine label",
    };
  }

  // Normalize the extracted text for checking
  const normalized = normalizeString(extracted);

  // Check if "no sulfites added" appears (case-insensitive)
  const hasNoSulfitesAdded = /\bno\s+sulfites?\s+added\b/i.test(normalized);

  if (hasNoSulfitesAdded) {
    // If "no sulfites added" is present, check if it appears with required phrase
    const hasContainsNaturallyOccurring =
      /\bcontains?\s+naturally\s+occurring\s+sulfites?\b/i.test(normalized);
    const hasMayContainNaturallyOccurring =
      /\bmay\s+contain\s+naturally\s+occurring\s+sulfites?\b/i.test(normalized);

    if (!hasContainsNaturallyOccurring && !hasMayContainNaturallyOccurring) {
      // "No sulfites added" is present but missing required phrase
      return {
        field: "sulfiteDeclaration",
        status: MatchStatus.HARD_MISMATCH,
        expected: null,
        extracted,
        rule: 'FORMAT: "No sulfites added" must appear together with "contains naturally occurring sulfites" or "may contain naturally occurring sulfites"',
        details:
          'Label states "no sulfites added" but is missing required phrase about naturally occurring sulfites',
      };
    }
  }

  return {
    field: "sulfiteDeclaration",
    status: MatchStatus.MATCH,
    expected: null,
    extracted,
    rule: "PRESENCE: Sulfite declaration present on label",
  };
}

/**
 * Validate Foreign Wine Percentage (wine only)
 * Required on blends of American and foreign wines if any reference to foreign wine is made
 */
export function validateForeignWinePercentage(
  extraction: WineExtractionResult["extraction"],
): FieldValidationResult {
  const foreignWinePercentage = extraction.foreignWinePercentage;

  // Check if there's any indication of foreign wine on the label
  const hasForeignWineReference = checkForForeignWineReference(extraction);

  // If no foreign wine reference, this field is not applicable
  if (!hasForeignWineReference) {
    return {
      field: "foreignWinePercentage",
      status: MatchStatus.NOT_APPLICABLE,
      expected: null,
      extracted: foreignWinePercentage,
      rule: "PRESENCE: Foreign wine percentage only required if label references foreign wine",
    };
  }

  // Foreign wine is referenced but no percentage statement
  if (!foreignWinePercentage) {
    return {
      field: "foreignWinePercentage",
      status: MatchStatus.NOT_FOUND,
      expected: "Field not found",
      extracted: null,
      rule: "PRESENCE: Foreign wine percentage required when label references foreign wine",
      details:
        "Label appears to reference foreign wine but no percentage statement was found",
    };
  }

  return {
    field: "foreignWinePercentage",
    status: MatchStatus.MATCH,
    expected: null,
    extracted: foreignWinePercentage,
    rule: "PRESENCE: Foreign wine percentage present on label",
  };
}

/**
 * Helper: Check if the wine label contains any reference to foreign wine
 */
function checkForForeignWineReference(
  extraction: WineExtractionResult["extraction"],
): boolean {
  // If there's already a foreignWinePercentage, there's definitely a reference
  if (valueExists(extraction.foreignWinePercentage)) {
    return true;
  }

  // Check if appellation mentions a foreign region
  const foreignIndicators = [
    "france",
    "french",
    "italy",
    "italian",
    "spain",
    "spanish",
    "germany",
    "german",
    "portugal",
    "portuguese",
    "argentina",
    "chile",
    "chilean",
    "australia",
    "australian",
    "new zealand",
    "south africa",
    "austria",
    "austrian",
    "greece",
    "greek",
  ];

  const appellation = normalizeString(extraction.appellation);
  const countryOfOrigin = normalizeString(extraction.countryOfOrigin);

  // If there's a non-US country of origin mentioned, check if it's for a blend
  for (const indicator of foreignIndicators) {
    if (
      appellation.includes(indicator) ||
      countryOfOrigin.includes(indicator)
    ) {
      // If the entire wine is foreign (imported), foreignWinePercentage is N/A
      // This rule only applies to BLENDS of American and foreign wine
      return false; // Fully imported wines don't need percentage
    }
  }

  return false;
}
