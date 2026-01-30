// ============================================================
// Spirits-Specific Field Validators
// ============================================================

import { MatchStatus, FieldValidationResult } from "../types";

/**
 * Approved age statement formats (regex patterns)
 */
const APPROVED_AGE_FORMATS = [
  /^\s*(\d+(?:\.\d+)?)\s+years?\s+old\s*$/i, // "X years old" or "X year old"
  /^\s*(\d+(?:\.\d+)?)\s+months?\s+old\s*$/i, // "X months old" or "X month old"
  /^\s*Aged\s+(\d+(?:\.\d+)?)\s+years?\s*$/i, // "Aged X years" or "Aged X year"
  /^\s*Aged\s+at\s+least\s+(\d+(?:\.\d+)?)\s+years?\s*$/i, // "Aged at least X years"
  /^\s*Aged\s+a\s+minimum\s+of\s+(\d+(?:\.\d+)?)\s+months?\s*$/i, // "Aged a minimum of X months"
  /^\s*Over\s+(\d+(?:\.\d+)?)\s+years?\s+old\s*$/i, // "Over X years old"
  /^\s*Aged\s+not\s+less\s+than\s+(\d+(?:\.\d+)?)\s+years?\s*$/i, // "Aged not less than X years"
  /^\s*(\d+(?:\.\d+)?)%\s+whisky\s+aged\s+(\d+(?:\.\d+)?)\s+years?;?\s*(\d+(?:\.\d+)?)%\s+whisky\s+aged\s+(\d+(?:\.\d+)?)\s+years?\s*$/i, // "X% whisky aged Y years; Z% whisky aged W years"
];

/**
 * Check if classType indicates whisky (any spelling variation)
 */
function isWhisky(classType: string | null): boolean {
  if (!classType) return false;
  const normalized = classType.toLowerCase();
  return (
    normalized.includes("whisky") ||
    normalized.includes("whiskey") ||
    normalized.includes("whiskie")
  );
}

/**
 * Check if classType indicates grape lees, pomace, or marc brandy
 */
function isGrapeLeesPomaceMarcBrandy(classType: string | null): boolean {
  if (!classType) return false;
  const normalized = classType.toLowerCase();
  return (
    normalized.includes("grape lees") ||
    normalized.includes("grape pomace") ||
    normalized.includes("grape marc") ||
    normalized.includes("lees brandy") ||
    normalized.includes("pomace brandy") ||
    normalized.includes("marc brandy")
  );
}

/**
 * Parse age value from age statement string
 * Returns the age in years (converts months to years if needed)
 * Returns null if age cannot be parsed
 */
function parseAgeFromStatement(ageStatement: string): number | null {
  if (!ageStatement) return null;

  // Try each approved format
  for (const pattern of APPROVED_AGE_FORMATS) {
    const match = ageStatement.match(pattern);
    if (match) {
      // For blended whisky format, return the minimum age
      if (match.length > 2) {
        const ages = match.slice(1).filter((m) => m && !isNaN(parseFloat(m)));
        if (ages.length > 0) {
          return Math.min(...ages.map((a) => parseFloat(a)));
        }
      } else if (match[1]) {
        const age = parseFloat(match[1]);
        // Check if it's months (for "months old" or "minimum of X months")
        if (
          /months?/i.test(ageStatement) &&
          !/years?/i.test(ageStatement.split(match[1])[1] || "")
        ) {
          return age / 12; // Convert months to years
        }
        return age;
      }
    }
  }

  return null;
}

/**
 * Validate age statement format
 * Returns true if format matches one of the approved formats
 */
function isValidAgeFormat(ageStatement: string): boolean {
  if (!ageStatement) return false;
  return APPROVED_AGE_FORMATS.some((pattern) =>
    pattern.test(ageStatement.trim()),
  );
}

/**
 * Check if age statement is mandatory based on classType and age value
 * Age statement is mandatory for:
 * - Whisky aged less than 4 years
 * - Grape lees, pomace, or marc brandy aged less than 2 years
 * - Distilled spirits labeled with certain miscellaneous age references (handled separately)
 * - Distilled spirits labeled with a distillation date (handled separately)
 *
 * Note: We can only determine if it was mandatory AFTER parsing the age from the statement.
 * If no statement exists, we cannot determine if it was required.
 */
