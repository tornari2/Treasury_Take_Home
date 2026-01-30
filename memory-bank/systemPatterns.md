# System Patterns

_Derives from [projectbrief.md](./projectbrief.md). Captures architecture and design decisions._

## System Architecture

### High-Level Design: Full-Stack Monolith

```
┌─────────────────────────────────────────┐
│  Railway Single Service                 │
│  ┌─────────────────────────────────┐   │
│  │ Next.js Full-Stack App          │   │
│  │ ├─ Frontend (React + SSR)       │   │
│  │ ├─ API Routes (Backend)         │   │
│  │ └─ SQLite (Persistent Volume)   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
    OpenAI API (GPT-4o)
```

**Rationale:** Simplified single-service deployment meets tight timeline, avoids CORS issues, single environment configuration.

**Architecture Document:** See `docs/architecture.md` for 10 detailed Mermaid diagrams.

## Key Technical Decisions

### 1. Railway-Only Deployment (No Vercel Split) ✅

**Decision:** Deploy entire full-stack Next.js app on Railway  
**Alternative Rejected:** Vercel (frontend) + Railway (backend)  
**Rationale:**

- Simpler deployment (one platform, one billing account)
- No CORS configuration needed
- Faster development iteration (single environment)
- No network latency between frontend/backend
- Meets tight 1-week timeline

### 2. SQLite for Database (No PostgreSQL) ✅

**Decision:** SQLite with BLOBs on Railway persistent volume  
**Alternative Rejected:** PostgreSQL + S3 for images  
**Rationale:**

- Perfect scale for 150K apps/year, 100 concurrent users
- Built-in BLOB storage (images stored directly in DB)
- Single-file backups (simple disaster recovery)
- Zero connection pool complexity
- Fast reads (this workload is 95% reads)
  **Trade-off:** Limited concurrent writes (acceptable - mostly read-heavy)

### 3. 10 Concurrent Workers for Batch Processing ✅

**Decision:** Process 10 applications in parallel (OpenAI API calls)  
**Alternative Rejected:** Sequential (too slow) or unlimited (rate limits)  
**Rationale:**

- Batch of 100 apps completes in ~20 seconds (well under 3-minute target)
- Balances speed with OpenAI rate limits and cost
- No async queue infrastructure needed (simpler)
  **Performance:** 100 apps = 10 iterations of 10 parallel calls at ~2s each

### 4. Confidence Scores: REMOVED ✅

**Decision:** Removed confidence score calculations and UI display  
**Rationale:**

- Confidence scores were not providing useful information
- Simplified codebase by removing unused calculations
- Database column remains for backward compatibility but is set to null
  **Implementation:** No longer calculated in `lib/openai-service.ts`, not displayed in UI

### 5. Normalization Algorithm (5-Step) ✅

**Decision:** Standardized text processing before comparison  
**Steps:**

1. Convert to lowercase
2. Collapse whitespace (multiple spaces → single)
3. Trim leading/trailing whitespace
4. Remove punctuation (periods, commas, apostrophes, hyphens)
5. Expand abbreviations (KY ↔ Kentucky, oz ↔ ounce, etc.)

**Rationale:** Distinguishes trivial formatting differences (soft mismatch) from material differences (hard mismatch)

### 6. React Context for State (No Redux) ✅

**Decision:** Use React Context for auth + application selection state  
**Alternative Rejected:** Redux, Zustand, MobX  
**Rationale:**

- Sufficient for auth state + batch selection checkboxes
- No complex global store needed
- Simpler implementation (prototype-appropriate)
  **Trade-off:** Less structured than Redux (acceptable for this scope)

### 7. Session Cookies for Auth (No JWT) ✅

**Decision:** Session-based authentication with httpOnly cookies  
**Alternative Rejected:** JWT tokens  
**Rationale:**

- Simpler server-side session revocation
- No token refresh logic needed
- More secure (httpOnly prevents XSS)
  **Trade-off:** Less suitable for multi-server deployments (not needed - single Railway service)

## Design Patterns in Use

### Frontend Patterns

- **Component Composition:** Login, Dashboard, Review screens as discrete components
- **Context Providers:** AuthContext (user session), ApplicationContext (selected apps)
- **Compound Components:** ImageViewer + ComparisonTable for review screen
- **Custom Hooks:** `useAuth()`, `useApplications()`, `useBatchVerify()`
- **Navigation State Management:**
  - **Review Page:** Use in-memory refs (`previousApplicationRef`) to preserve previous application data during navigation
  - **Dashboard:** Use module-level cache (`cachedApplications`, `hasLoadedBefore`) to persist across component remounts
  - Previous content stays visible during transitions to prevent flicker
  - Loading screens only appear on true initial page loads (first visit ever)
  - Smooth, flicker-free navigation experience

### Backend Patterns

- **Service Layer:** VerificationService (AI + matching), NormalizationService, ImageService
- **Repository Pattern:** Database queries abstracted into repository functions
- **Middleware Chain:** Authentication middleware → Authorization → Request handler
- **Error Handling:** Centralized error handler with user-friendly messages
  - Network error detection with firewall/connectivity guidance
  - Graceful degradation for blocked cloud API endpoints
  - Clear messaging about system administrator contact for network restrictions

### Data Patterns

