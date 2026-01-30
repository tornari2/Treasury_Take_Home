/**
 * Database type definitions
 * These types match the SQLite database schema
 */

/**
 * Image type for label images
 */
export type ImageType = 'front' | 'back' | 'side' | 'neck' | 'other';

/**
 * User role
 */
export type UserRole = 'agent' | 'admin';

/**
 * Beverage type
 */
export type BeverageType = 'spirits' | 'wine' | 'beer';

/**
 * Application status
 */
export type ApplicationStatus = 'pending' | 'needs_review' | 'approved' | 'rejected';

/**
 * Audit log action
 */
export type AuditLogAction =
  | 'login'
  | 'logout'
  | 'viewed'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'status_changed'
  | 'created';

/**
 * User entity
 */
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: string;
  last_login: string | null;
}

/**
 * Application entity
 */
export interface Application {
  id: number;
  applicant_name: string;
  beverage_type: BeverageType;
  status: ApplicationStatus;
  assigned_agent_id: number | null;
  application_data: string; // JSON string
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  // Legacy field for backward compatibility
  expected_label_data?: string; // JSON string (deprecated, use application_data)
}

/**
 * Label image entity
 */
export interface LabelImage {
  id: number;
  application_id: number;
  image_type: ImageType;
  image_data: Buffer;
  mime_type: string;
  extracted_data: string | null;
  verification_result: string | null;
  confidence_score: number | null;
  processed_at: string | null;
  processing_time_ms: number | null;
}

/**
 * Audit log entity
 */
export interface AuditLog {
  id: number;
  user_id: number;
  application_id: number | null;
  action: AuditLogAction;
  timestamp: string;
  details: string | null;
}

/**
 * Extracted data from AI label extraction
 * Keys are field names (snake_case), values contain the extracted value and confidence
 */
export interface ExtractedData {
  [key: string]: {
    value: string;
    confidence: number;
  };
}

/**
 * Verification result for a field
 */
export interface FieldVerificationResult {
  type: 'match' | 'soft_mismatch' | 'hard_mismatch' | 'not_found' | 'not_applicable';
  match: boolean;
  expected?: string;
  extracted?: string;
  rule?: string;
  details?: string;
}

/**
 * Verification result for all fields
 * Keys are field names (snake_case), values are verification results
 */
export interface VerificationResult {
  [key: string]: FieldVerificationResult;
}
