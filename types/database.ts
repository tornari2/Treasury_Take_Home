export type UserRole = 'agent' | 'admin';
export type BeverageType = 'spirits' | 'wine' | 'beer';
export type ApplicationStatus = 'pending' | 'needs_review' | 'approved' | 'rejected';
export type ImageType = 'front' | 'back' | 'side' | 'neck' | 'other';
export type AuditAction =
  | 'login'
  | 'logout'
  | 'viewed'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'status_changed'
  | 'created';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: string;
  last_login: string | null;
}

export interface Application {
  id: number;
  applicant_name: string;
  beverage_type: BeverageType;
  status: ApplicationStatus;
  assigned_agent_id: number | null;
  application_data: string; // JSON string - stores ApplicationData format
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

// Legacy interface for backward compatibility during migration
export interface ExpectedLabelData {
  brand_name?: string;
  class_type?: string;
  alcohol_content?: string;
  net_contents?: string;
  producer_name?: string;
  producer_address?: string;
  health_warning?: string;
  country_of_origin?: string;
  age_statement?: string;
  appellation_of_origin?: string;
  sulfite_declaration?: string;
}

export interface LabelImage {
  id: number;
  application_id: number;
  image_type: ImageType;
  image_data: Buffer;
  mime_type: string;
  extracted_data: string | null; // JSON string
  verification_result: string | null; // JSON string
  confidence_score: number | null;
  processed_at: string | null;
  processing_time_ms: number | null;
}

export interface AuditLog {
  id: number;
  user_id: number;
  application_id: number | null;
  action: AuditAction;
  timestamp: string;
  details: string | null; // JSON string
}

export interface ExpectedLabelData {
  brand_name?: string;
  class_type?: string;
  alcohol_content?: string;
  net_contents?: string;
  producer_name?: string;
  producer_address?: string;
  health_warning?: string;
  country_of_origin?: string;
  age_statement?: string;
  appellation_of_origin?: string;
  sulfite_declaration?: string;
}

export interface ExtractedData {
  [key: string]: {
    value: string;
    confidence: number;
  };
}

export interface VerificationResult {
  [key: string]: {
    match: boolean;
    type: 'match' | 'soft_mismatch' | 'hard_mismatch' | 'not_found' | 'not_applicable';
    expected?: string;
    extracted?: string;
  };
}
