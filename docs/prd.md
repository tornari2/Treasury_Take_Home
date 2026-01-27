# Project Requirements Document
## AI-Powered Alcohol Label Verification System

**Prepared for:** TTB Compliance Division  
**Document Version:** 2.0  
**Date:** January 2025  
**Status:** Final

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Stakeholder Analysis](#3-stakeholder-analysis)
4. [Functional Requirements](#4-functional-requirements)
5. [Data Model](#5-data-model)
6. [API Specification](#6-api-specification)
7. [User Interface Design](#7-user-interface-design)
8. [Technical Architecture](#8-technical-architecture)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Assumptions & Constraints](#10-assumptions--constraints)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Glossary](#12-glossary)

---

## 1. Executive Summary

The TTB Label Verification System is an AI-powered web application designed to streamline the alcohol beverage label compliance review process. By leveraging computer vision and large language models, the system automatically extracts information from uploaded label images and verifies it against application data stored in the database.

The system addresses a critical operational bottleneck: TTB compliance agents currently spend significant time on manual data matching tasks that could be automated. A previous pilot project failed because processing times exceeded 30 seconds per label—agents could verify labels manually faster than the automated system. This solution targets sub-5-second processing times while maintaining high accuracy.

### Key Objectives

- Reduce manual verification time by automating field extraction and comparison
- Deliver verification results in under 5 seconds per label
- Support batch processing of up to 500 applications simultaneously with 10 concurrent workers
- Provide an intuitive interface accessible to users of all technical skill levels
- Implement intelligent matching that distinguishes between critical mismatches and trivial formatting differences

---

## 2. Project Overview

### 2.1 Problem Statement

The Alcohol and Tobacco Tax and Trade Bureau (TTB) reviews approximately 150,000 label applications annually with a team of 47 agents. The current review process requires agents to manually compare label artwork against application data field-by-field—a time-consuming task that consumes roughly half of each agent's workday.

Much of this work involves simple data matching (verifying that the brand name on the label matches the brand name in the application), which is well-suited to automation. By offloading routine verification tasks to AI, agents can focus their expertise on nuanced compliance decisions that require human judgment.

### 2.2 Solution Overview

The proposed solution is a standalone web application that:

1. Uses pre-loaded label images (front and back) stored in the database with each compliance application
2. Uses OpenAI's GPT-4o-mini vision model to extract text and structured data from label images
3. Compares extracted data against expected values stored in the application database using intelligent normalization
4. Presents results in a clear, side-by-side comparison view with color-coded match/mismatch indicators
5. Enables agents to approve, reject, or flag applications for further review
6. Supports keyboard shortcuts for power users

### 2.3 Scope

**In Scope:** Standalone prototype for label verification; user authentication; application management; AI-powered extraction and verification; batch processing with 10 concurrent workers; responsive web interface; keyboard shortcuts; audit logging.

**Out of Scope:** Integration with existing COLA system; FedRAMP certification; PII handling; document retention policies; production security hardening; image upload functionality (images are pre-loaded).

---

## 3. Stakeholder Analysis

Requirements were gathered through discovery sessions with key stakeholders. The following summarizes their needs and concerns:

| Stakeholder | Role | Key Requirements | Pain Points |
|-------------|------|------------------|-------------|
| Sarah Chen | Deputy Director, Label Compliance | Sub-5-second response; batch processing; simple UI | Failed pilot (30+ sec); staff drowning in routine work |
| Marcus Williams | IT Systems Administrator | Railway-compatible; standalone prototype; standard security | Legacy infrastructure; blocked outbound domains |
| Dave Morrison | Senior Agent (28 years) | Intelligent matching; minimal workflow disruption; keyboard shortcuts | Skeptical of automation; needs nuanced judgment |
| Jenny Park | Junior Agent (8 months) | Strict warning validation; handle imperfect images | Manual checklist process; rejects for minor issues |

### 3.1 Key Stakeholder Insights

#### Performance Requirement (Sarah Chen)
> "If we can't get results back in about 5 seconds, nobody's going to use it."

The previous pilot failed because 30-40 second processing times made manual verification faster. This is a hard requirement.

#### Usability Requirement (Sarah Chen)
> "We need something my mother could figure it out—she's 73 and just learned to video call her grandkids last year."

Half the team is over 50. The interface must be immediately intuitive with no training required.

#### Intelligent Matching (Dave Morrison)
> "The brand name was 'STONE'S THROW' on the label but 'Stone's Throw' in the application. Technically a mismatch? Sure. But it's obviously the same thing."

The system must distinguish between meaningful mismatches and trivial formatting differences.

#### Strict Warning Validation (Jenny Park)
> "The 'GOVERNMENT WARNING:' part has to be in all caps and bold... I caught one last month where they used 'Government Warning' in title case instead of all caps. Rejected."

Health warning validation must be exact.

---

## 4. Functional Requirements

### 4.1 User Stories

| ID | Priority | User Story | Acceptance Criteria |
|----|----------|------------|---------------------|
| US-01 | P0 | As an agent, I can log in to access the verification system | Simple username/password; session management |
| US-02 | P0 | As an agent, I can view a queue of applications awaiting review | Filterable list; status indicators; select multiple |
| US-03 | P0 | As an agent, I can select an application to trigger AI verification | Selection triggers verification against pre-loaded images from database |
| US-04 | P0 | As an agent, I can see verification results in <5 seconds | Timer from selection to results display |
| US-05 | P0 | As an agent, I can see side-by-side comparison of expected vs. extracted data | Color-coded match/mismatch/review indicators |
| US-06 | P0 | As an agent, I can approve, reject, or flag an application | Status updates persist; audit trail |
| US-07 | P1 | As an agent, I can batch process multiple applications | Select all; process up to 500; progress indicator; 10 concurrent workers |
| US-08 | P1 | As an agent, soft mismatches are flagged for human review | Case differences, punctuation flagged yellow |
| US-09 | P1 | As an agent, the health warning is validated exactly | All caps, exact wording, bold detection |
| US-10 | P2 | As an agent, the system handles imperfect images gracefully | Angle correction; glare handling; confidence scores |
| US-11 | P1 | As an agent, I can use keyboard shortcuts for common actions | A=Approve, R=Reject, F=Flag, N=Next, ↑/↓=Navigate |
| US-12 | P1 | As an agent, I can view a keyboard shortcuts legend | Hover/click legend button shows all shortcuts |

### 4.2 Beverage-Specific Required Fields

Different beverage types have different mandatory label fields. The system must validate the appropriate fields based on beverage type (pre-set in the database row associated with the images).

#### Distilled Spirits
- Brand Name (required)
- Class or Type Designation (required)
- Alcohol Content (required)
- Age Statement (if applicable)
- Color Ingredient Disclosures (if applicable)
- Commodity Statement (if applicable)
- Health Warning Statement (required)
- Name and Address (required)
- Net Contents (required)
- Country of Origin (imports only)

#### Wine
- Brand Name (required)
- Class or Type Designation (required)
- Alcohol Content (required)
- Appellation of Origin (mandatory in certain circumstances)
- Percentage of Foreign Wine (if applicable)
- Color Ingredient Disclosures (if applicable)
- Health Warning Statement (required)
- Name and Address (required)
- Net Contents (required)
- Sulfite Declaration (required)
- Country of Origin (imports only)

#### Beer / Malt Beverages
- Brand Name (required)
- Class or Type Designation (required)
- Net Contents (required)
- Name and Address (required)
- Alcohol Content (mandatory or optional depending on state)
- Color Additive Disclosures (if applicable)
- Sulfite and Aspartame Declarations (if applicable)
- Health Warning Statement (required)
- Country of Origin (imports only)

### 4.3 Verification Logic

The system uses a three-tier matching system to categorize verification results:

#### Match Status Definitions

| Status | Indicator | Definition | Example |
|--------|-----------|------------|---------|
| MATCH | ✅ Green | Extracted value matches expected value exactly or after normalization | "45% ABV" matches "45% ABV" |
| SOFT MISMATCH | ⚠️ Yellow | Values are semantically equivalent but differ in case, punctuation, spacing, or formatting; OR confidence score < 0.85 | "STONE'S THROW" vs "Stone's Throw" |
| HARD MISMATCH | ❌ Red | Values are materially different (different words, numbers, or meaning) | "Old Tom" vs "Mountain Creek" |
| NOT FOUND | ❌ Red | Required field could not be extracted from the label image | Brand name not detected on label |

#### Normalization Algorithm

Before comparison, both expected and extracted values are normalized:

1. **Case normalization:** Convert to lowercase
2. **Whitespace normalization:** Collapse multiple spaces to single space; trim leading/trailing
3. **Punctuation normalization:** Remove common punctuation (periods, commas, apostrophes, hyphens)
4. **Abbreviation expansion:** Apply canonical abbreviation list:
   - State names: "KY" ↔ "Kentucky", "CA" ↔ "California", etc.
   - Units: "oz" ↔ "ounce", "ml" ↔ "milliliter", etc.
   - Common terms: "St" ↔ "Street", "Ave" ↔ "Avenue", etc.

After normalization, if values match exactly, status is MATCH. If they don't match, semantic equivalence is evaluated for SOFT vs HARD mismatch.

#### Soft Mismatch Examples

The following differences are considered soft mismatches (semantically equivalent, requires human review):

- Case differences: "STONE'S THROW" vs "Stone's Throw"
- Punctuation variations: "750ml" vs "750 mL" vs "750mL"
- Abbreviation differences: "Kentucky" vs "KY"
- Whitespace variations: "Old  Tom" vs "Old Tom"
- Low confidence score: Extracted value with confidence < 0.85

#### Hard Mismatch Examples

The following differences are considered hard mismatches (materially different, likely rejection):

- Different brand names: "Old Tom Distillery" vs "Mountain Creek Distillery"
- Different alcohol content: "45%" vs "40%"
- Different net contents: "750 mL" vs "1L"
- Required field missing from label entirely (NOT FOUND status)

#### Health Warning Validation (Strict — No Soft Matching)

The Government Health Warning Statement requires exact validation. Unlike other fields, there is **NO soft mismatch tolerance** — any deviation is automatically a **HARD MISMATCH**:

**Required Exact Text:**
```
GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.
```

**Validation Rules:**
- "GOVERNMENT WARNING:" must be in ALL CAPS (e.g., "Government Warning:" = HARD MISMATCH)
- "GOVERNMENT WARNING:" must be bold (vision model detects text formatting)
- Full warning text must be word-for-word accurate
- Any deviation in case, wording, or formatting results in HARD MISMATCH

### 4.4 Application Status Transitions

Application status is updated based on verification results using a hybrid approach: the system auto-flags applications needing review, but agents make all final approval/rejection decisions.

| Verification Outcome | Automatic Status Change | Agent Actions Available |
|---------------------|------------------------|------------------------|
| All fields ✅ MATCH | Remains PENDING | Agent reviews and clicks Approve or Reject |
| Any field ⚠️ SOFT MISMATCH (no hard mismatches) | Auto-updates to NEEDS REVIEW | Agent reviews differences, then Approves or Rejects |
| Any field ❌ HARD MISMATCH or NOT FOUND | Remains PENDING | Agent reviews and clicks Approve (override) or Reject |

#### Status Transition Rules

- The system **NEVER auto-approves** — agent confirmation is always required, even when all fields match
- The system **NEVER auto-rejects** — agent confirmation is always required for rejections
- Any soft mismatch automatically moves the application to NEEDS REVIEW status
- Agents can override hard mismatches and approve if they determine the difference is acceptable
- Invalid images or missing required fields in the database should result in automatic rejection with appropriate error message

---

## 5. Data Model

### 5.1 Entity Relationship Overview

The system uses four primary entities: Users, Applications, Label Images, and Audit Logs. Each Application belongs to one User (the agent assigned to review it) and can have multiple Label Images (front, back, and potentially side panels). All user actions are tracked in the Audit Log.

### 5.2 User Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email for login |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| name | VARCHAR(255) | NOT NULL | Display name |
| role | ENUM('agent', 'admin') | DEFAULT 'agent' | User role |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| last_login | TIMESTAMP | NULLABLE | Last successful login |

### 5.3 Application Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique application identifier |
| applicant_name | VARCHAR(255) | NOT NULL | Name of permit applicant |
| beverage_type | ENUM('spirits', 'wine', 'beer') | NOT NULL | Beverage category (pre-set, source of truth) |
| status | ENUM('pending', 'needs_review', 'approved', 'rejected') | DEFAULT 'pending' | Current review status |
| assigned_agent_id | INTEGER | FOREIGN KEY → Users | Agent assigned to review |
| expected_label_data | JSON | NOT NULL | Beverage-type-specific expected field values |
| created_at | TIMESTAMP | DEFAULT NOW() | Application submission time |
| reviewed_at | TIMESTAMP | NULLABLE | When review was completed |
| review_notes | TEXT | NULLABLE | Agent notes on decision |

### 5.4 Expected Label Data (JSON Column)

The Application entity includes an `expected_label_data` JSON column containing beverage-type-specific fields:

| Field | Type | Spirits | Wine | Beer |
|-------|------|---------|------|------|
| brand_name | STRING | Required | Required | Required |
| class_type | STRING | Required | Required | Required |
| alcohol_content | STRING | Required | Required | Varies |
| net_contents | STRING | Required | Required | Required |
| producer_name | STRING | Required | Required | Required |
| producer_address | STRING | Required | Required | Required |
| health_warning | STRING | Required | Required | Required |
| country_of_origin | STRING | Imports only | Imports only | Imports only |
| age_statement | STRING | If applicable | — | — |
| appellation_of_origin | STRING | — | If applicable | — |
| sulfite_declaration | STRING | — | Required | If applicable |

### 5.5 Label Image Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique image identifier |
| application_id | INTEGER | FOREIGN KEY → Applications | Parent application |
| image_type | ENUM('front', 'back', 'side', 'neck') | NOT NULL | Label panel type (typically front/back) |
| image_data | BLOB | NOT NULL | Binary image data (pre-loaded, JPEG/PNG) |
| mime_type | VARCHAR(50) | NOT NULL | image/jpeg, image/png, etc. |
| extracted_data | JSON | NULLABLE | AI-extracted field values with confidence scores |
| verification_result | JSON | NULLABLE | Match/mismatch per field |
| confidence_score | FLOAT | NULLABLE | Overall extraction confidence |
| processed_at | TIMESTAMP | NULLABLE | When AI processing completed |
| processing_time_ms | INTEGER | NULLABLE | Processing duration |

**Extracted Data JSON Structure:**
```json
{
  "brand_name": {
    "value": "Old Tom",
    "confidence": 0.98
  },
  "alcohol_content": {
    "value": "45% Alc./Vol.",
    "confidence": 0.95
  }
}
```

### 5.6 Audit Log Entity

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Unique log identifier |
| user_id | INTEGER | FOREIGN KEY → Users | User who performed action |
| application_id | INTEGER | FOREIGN KEY → Applications, NULLABLE | Related application (if applicable) |
| action | ENUM('login', 'logout', 'viewed', 'verified', 'approved', 'rejected', 'status_changed') | NOT NULL | Action type |
| timestamp | TIMESTAMP | DEFAULT NOW() | When action occurred |
| details | JSON | NULLABLE | Action-specific metadata |

---

## 6. API Specification

The system exposes a RESTful API with OpenAPI/Swagger documentation auto-generated by the framework.

### 6.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/login | Authenticate user with username/password, create session | No |
| POST | /api/auth/logout | End session | Yes |
| GET | /api/auth/me | Get current user profile | Yes |

### 6.2 Application Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/applications | List applications (filterable by status) | Yes |
| GET | /api/applications/:id | Get single application with images and verification results | Yes |
| PATCH | /api/applications/:id | Update application status/notes | Yes |
| POST | /api/applications/:id/verify | Trigger AI verification for this application (processes pre-loaded images) | Yes |

### 6.3 Batch Processing Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/batch/verify | Trigger verification for multiple applications (10 concurrent workers) | Yes |
| GET | /api/batch/status/:batchId | Get batch processing status with progress updates | Yes |

### 6.4 Request/Response Examples

#### POST /api/applications/:id/verify

**Request:** Empty body (verification uses pre-loaded images from database)

**Response (200 OK):**
```json
{
  "application_id": 42,
  "verification_results": {
    "front_label": {
      "brand_name": {
        "expected": "OLD TOM",
        "extracted": "Old Tom",
        "confidence": 0.98,
        "status": "soft_mismatch",
        "reason": "case_difference"
      },
      "alcohol_content": {
        "expected": "45%",
        "extracted": "45% Alc./Vol.",
        "confidence": 0.96,
        "status": "match",
        "reason": "normalized_match"
      }
    },
    "back_label": {
      "health_warning": {
        "expected": "GOVERNMENT WARNING: (1) According to...",
        "extracted": "GOVERNMENT WARNING: (1) According to...",
        "confidence": 0.99,
        "status": "match",
        "reason": "exact_match"
      }
    }
  },
  "overall_status": "needs_review",
  "processing_time_ms": 2340
}
```

#### POST /api/batch/verify

**Request:**
```json
{
  "application_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}
```

**Response (202 Accepted):**
```json
{
  "batch_id": "batch_abc123",
  "total_applications": 12,
  "status": "processing",
  "status_url": "/api/batch/status/batch_abc123"
}
```

#### GET /api/batch/status/:batchId

**Response (200 OK):**
```json
{
  "batch_id": "batch_abc123",
  "status": "processing",
  "total_applications": 12,
  "processed": 7,
  "successful": 6,
  "failed": 1,
  "started_at": "2025-01-26T10:30:00Z",
  "estimated_completion": "2025-01-26T10:32:00Z"
}
```

---

## 7. User Interface Design

### 7.1 Design Principles

- **Simplicity First:** "My mother could figure it out" — no hidden menus, obvious workflows
- **Color-Coded Status:** Green (match), Yellow (soft mismatch), Red (hard mismatch/missing)
- **Minimal Clicks:** Select → Review → Decide (3 steps maximum)
- **Immediate Feedback:** Progress indicators, sub-5-second results
- **Keyboard Accessibility:** Power users can navigate without mouse

### 7.2 Screen Inventory

#### Screen 1: Login

Simple email/password form with TTB branding. Error messages for invalid credentials.

**Keyboard Shortcuts:** 
- Enter: Submit login

#### Screen 2: Application Queue (Dashboard)

Primary working view for agents. Features include:

- Filterable/sortable table of applications
- Status filter dropdown (All, Pending, Needs Review, Approved, Rejected)
- Checkbox selection for batch operations
- "Select All" checkbox in header
- "Verify Selected" button triggers AI verification for all selected applications (up to 500)
- Clicking a single row opens the review screen and auto-triggers verification
- Keyboard shortcuts legend button (hover to display)

**Keyboard Shortcuts:** 
- ↑/↓: Navigate application list
- Space: Toggle checkbox selection
- Enter: Open selected application
- Ctrl+A: Select all visible applications
- ?: Show keyboard shortcuts legend

#### Screen 3: Application Review (Side-by-Side Comparison)

Detailed view for individual application review. Verification runs automatically when this screen loads. Layout:

- **Left panel:** Label images (front/back tabs, zoomable with mouse wheel or +/- keys) — pre-loaded from database
- **Right panel:** Field-by-field verification results (populated automatically)
- Each field shows: Expected value, Extracted value, Confidence score, Status indicator
- Fields with errors prominently highlighted in red
- Soft mismatches highlighted in yellow
- Action buttons: Approve, Reject, Flag for Review
- Notes field for agent comments
- Processing time display
- Keyboard shortcuts legend button

**Keyboard Shortcuts:** 
- A: Approve application
- R: Reject application
- F: Flag for review
- N: Next application
- Esc: Return to dashboard
- +/-: Zoom image in/out
- ?: Show keyboard shortcuts legend

### 7.3 Keyboard Shortcuts Legend

A floating button (bottom-right corner) displays keyboard shortcuts on hover/click:

```
┌─────────────────────────────────┐
│   Keyboard Shortcuts            │
├─────────────────────────────────┤
│ Navigation:                     │
│   ↑/↓     Navigate list         │
│   Enter   Open application      │
│   Esc     Return to dashboard   │
│   N       Next application      │
│                                 │
│ Actions:                        │
│   A       Approve               │
│   R       Reject                │
│   F       Flag for review       │
│                                 │
│ Selection:                      │
│   Space   Toggle checkbox       │
│   Ctrl+A  Select all            │
│                                 │
│ Image:                          │
│   +/-     Zoom in/out           │
└─────────────────────────────────┘
```

### 7.4 Error Handling UI

| Error Scenario | User-Facing Message | System Behavior |
|----------------|---------------------|-----------------|
| OpenAI API timeout | "Verification is taking longer than expected. Please retry." | Store partial results, show Retry button |
| OpenAI API rate limit | "System is busy processing other requests. Your application has been queued." | Queue for later processing, show notification when complete |
| Invalid/corrupted image in DB | "Label image is corrupted or in an unsupported format. This application should be rejected." | Mark all fields as NOT FOUND, suggest rejection |
| Missing required fields in application data | "Application data is incomplete. Cannot verify the following fields: [list]" | Block verification, highlight missing fields |
| AI returns invalid JSON | "Verification failed due to a technical error. Please retry." | Log error for debugging, allow retry |
| Low confidence extraction | "AI extraction confidence is low for some fields (marked in yellow). Manual review recommended." | Mark fields with confidence < 0.85 as soft mismatch |

### 7.5 Responsive Behavior

The application should be functional on tablet devices (agents may use tablets for field work) but is primarily designed for desktop use. Minimum supported width: 1024px.

---

## 8. Technical Architecture

### 8.1 System Architecture

The system follows a simplified full-stack architecture deployed as a single service:

| Layer | Technology | Deployment | Notes |
|-------|------------|------------|-------|
| Frontend | Next.js (React) + TypeScript | Railway | Server-side rendering + static generation |
| Backend | Next.js API Routes | Railway | RESTful API in same codebase |
| Database | SQLite (better-sqlite3) | Railway (persistent volume) | Single file, simple backup, BLOB storage |
| AI Service | OpenAI GPT-4o-mini | External API | Vision model for extraction |

**Deployment Model:** Single Railway service running full-stack Next.js application with SQLite on persistent volume.

### 8.2 AI Integration Architecture

Label verification uses OpenAI's GPT-4o-mini vision model via direct API integration:

1. **Image Storage:** Images are pre-loaded as BLOBs in SQLite database
2. **Verification Trigger:** Agent selects application → API retrieves images from DB
3. **Parallel AI Requests:** Frontend and backend labels sent to GPT-4o-mini simultaneously (2 parallel requests per application)
4. **Structured Response:** Model returns JSON with extracted fields and formatting notes
5. **Normalization & Matching:** Backend applies normalization algorithm and compares values
6. **Confidence Evaluation:** Fields with confidence < 0.85 automatically flagged as soft mismatch
7. **Result Storage:** Verification results stored in database with processing time

### 8.3 Prompt Engineering

The extraction prompt is tailored to beverage type and requests structured JSON output:

**Example Prompt Structure for Spirits:**
```
You are analyzing a distilled spirits label image. Extract the following fields and return as structured JSON:

Required fields:
- brand_name: The brand name as it appears on the label
- class_type: The type designation (e.g., "Bourbon Whiskey", "Vodka")
- alcohol_content: The alcohol by volume percentage (e.g., "45%", "40% ABV")
- net_contents: The volume (e.g., "750 mL", "1 L")
- producer_name: The name of the producer/distiller
- producer_address: The full address of the producer
- health_warning_statement: The exact government warning text
- country_of_origin: Country of origin if indicated (imports only)

For the health_warning_statement field, note:
1. Whether "GOVERNMENT WARNING:" appears in all caps
2. Whether "GOVERNMENT WARNING:" appears in bold formatting
3. The exact wording of the full warning text

For each field, provide:
- value: The extracted text (or null if not found)
- confidence: A score from 0.0 to 1.0 indicating extraction confidence

If a field cannot be found or is unclear, return null for the value and a low confidence score.

Return ONLY valid JSON with no additional text.
```

### 8.4 Batch Processing Architecture

Batch processing uses a concurrent worker pool approach:

- **Concurrency:** 10 parallel OpenAI API requests
- **Batching Strategy:** Process applications in chunks of 10
- **Progress Tracking:** Real-time status updates via polling endpoint
- **Error Handling:** Failed applications are logged and retried once; persistent failures are marked

**Example: 100 applications**
- Chunk 1-10: Process in parallel (~2s)
- Chunk 11-20: Process in parallel (~2s)
- ... continue for 10 iterations
- **Total time: ~20 seconds** (well under 3-minute target)

### 8.5 Deployment Architecture

**Single Railway Service:**
- **Service Type:** Next.js (Node.js 20+)
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Environment Variables:** `OPENAI_API_KEY`, `JWT_SECRET`, `DATABASE_URL`
- **Persistent Volume:** Mounted at `/app/data` for SQLite database file
- **Auto-Deploy:** GitHub main branch triggers automatic deployment

**No Vercel deployment** - simplified single-service architecture on Railway.

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Single label verification | < 5 seconds | Time from API request to response with results |
| Batch processing (100 labels) | < 3 minutes | Total time for batch to complete with 10 concurrent workers |
| Page load time | < 2 seconds | Time to interactive on dashboard |
| API response time (non-AI) | < 200ms | 95th percentile latency |
| Database query time | < 50ms | Read queries with proper indexing |

### 9.2 Scalability

The system should support:

- Up to 100 concurrent users (matches agent count)
- Batch processing of up to 500 applications simultaneously
- Database growth of ~150,000 applications/year
- SQLite handles 150K apps/year with 100 concurrent users with proper indexing

### 9.3 Security

- Session-based authentication with secure httpOnly cookies
- Password hashing with bcrypt (cost factor 12)
- HTTPS enforced for all connections
- Input validation and sanitization on all endpoints
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping

### 9.4 Reliability

- Target uptime: 99.5% during business hours (8am-6pm ET)
- Graceful degradation if OpenAI API is unavailable (show error message, allow retry)
- Automatic retry logic for transient OpenAI API failures (exponential backoff)
- Database backup strategy: Daily automated backups of SQLite file

---

## 10. Assumptions & Constraints

### 10.1 Assumptions

- Users have modern web browsers (Chrome, Firefox, Safari, Edge — last 2 versions)
- Label images are **pre-loaded in the database** in standard formats (JPEG, PNG) at reasonable quality (<500KB per image)
- OpenAI API will remain available and pricing will remain stable
- Database is pre-populated with sample applications, expected label data, and label images for demonstration
- **No image upload functionality** - all images are pre-loaded into SQLite
- Beverage type is pre-set in application data (source of truth)
- This is a prototype; production deployment would require additional security review
- Railway provides adequate OpenAI API latency (<500ms to external API)

### 10.2 Constraints

- No integration with existing COLA system (standalone prototype)
- No PII handling requirements or federal compliance for prototype phase
- Budget constraints limit cloud infrastructure choices (Railway free tier → ~$20/month)
- Timeline: Delivery by end of next week
- No image upload feature (out of scope for MVP)
- SQLite only (no PostgreSQL migration for prototype)

### 10.3 Technical Constraints

- SQLite chosen for simplicity; acceptable for 150K apps/year scale
- Synchronous batch processing with 10 concurrent workers (no async queue)
- Image storage in SQLite BLOB (acceptable for prototype; production may need object storage)
- Single Railway service (no horizontal scaling)

---

## 11. Acceptance Criteria

### 11.1 Core Functionality

| Criterion | Test | Pass Condition |
|-----------|------|----------------|
| User can log in | Enter valid username/password | Redirected to dashboard, session created |
| Dashboard displays applications | Navigate to dashboard | Applications listed with status |
| Filter works correctly | Select 'Needs Review' filter | Only matching applications shown |
| Single selection triggers verification | Click on an application row | Review screen opens, verification auto-runs using pre-loaded images |
| Verification completes <5s | Time from selection to results | Results displayed within 5 seconds |
| Results show comparison | View application detail | Side-by-side expected vs extracted |
| Match status is color-coded | View verification results | Green/Yellow/Red indicators visible |
| Agent can approve application | Click Approve button or press 'A' | Status updated to 'approved', audit log created |
| Batch select works | Select multiple applications via checkboxes | Checkboxes reflect selection |
| Batch verify works | Click Verify Selected with 10 applications | All 10 verified in parallel, results stored |
| Keyboard shortcuts work | Press 'A', 'R', 'F', ↑, ↓ | Corresponding actions triggered |
| Keyboard legend displays | Hover/click legend button | Shortcuts overlay appears |
| Audit log captures actions | Perform approve/reject actions | Actions logged with user, timestamp, details |

### 11.2 Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Blurry/unreadable image in database | Low confidence score (<0.85), fields marked as SOFT MISMATCH with warning |
| Missing required field on label | Field marked as NOT FOUND with red indicator |
| Health warning in wrong case | HARD MISMATCH for health_warning field (no soft matching) |
| Health warning with wrong wording | HARD MISMATCH for health_warning field |
| OpenAI API timeout | Error message: "Verification is taking longer than expected. Please retry." + Retry button |
| Application has no images in database | Error message: "No label images available. This application should be rejected." |
| Corrupted image in database | Error message: "Label image is corrupted. This application should be rejected." |
| Concurrent batch processing | Queue processes in order with 10 workers, no data corruption |
| Low confidence extraction | Fields with confidence < 0.85 automatically flagged as SOFT MISMATCH in yellow |
| Beverage type mismatch | Beverage type from database is source of truth; label conflicts are flagged |

### 11.3 Performance Criteria

| Test | Target | Pass Condition |
|------|--------|----------------|
| Single verification (spirits) | < 5s | 95% of verifications complete in <5s |
| Batch verification (100 apps) | < 3 minutes | Completes in <180 seconds with 10 workers |
| Dashboard load | < 2s | Time to interactive <2s |
| Application list query | < 200ms | Database query returns in <200ms |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| TTB | Alcohol and Tobacco Tax and Trade Bureau — federal agency regulating alcohol labeling |
| COLA | Certificate of Label Approval — the permit required for alcohol beverage labels |
| ABV | Alcohol By Volume — percentage of alcohol content |
| Soft Mismatch | A difference that may be acceptable (case, punctuation, low confidence) requiring human review |
| Hard Mismatch | A material difference that likely requires rejection |
| Health Warning | Mandatory government warning statement on all alcohol beverages (must be exact) |
| Vision Model | AI model capable of processing and understanding images (GPT-4o-mini) |
| Structured Output | AI response formatted as parseable JSON rather than free text |
| Normalization | Process of standardizing text (case, whitespace, punctuation) before comparison |
| Confidence Score | AI's certainty about extracted value (0.0-1.0); < 0.85 triggers soft mismatch |
| Pre-loaded Images | Label images stored in SQLite database BLOB column (not uploaded by users) |
| Batch Processing | Parallel verification of multiple applications using 10 concurrent workers |
| Audit Log | Database table tracking all user actions (login, view, approve, reject, etc.) |

---

## 13. Admin vs. Agent Permissions

| Action | Agent | Admin |
|--------|-------|-------|
| View assigned applications | ✅ | ✅ All applications |
| Verify applications | ✅ | ✅ |
| Approve/reject applications | ✅ | ✅ |
| Batch processing | ✅ | ✅ |
| Create applications | ❌ | ✅ |
| Edit application data | ❌ | ✅ |
| Reassign applications | ❌ | ✅ |
| View audit logs | ✅ Own actions | ✅ All actions |
| Manage users | ❌ | ✅ |

---
