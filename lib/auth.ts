import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { userHelpers } from './db-helpers';
import { auditLogHelpers } from './db-helpers';
import type { User } from '@/types/database';

// Session storage (in production, use Redis or database)
const sessions = new Map<string, { userId: number; expiresAt: number }>();

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSession(userId: number): string {
  const sessionId = uuidv4();
  const expiresAt = Date.now() + SESSION_DURATION;

  sessions.set(sessionId, { userId, expiresAt });

  // Clean up expired sessions periodically
  cleanupExpiredSessions();

  return sessionId;
}

export function getSession(sessionId: string): { userId: number } | null {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  return { userId: session.userId };
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = userHelpers.findByEmail(email);

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  // Update last login
  userHelpers.updateLastLogin(user.id);

  // Log login action
  auditLogHelpers.create(user.id, 'login');

  return user;
}

export function getCurrentUser(sessionId: string | null): User | null {
  if (!sessionId) {
    return null;
  }

  const session = getSession(sessionId);
  if (!session) {
    return null;
  }

  return userHelpers.findById(session.userId) || null;
}
