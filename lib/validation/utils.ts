// ============================================================
// TTB Validation Utility Functions
// ============================================================

import { REQUIRED_HEALTH_WARNING } from './constants';

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
