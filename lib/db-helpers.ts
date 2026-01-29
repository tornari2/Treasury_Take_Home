import db from './db';
import { ensureMigrations } from './migrations';
import type { User, Application, LabelImage, AuditLog } from '@/types/database';

// Ensure migrations run before any database operations
ensureMigrations();

// User helpers
export const userHelpers = {
  create: (
    email: string,
    passwordHash: string,
    name: string,
    role: 'agent' | 'admin' = 'agent'
  ) => {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(email, passwordHash, name, role);
  },

  findByEmail: (email: string): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  },

  findById: (id: number): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  },

  updateLastLogin: (id: number) => {
    const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  },
};

// Application helpers
export const applicationHelpers = {
  create: (
    applicantName: string,
    beverageType: 'spirits' | 'wine' | 'beer',
    applicationData: string, // JSON string of ApplicationData format
    assignedAgentId: number | null = null
  ) => {
    const stmt = db.prepare(`
      INSERT INTO applications (applicant_name, beverage_type, application_data, assigned_agent_id)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(applicantName, beverageType, applicationData, assignedAgentId);
  },

  findById: (id: number): Application | undefined => {
    const stmt = db.prepare('SELECT * FROM applications WHERE id = ?');
    return stmt.get(id) as Application | undefined;
  },

  findAll: (): Application[] => {
    const stmt = db.prepare('SELECT * FROM applications ORDER BY created_at DESC');
    return stmt.all() as Application[];
  },

  findByStatus: (status: string): Application[] => {
    const stmt = db.prepare('SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC');
    return stmt.all(status) as Application[];
  },

  updateStatus: (id: number, status: string, reviewNotes: string | null = null) => {
    const stmt = db.prepare(`
      UPDATE applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, review_notes = ?
      WHERE id = ?
    `);
    return stmt.run(status, reviewNotes, id);
  },

  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM applications WHERE id = ?');
    return stmt.run(id);
  },
};

// Label Image helpers
export const labelImageHelpers = {
  create: (
    applicationId: number,
    imageType: 'front' | 'back' | 'side' | 'neck',
    imageData: Buffer,
    mimeType: string
  ) => {
    const stmt = db.prepare(`
      INSERT INTO label_images (application_id, image_type, image_data, mime_type)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(applicationId, imageType, imageData, mimeType);
  },

  findByApplicationId: (applicationId: number): LabelImage[] => {
    const stmt = db.prepare('SELECT * FROM label_images WHERE application_id = ?');
    return stmt.all(applicationId) as LabelImage[];
  },

  updateExtraction: (
    id: number,
    extractedData: string,
    verificationResult: string,
    confidenceScore: number,
    processingTimeMs: number
  ) => {
    const stmt = db.prepare(`
      UPDATE label_images 
      SET extracted_data = ?, verification_result = ?, confidence_score = ?, 
          processed_at = CURRENT_TIMESTAMP, processing_time_ms = ?
      WHERE id = ?
    `);
    return stmt.run(extractedData, verificationResult, confidenceScore, processingTimeMs, id);
  },

  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM label_images WHERE id = ?');
    return stmt.run(id);
  },
};

// Audit Log helpers
export const auditLogHelpers = {
  create: (
    userId: number,
    action: string,
    applicationId: number | null = null,
    details: string | null = null
  ) => {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, application_id, action, details)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(userId, applicationId, action, details);
  },

  findByUserId: (userId: number, limit: number = 100): AuditLog[] => {
    const stmt = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit) as AuditLog[];
  },

  findByApplicationId: (applicationId: number): AuditLog[] => {
    const stmt = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE application_id = ? 
      ORDER BY timestamp DESC
    `);
    return stmt.all(applicationId) as AuditLog[];
  },
};