- **BLOB Storage:** Images stored directly in SQLite (no external storage)
- **JSON Columns:** `application_data` (ApplicationData format), `extracted_data`, `verification_result` (flexible schema)
- **ApplicationData Format:** Direct usage of ApplicationData interface (no backward compatibility layer)
- **Audit Logging:** All mutations tracked in `audit_log` table (immutable records)

### Validation Patterns

- **Modular Validation:** Validation rules organized into focused modules (`lib/validation/`)
  - Separation of concerns: types, constants, validators, utilities, display helpers
  - Beverage-specific validators in separate files (beer, spirits, wine)
  - Common validators shared across all beverage types
- **ApplicationData Direct Usage:** No conversion layer - database Application converted to ApplicationData format
- **Validation Pipeline:** `ApplicationData` → `AIExtractionResult` → `ValidationResult` → `VerificationResult` (legacy format for API)

**Advanced Matching Patterns:**

- **Brand Name Articles:** Leading articles (THE, A, AN) are normalized and treated as optional - "INFAMOUS GOOSE" matches "THE INFAMOUS GOOSE"
- **Producer Name Punctuation:** Punctuation differences normalized before comparison - "Geo US Trading, Inc" matches "Geo US Trading Inc"
- **State with Zip Codes:** State extraction handles zip codes - "IL 60148-1215" extracts state as "IL"
- **Alcohol Content Prefixes:** Complete text including prefixes required - "ALC. 12.5% BY VOL." not "12.5% BY VOL."
- **Importer Extraction:** Handles variations like "DISTRIBUTED AND IMPORTED BY" - extracts US importer, not foreign producer

## Component / Module Relationships

### Frontend Architecture

```
src/app/
├── (auth)/
│   └── login/                 # Login page
├── dashboard/                 # Application queue
│   └── page.tsx
├── applications/[id]/         # Review screen (side-by-side)
│   └── page.tsx
└── components/
    ├── ImageViewer.tsx        # Zoomable label images
    ├── ComparisonTable.tsx    # Field-by-field results
    ├── BatchProgressModal.tsx # Real-time batch status
    └── KeyboardLegend.tsx     # Shortcuts overlay
```

### API Architecture

```
src/app/api/
├── auth/
│   ├── login/route.ts         # POST /api/auth/login
│   ├── logout/route.ts        # POST /api/auth/logout
│   └── me/route.ts            # GET /api/auth/me
├── applications/
│   ├── route.ts               # GET /api/applications (list)
│   └── [id]/
│       ├── route.ts           # GET, PATCH /api/applications/:id
│       └── verify/route.ts    # POST /api/applications/:id/verify
└── batch/
    ├── verify/route.ts        # POST /api/batch/verify
    └── status/[id]/route.ts   # GET /api/batch/status/:id
```

### Database Schema (4 Entities)

```
User (agents + admins)
  ↓ (1:many)
Application (label compliance apps)
  ↓ (1:many)
LabelImage (front/back label BLOBs)

User + Application → AuditLog (all actions)
```

**See:** `docs/prd.md` Section 5 for detailed schema with all fields.

## Conventions

### Code Conventions

- **TypeScript everywhere:** Shared types between frontend/backend (`src/types/`)
- **API naming:** RESTful (GET /applications, POST /applications/:id/verify)
- **Component naming:** PascalCase for components, camelCase for functions
- **File structure:** Next.js App Router conventions (`app/`, `api/`)

### Data Conventions

- **Image pre-loading:** All images in database before agent access (no upload flow)
- **Beverage type:** Pre-set in application row (source of truth, not inferred)
- **Status values:** `pending`, `approved`, `rejected` (lowercase snake_case) - `needs_review` removed from UI but still supported in database
- **Match statuses:** `match`, `soft_mismatch`, `hard_mismatch`, `not_found`, `not_applicable`, `surfaced`
- **ApplicationData Format:** camelCase field names (brandName, fancifulName, producerAddress, etc.)
- **Database Storage:** `application_data` column stores ApplicationData as JSON (migrated from `expected_label_data`)

### Process Conventions

- **Memory Bank:** Read ALL files at task start, update on significant change or when asked "update memory bank"
- **Task Master:** Use for task breakdown (`.taskmaster/docs/prd.txt` → parse-prd)
- **Git workflow:** Commit frequently, push to `main` branch (auto-deploys to Railway via Railpack)
- **Railway deployment:** Uses Railpack builder (auto-detects Next.js), no nixpacks.toml needed
- **Database initialization:** Lazy initialization prevents build-time errors, runs at runtime
- **Cursor rules:** Project-specific patterns in `.cursor/rules/` (e.g., `taskmaster/`)

### Performance Conventions

- **5-second hard limit:** Any verification taking >5s needs optimization
- **Multi-image processing:** All label images (front, back, neck, side) processed together in single API call
- **AI extraction:** Looks across all images to extract all fields - information may be spread across different label panels
- **Database indexing:** Index on `status`, `assigned_agent_id`, `beverage_type`
- **Image optimization:** Images should be <500KB each (if larger, resize on seed)

---

_Last Updated: January 29, 2025 (Removed confidence scores, improved validation matching patterns for brand names, producer addresses, states, alcohol content, and importer extraction. Refactored extraction prompts to use beverage-specific functions. Added dashboard columns for Product Type and Product Source). Update when major design decisions change or patterns emerge._
