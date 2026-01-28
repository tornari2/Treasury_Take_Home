import { describe, it, expect } from 'vitest';
import { normalizeText, verifyApplication, determineApplicationStatus } from '@/lib/verification';
import { stringsMatch, isSoftMismatch, normalizeString } from '@/lib/validation';
import { BeverageType } from '@/lib/validation';
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
    it('should detect case differences', () => {
      expect(isSoftMismatch('OLD TOM', 'old tom')).toBe(true);
    });

    it('should detect punctuation differences', () => {
      // This should be a soft mismatch because the core value (45) matches
      // The extracted has additional text but same core number
      expect(isSoftMismatch('45%', '45% Alc./Vol.')).toBe(true);
    });

    it('should not match hard mismatches', () => {
      expect(isSoftMismatch('Old Tom', 'New Tom')).toBe(false);
    });
  });

  // Note: verifyHealthWarning and verifyField are now internal to the validation module
  // These tests are kept for reference but the functions are tested through verifyApplication

  describe('verifyApplication', () => {
    it('should verify all fields in application data', () => {
      const applicationData = {
        id: '1',
        beverageType: BeverageType.BEER,
        originCode: '00',
        brandName: 'Old Tom',
        producerName: 'Test Brewery',
        producerAddress: { city: 'Test City', state: 'CA' },
        labelImages: [],
      };

      const extracted: ExtractedData = {
        brand_name: { value: 'Old Tom', confidence: 0.98 },
        alcohol_content: { value: '45%', confidence: 0.95 },
      };

      const result = verifyApplication(applicationData, extracted);
      expect(result.brand_name?.type).toBe('match');
      expect(result.alcohol_content?.type).toBe('match');
    });

    it('should handle missing fields', () => {
      const applicationData = {
        id: '1',
        beverageType: BeverageType.BEER,
        originCode: '00',
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

    it('should return needs_review for soft mismatches', () => {
      const result = {
        brand_name: { type: 'soft_mismatch', match: false } as any,
      };
      expect(determineApplicationStatus(result)).toBe('needs_review');
    });

    it('should return pending for all matches (needs agent approval)', () => {
      const result = {
        brand_name: { type: 'match', match: true } as any,
      };
      expect(determineApplicationStatus(result)).toBe('pending');
    });
  });
});
