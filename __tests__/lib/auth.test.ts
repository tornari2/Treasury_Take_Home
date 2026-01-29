import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, createSession, getSession, deleteSession } from '@/lib/auth';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword('password123');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('password123');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should produce different hashes for same password', async () => {
      const hash1 = await hashPassword('password123');
      const hash2 = await hashPassword('password123');
      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword('password123');
      const isValid = await verifyPassword('password123', hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('password123');
      const isValid = await verifyPassword('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      // Clear sessions before each test
      // Note: In a real implementation, you'd want to expose a clear method
    });

    it('should create a session', () => {
      const sessionId = createSession(1);
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
    });

    it('should retrieve a valid session', () => {
      const sessionId = createSession(1);
      const session = getSession(sessionId);
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(1);
    });

    it('should delete a session', () => {
      const sessionId = createSession(1);
      deleteSession(sessionId);
      const session = getSession(sessionId);
      expect(session).toBeNull();
    });
  });
});
