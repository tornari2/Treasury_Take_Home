// ============================================================
// Spirits-Specific Field Validators
// ============================================================

import { MatchStatus, FieldValidationResult } from '../types';

/**
 * Validate Age Statement (REQUIRED for spirits)
 */
export function validateAgeStatement(extracted: string | null): FieldValidationResult {
  if (!extracted) {
    return {
      field: 'ageStatement',
      status: MatchStatus.NOT_FOUND,
      expected: 'Field not found',
      extracted: null,
      rule: 'PRESENCE: Age statement must appear on spirits label',
    };
  }

  return {
    field: 'ageStatement',
    status: MatchStatus.MATCH,
    expected: null,
    extracted,
    rule: 'PRESENCE: Age statement present on label',
  };
}
