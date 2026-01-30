// Auth module - stubs for backward compatibility
// Authentication has been removed from the application

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

/**
 * Authenticate user (stub - auth removed)
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  void email;
  void password;
  // Authentication removed - always return null
  return null;
}

/**
 * Hash password (stub - auth removed)
 */
export async function hashPassword(password: string): Promise<string> {
  // Authentication removed - return input as-is
  return password;
}

/**
 * Create session (stub - auth removed)
 */
export function createSession(userId: number): string {
  void userId;
  // Authentication removed - return dummy session id
  return 'session-disabled';
}

/**
 * Get current user from session (stub - auth removed)
 */
export function getCurrentUser(sessionId: string): User | null {
  // Authentication removed - return null
  return null;
}

/**
 * Delete session (stub - auth removed)
 */
export function deleteSession(sessionId: string): void {
  // Authentication removed - no-op
}
