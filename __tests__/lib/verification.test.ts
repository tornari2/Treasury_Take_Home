import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  textsMatch,
  isSoftMismatch,
  verifyHealthWarning,
  verifyField,
  verifyApplication,
  determineApplicationStatus,
} from '@/lib/verification';
import type { ExpectedLabelData, ExtractedData } from '@/types/database';

describe('Verification Utilities', () => {
  describe('normalizeText', () => {
    it('should normalize text to lowercase and trim', () => {
      expect(normalizeText('  OLD TOM  ')).toBe('old tom');
    });

    it('should remove extra spaces', () => {
      expect(normalizeText('Old    Tom')).toBe('old tom');
    });
  });

  describe('textsMatch', () => {
    it('should match exact strings', () => {
      expect(textsMatch('Old Tom', 'Old Tom')).toBe(true);
    });

    it('should match normalized strings', () => {
      expect(textsMatch('OLD TOM', 'old tom')).toBe(true);
    });

    it('should not match different strings', () => {
      expect(textsMatch('Old Tom', 'New Tom')).toBe(false);
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

  describe('verifyHealthWarning', () => {
    const exactWarning =
      'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.';

    it('should match exact health warning', () => {
      const result = verifyHealthWarning(exactWarning, exactWarning);
      expect(result.match).toBe(true);
      expect(result.type).toBe('match');
    });

    it('should reject case differences', () => {
      const wrongCase = exactWarning.toLowerCase();
      const result = verifyHealthWarning(exactWarning, wrongCase);
      expect(result.match).toBe(false);
      expect(result.type).toBe('hard_mismatch');
    });

    it('should reject missing prefix', () => {
      const noPrefix = exactWarning.replace('GOVERNMENT WARNING:', 'Government Warning:');
      const result = verifyHealthWarning(exactWarning, noPrefix);
      expect(result.match).toBe(false);
      expect(result.type).toBe('hard_mismatch');
    });
  });

  describe('verifyField', () => {
    it('should return not_found for missing extracted value', () => {
      const result = verifyField('brand_name', 'Old Tom', undefined);
      expect(result.type).toBe('not_found');
      expect(result.match).toBe(false);
    });

    it('should return match for exact match', () => {
      const result = verifyField('brand_name', 'Old Tom', { value: 'Old Tom', confidence: 0.98 });
      expect(result.type).toBe('match');
      expect(result.match).toBe(true);
    });

    it('should return soft_mismatch for case differences', () => {
      const result = verifyField('brand_name', 'OLD TOM', { value: 'old tom', confidence: 0.98 });
      expect(result.type).toBe('soft_mismatch');
      expect(result.match).toBe(false);
    });

    it('should return hard_mismatch for different values', () => {
      const result = verifyField('brand_name', 'Old Tom', { value: 'New Tom', confidence: 0.98 });
      expect(result.type).toBe('hard_mismatch');
      expect(result.match).toBe(false);
    });
  });

  describe('verifyApplication', () => {
    it('should verify all fields in expected data', () => {
      const expected: ExpectedLabelData = {
        brand_name: 'Old Tom',
        alcohol_content: '45%',
      };

      const extracted: ExtractedData = {
        brand_name: { value: 'Old Tom', confidence: 0.98 },
        alcohol_content: { value: '45%', confidence: 0.95 },
      };

      const result = verifyApplication(expected, extracted);
      expect(result.brand_name?.type).toBe('match');
      expect(result.alcohol_content?.type).toBe('match');
    });

    it('should handle missing fields', () => {
      const expected: ExpectedLabelData = {
        brand_name: 'Old Tom',
      };

      const extracted: ExtractedData = {};

      const result = verifyApplication(expected, extracted);
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
