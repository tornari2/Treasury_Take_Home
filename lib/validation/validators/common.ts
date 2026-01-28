// ============================================================
// Common Field Validators (used across all beverage types)
// ============================================================

import { MatchStatus, ApplicationData, FieldValidationResult } from '../types';
import {
  ALCOHOL_CONTENT_PATTERNS,
  NET_CONTENTS_PATTERNS,
  REQUIRED_HEALTH_WARNING,
} from '../constants';
import { OriginType } from '../types';
import {
  stringsMatch,
  isSoftMismatch,
  matchesAnyPattern,
  valueExists,
  healthWarningMatchesExact,
  normalizeString,
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
      expected,
      extracted: null,
      rule: 'PRESENCE: Brand name must appear on label',
    };
  }

  if (stringsMatch(expected, extracted)) {
    if (isSoftMismatch(expected, extracted)) {
      return {
        field: 'brandName',
        status: MatchStatus.SOFT_MISMATCH,
        expected,
        extracted,
        rule: 'CROSS-CHECK: Brand name must match application',
        details: 'Case or formatting difference detected',
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
      extracted: null,
      rule: 'CROSS-CHECK: Fanciful name in application must appear on label',
      details: 'Application specifies a fanciful name but it was not found on the label',
    };
  }

  if (!expectedExists && extractedExists) {
    return {
      field: 'fancifulName',
      status: MatchStatus.HARD_MISMATCH,
      expected: null,
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
      expected: null,
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
 * Required for wine and spirits. For beer, missing is surfaced but doesn't fail validation.
 */
export function validateAlcoholContent(extracted: string | null): FieldValidationResult {
  if (!extracted) {
    return {
      field: 'alcoholContent',
      status: MatchStatus.NOT_FOUND,
      expected: null,
      extracted: null,
      rule: 'PRESENCE: Alcohol content must appear on label',
    };
  }

  const validFormat = matchesAnyPattern(extracted, ALCOHOL_CONTENT_PATTERNS);
  if (!validFormat) {
    return {
      field: 'alcoholContent',
      status: MatchStatus.SOFT_MISMATCH,
      expected: 'Format: "XX% Alc/Vol" or similar',
      extracted,
      rule: 'FORMAT: Alcohol content must use acceptable format',
      details: 'Format may not meet TTB requirements',
    };
  }

  return {
    field: 'alcoholContent',
    status: MatchStatus.MATCH,
    expected: null,
    extracted,
    rule: 'PRESENCE + FORMAT: Alcohol content present and properly formatted',
  };
}

/**
 * Validate Net Contents
 */
export function validateNetContents(extracted: string | null): FieldValidationResult {
  if (!extracted) {
    return {
      field: 'netContents',
      status: MatchStatus.NOT_FOUND,
      expected: null,
      extracted: null,
      rule: 'PRESENCE: Net contents must appear on label',
    };
  }

  const allPatterns = [...NET_CONTENTS_PATTERNS.metric, ...NET_CONTENTS_PATTERNS.usCustomary];

  const validFormat = matchesAnyPattern(extracted, allPatterns);
  if (!validFormat) {
    return {
      field: 'netContents',
      status: MatchStatus.SOFT_MISMATCH,
      expected: 'Format: "750 mL", "1 L", "12 fl oz", etc.',
      extracted,
      rule: 'FORMAT: Net contents must use acceptable format',
      details: 'Format may not meet TTB requirements',
    };
  }

  return {
    field: 'netContents',
    status: MatchStatus.MATCH,
    expected: null,
    extracted,
    rule: 'PRESENCE + FORMAT: Net contents present and properly formatted',
  };
}

/**
 * Validate Producer Name and Address
 */
export function validateProducerNameAddress(
  application: ApplicationData,
  extractedName: string | null,
  extractedAddress: string | null
): FieldValidationResult {
  const expectedName = application.producerName;
  const expectedCity = application.producerAddress.city;
  const expectedState = application.producerAddress.state;

  if (!extractedName && !extractedAddress) {
    return {
      field: 'producerNameAddress',
      status: MatchStatus.NOT_FOUND,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: null,
      rule: 'PRESENCE: Name and address must appear on label',
    };
  }

  const nameMatches = extractedName && stringsMatch(expectedName, extractedName);
  const nameSoftMismatch = extractedName && isSoftMismatch(expectedName, extractedName);

  const addressContainsCity =
    extractedAddress && normalizeString(extractedAddress).includes(normalizeString(expectedCity));
  const addressContainsState =
    extractedAddress && normalizeString(extractedAddress).includes(normalizeString(expectedState));

  if (!nameMatches && extractedName) {
    return {
      field: 'producerNameAddress',
      status: MatchStatus.HARD_MISMATCH,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
      rule: 'CROSS-CHECK: Producer name must match application',
      details: 'Producer name does not match',
    };
  }

  if (!addressContainsCity || !addressContainsState) {
    return {
      field: 'producerNameAddress',
      status: MatchStatus.HARD_MISMATCH,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
      rule: 'CROSS-CHECK: Address (city, state) must match application',
      details: 'City or state does not match',
    };
  }

  if (nameSoftMismatch) {
    return {
      field: 'producerNameAddress',
      status: MatchStatus.SOFT_MISMATCH,
      expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
      extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
      rule: 'CROSS-CHECK: Name and address must match application',
      details: 'Minor formatting difference in name',
    };
  }

  return {
    field: 'producerNameAddress',
    status: MatchStatus.MATCH,
    expected: `${expectedName}, ${expectedCity}, ${expectedState}`,
    extracted: `${extractedName || ''}, ${extractedAddress || ''}`,
    rule: 'CROSS-CHECK: Name and address match application',
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
      extracted: null,
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
 * Required for imported products. No cross-checking - filled in by TTB agents.
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
      expected: null,
      extracted,
      rule: 'PRESENCE: Country of origin not required for domestic products',
    };
  }

  // Imported products require country of origin
  if (!extracted) {
    return {
      field: 'countryOfOrigin',
      status: MatchStatus.NOT_FOUND,
      expected: 'Country of origin required for imported products',
      extracted: null,
      rule: 'PRESENCE: Country of origin must appear on label for imported products',
    };
  }

  // Country of origin is present - no cross-checking needed (filled by TTB agents)
  return {
    field: 'countryOfOrigin',
    status: MatchStatus.MATCH,
    expected: null,
    extracted,
    rule: 'PRESENCE: Country of origin present on label',
  };
}