function requiresAgeStatement(classType: string | null): boolean {
  if (!classType) return false;

  // Whisky and grape lees/pomace/marc brandy may require age statements
  // but we need the age value to determine if it's mandatory
  return isWhisky(classType) || isGrapeLeesPomaceMarcBrandy(classType);
}

/**
 * Check if the age value makes the statement mandatory
 */
function isAgeValueRequiringStatement(
  classType: string | null,
  age: number | null,
): boolean {
  if (!classType || age === null) return false;

  if (isWhisky(classType)) {
    return age < 4;
  }

  if (isGrapeLeesPomaceMarcBrandy(classType)) {
    return age < 2;
  }

  return false;
}

/**
 * Validate Age Statement
 *
 * Mandatory for:
 * - Whisky aged less than 4 years
 * - Grape lees, grape pomace, or grape marc brandy aged less than 2 years
 * - Distilled spirits labeled with certain miscellaneous age references
 * - Distilled spirits labeled with a distillation date
 *
 * If present, must be in an approved format:
 * - "X years old" / "X year old"
 * - "X months old" / "X month old"
 * - "Aged X years" / "Aged X year"
 * - "Aged at least X years"
 * - "Aged a minimum of X months"
 * - "Over X years old"
 * - "Aged not less than X years"
 * - "X% whisky aged Y years; Z% whisky aged W years"
 */
export function validateAgeStatement(
  extracted: string | null,
  classType: string | null,
): FieldValidationResult {
  // Check if this spirit type may require an age statement
  const mayRequireStatement = requiresAgeStatement(classType);

  // If age statement is not present
  if (!extracted) {
    // If this spirit type doesn't typically require age statements, return NOT_APPLICABLE
    if (!mayRequireStatement) {
      return {
        field: "ageStatement",
        status: MatchStatus.NOT_APPLICABLE,
        expected: "N/A - Not required for Class or Type",
        extracted: null,
        rule: "Age statement not required for this spirit type",
      };
    }

    // For whisky or grape lees/pomace/marc brandy, we can't determine if statement is required
    // without knowing the age. Since we don't have the age, we can't definitively say it's missing.
    // Return NOT_APPLICABLE with a note that it may be required.
    return {
      field: "ageStatement",
      status: MatchStatus.NOT_APPLICABLE,
      expected: "N/A - Not required for Class or Type",
      extracted: null,
      rule: isWhisky(classType)
        ? "Age statement may be required for whisky aged less than 4 years (cannot verify without age statement)"
        : isGrapeLeesPomaceMarcBrandy(classType)
          ? "Age statement may be required for grape lees/pomace/marc brandy aged less than 2 years (cannot verify without age statement)"
          : "Age statement may be required (cannot verify without age statement)",
    };
  }

  // Age statement is present - validate format first
  if (!isValidAgeFormat(extracted)) {
    return {
      field: "ageStatement",
      status: MatchStatus.HARD_MISMATCH,
      expected: "Age statement in approved format",
      extracted,
      rule: 'Age statement must be in an approved format. Acceptable formats: "X years old", "X months old", "Aged X years", "Aged at least X years", "Aged a minimum of X months", "Over X years old", "Aged not less than X years", or "X% whisky aged Y years; Z% whisky aged W years"',
    };
  }

  // Format is valid - parse the age and check if statement was required
  const age = parseAgeFromStatement(extracted);
  if (age !== null && mayRequireStatement) {
    const wasRequired = isAgeValueRequiringStatement(classType, age);
    if (wasRequired) {
      // Age statement was required and is present with valid format
      return {
        field: "ageStatement",
        status: MatchStatus.MATCH,
        expected: null,
        extracted,
        rule: isWhisky(classType)
          ? `Age statement required and present for whisky aged ${age} years (< 4 years)`
          : `Age statement required and present for grape lees/pomace/marc brandy aged ${age} years (< 2 years)`,
      };
    }
  }

  // Age statement is present with valid format (may or may not have been required)
  return {
    field: "ageStatement",
    status: MatchStatus.MATCH,
    expected: null,
    extracted,
    rule: "Age statement present and in approved format",
  };
}
