import { describe, it, expect } from 'vitest';
import { normalizeText, verifyApplication, determineApplicationStatus } from '@/lib/verification';
import { stringsMatch, isSoftMismatch, normalizeString } from '@/lib/validation';
import { BeverageType, OriginType } from '@/lib/validation';
import type { ExtractedData } from '@/types/database';

describe('Verification Utilities', () => {
  describe('normalizeText', () => {
    it('should normalize text to lowercase and trim', () => {
      expect(normalizeText('  OLD TOM  ')).toBe('old tom');
    });

    it('should remove extra spaces', () => {
      expect(normalizeText('Old    Tom')).toBe('old tom');
    });
  });

  describe('stringsMatch', () => {
    it('should match exact strings', () => {
      expect(stringsMatch('Old Tom', 'Old Tom')).toBe(true);
    });

    it('should match normalized strings', () => {
      expect(stringsMatch('OLD TOM', 'old tom')).toBe(true);
    });

    it('should not match different strings', () => {
      expect(stringsMatch('Old Tom', 'New Tom')).toBe(false);
    });
  });

  describe('isSoftMismatch', () => {
    it('should NOT treat case-only differences as soft mismatch (they are matches)', () => {
      // Case-only differences are now treated as exact matches, not soft mismatches
      expect(isSoftMismatch('OLD TOM', 'old tom')).toBe(false);
    });

    it('should NOT treat extra whitespace as soft mismatch (whitespace is normalized)', () => {
      // Extra whitespace is collapsed during normalization, so 'Old  Tom' matches 'Old Tom'
      // This is considered a MATCH, not a soft mismatch
      expect(isSoftMismatch('Old  Tom', 'Old Tom')).toBe(false);
    });

    it('should NOT treat punctuation differences as soft mismatch (different content)', () => {
      // Punctuation affects the normalized string, so 'Test, Inc.' !== 'Test Inc'
      // This means normalized strings don't match, so it's not a soft mismatch
      expect(isSoftMismatch('Test, Inc.', 'Test Inc')).toBe(false);
    });

    it('should not match hard mismatches', () => {
      expect(isSoftMismatch('Old Tom', 'New Tom')).toBe(false);
    });

    it('should not match strings with different content', () => {
      // Different content - not a soft mismatch (would be hard mismatch)
      expect(isSoftMismatch('45%', '45% Alc./Vol.')).toBe(false);
    });
  });

  // Note: verifyHealthWarning and verifyField are now internal to the validation module
  // These tests are kept for reference but the functions are tested through verifyApplication

  describe('verifyApplication', () => {
    it('should verify all fields in application data', () => {
      const applicationData = {
        id: '1',
        beverageType: BeverageType.BEER,
        originType: OriginType.DOMESTIC,
        brandName: 'Old Tom',
        producerName: 'Test Brewery',
        producerAddress: { city: 'Test City', state: 'CA' },
        labelImages: [],
      };

      const extracted: ExtractedData = {
        brand_name: { value: 'Old Tom', confidence: 0 },
        // Use valid TTB format: "XX% Alc/Vol" not just "XX%"
        alcohol_content: { value: '5% Alc/Vol', confidence: 0 },
      };

      const result = verifyApplication(applicationData, extracted);
      expect(result.brand_name?.type).toBe('match');
      // For beer, alcohol content is a PRESENCE check (not cross-check)
      // A valid format like "5% Alc/Vol" should pass
      expect(result.alcohol_content?.type).toBe('match');
    });

    it('should handle missing fields', () => {
      const applicationData = {
        id: '1',
        beverageType: BeverageType.BEER,
        originType: OriginType.DOMESTIC,
        brandName: 'Old Tom',
        producerName: 'Test Brewery',
        producerAddress: { city: 'Test City', state: 'CA' },
        labelImages: [],
      };

      const extracted: ExtractedData = {};

      const result = verifyApplication(applicationData, extracted);
      expect(result.brand_name?.type).toBe('not_found');
    });
  });

  describe('determineApplicationStatus', () => {
    it('should return pending for hard mismatches', () => {
      const result = {
        brand_name: { type: 'hard_mismatch', match: false } as any,
      };
      expect(determineApplicationStatus(result)).toBe('pending');
    });

    it('should return pending for soft mismatches (no longer uses needs_review)', () => {
      // Note: needs_review status is no longer used - all applications stay pending for agent review
      const result = {
        brand_name: { type: 'soft_mismatch', match: false } as any,
      };
      expect(determineApplicationStatus(result)).toBe('pending');
    });

    it('should return pending for all matches (needs agent approval)', () => {
      const result = {
        brand_name: { type: 'match', match: true } as any,
      };
      expect(determineApplicationStatus(result)).toBe('pending');
    });
  });
});
