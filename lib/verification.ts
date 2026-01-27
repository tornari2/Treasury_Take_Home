import type { ExpectedLabelData, ExtractedData, VerificationResult } from '@/types/database';

/**
 * Normalize text for comparison (lowercase, trim, remove extra spaces)
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if two texts match (exact or normalized)
 */
export function textsMatch(expected: string, extracted: string): boolean {
  if (expected === extracted) return true;
  return normalizeText(expected) === normalizeText(extracted);
}

/**
 * Check if it's a soft mismatch (trivial formatting difference)
 */
export function isSoftMismatch(expected: string, extracted: string): boolean {
  const normalizedExpected = normalizeText(expected);
  const normalizedExtracted = normalizeText(extracted);

  // Case differences only
  if (normalizedExpected === normalizedExtracted && expected !== extracted) {
    return true;
  }

  // Punctuation differences (e.g., "45%" vs "45% Alc./Vol.")
  // Check if the core numeric/alphanumeric content matches
  const expectedClean = normalizedExpected.replace(/[^\w\s]/g, '').trim();
  const extractedClean = normalizedExtracted.replace(/[^\w\s]/g, '').trim();

  // If cleaned versions match, it's a soft mismatch
  if (expectedClean === extractedClean && expectedClean.length > 0) {
    return true;
  }

  // Also check if extracted contains the expected (for cases like "45%" in "45% Alc./Vol.")
  if (extractedClean.includes(expectedClean) && expectedClean.length > 0) {
    return true;
  }

  return false;
}

/**
 * Verify health warning with strict validation
 */
export function verifyHealthWarning(
  expected: string,
  extracted: string
): {
  match: boolean;
  type: 'match' | 'hard_mismatch';
} {
  // Health warning must be exact match
  if (expected === extracted) {
    return { match: true, type: 'match' };
  }

  // Check if "GOVERNMENT WARNING:" is in all caps
  const extractedUpper = extracted.toUpperCase();

  // Must start with "GOVERNMENT WARNING:" in all caps
  if (!extractedUpper.startsWith('GOVERNMENT WARNING:')) {
    return { match: false, type: 'hard_mismatch' };
  }

  // Full text must match exactly
  if (expected !== extracted) {
    return { match: false, type: 'hard_mismatch' };
  }

  return { match: true, type: 'match' };
}

/**
 * Verify a single field
 */
export function verifyField(
  fieldName: string,
  expected: string | undefined,
  extracted: { value: string; confidence: number } | undefined
): {
  match: boolean;
  type: 'match' | 'soft_mismatch' | 'hard_mismatch' | 'not_found';
  expected?: string;
  extracted?: string;
} {
  // Field not found
  if (!extracted || !extracted.value) {
    return {
      match: false,
      type: 'not_found',
      expected,
    };
  }

  // No expected value
  if (!expected) {
    return {
      match: true,
      type: 'match',
      extracted: extracted.value,
    };
  }

  // Health warning requires strict validation
  if (fieldName === 'health_warning') {
    const result = verifyHealthWarning(expected, extracted.value);
    return {
      match: result.match,
      type: result.type,
      expected,
      extracted: extracted.value,
    };
  }

  // Exact match (case-sensitive)
  if (expected === extracted.value) {
    return {
      match: true,
      type: 'match',
      expected,
      extracted: extracted.value,
    };
  }

  // Normalized match (case-insensitive but same text)
  if (normalizeText(expected) === normalizeText(extracted.value)) {
    return {
      match: false,
      type: 'soft_mismatch',
      expected,
      extracted: extracted.value,
    };
  }

  // Soft mismatch (formatting differences)
  if (isSoftMismatch(expected, extracted.value)) {
    return {
      match: false,
      type: 'soft_mismatch',
      expected,
      extracted: extracted.value,
    };
  }

  // Hard mismatch (material difference)
  return {
    match: false,
    type: 'hard_mismatch',
    expected,
    extracted: extracted.value,
  };
}

/**
 * Verify all fields in expected label data against extracted data
 */
export function verifyApplication(
  expectedLabelData: ExpectedLabelData,
  extractedData: ExtractedData
): VerificationResult {
  const result: VerificationResult = {};

  // Verify each expected field
  for (const [fieldName, expectedValue] of Object.entries(expectedLabelData)) {
    if (expectedValue) {
      const extracted = extractedData[fieldName];
      result[fieldName] = verifyField(fieldName, expectedValue, extracted);
    }
  }

  return result;
}

/**
 * Determine overall application status based on verification results
 */
export function determineApplicationStatus(
  verificationResult: VerificationResult
): 'pending' | 'needs_review' | 'approved' | 'rejected' {
  const hasHardMismatch = Object.values(verificationResult).some(
    (r) => r.type === 'hard_mismatch' || r.type === 'not_found'
  );
  const hasSoftMismatch = Object.values(verificationResult).some((r) => r.type === 'soft_mismatch');

  // Hard mismatches or missing fields - needs agent review (stays pending)
  if (hasHardMismatch) {
    return 'pending';
  }

  // Soft mismatches - auto-flag for review
  if (hasSoftMismatch) {
    return 'needs_review';
  }

  // All match - ready for agent approval (stays pending until agent approves)
  return 'pending';
}
