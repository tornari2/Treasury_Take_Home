# Tech Context

_Derives from [projectbrief.md](./projectbrief.md). Technologies, setup, and constraints._

## Repository State

**Current Commit:** `18ec60a` - "fix: Add missing config files and update README for code quality"  
**Branch:** `main` (up to date with `origin/main`)  
**Status:** All quality checks passing, ready for submission ✅

**Latest Changes:**
- Added `vitest.config.ts` with path alias configuration
- Added `.eslintrc.json` with Next.js and Prettier config
- Updated `tsconfig.json` to exclude vitest.config.ts
- Formatted entire codebase with Prettier
- Updated README.md to reflect current status

**Current Implementation State:**

- Core Next.js application structure complete
- Dashboard and Review pages functional
- OpenAI integration for label verification working
- Batch processing capability operational
- Validation module complete with all validators
- UI components (shadcn/ui) fully integrated
- Database helpers and schema complete
- All API routes present and functional

**File Status:**

- All critical application files restored ✅
- Configuration files present ✅
- UI components present ✅
- Validation module complete ✅
- Database helpers functional ✅

## Technologies Used

### Core Stack

| Layer         | Technology    | Version              | Purpose                     |
| ------------- | ------------- | -------------------- | --------------------------- |
| **Runtime**   | Node.js       | 20+                  | JavaScript runtime          |
| **Framework** | Next.js       | 14.2.5 (App Router)  | Full-stack React framework  |
| **Language**  | TypeScript    | 5.5.4                | Type-safe JavaScript        |
| **Database**  | SQLite        | 3.x (better-sqlite3) | Persistent storage + BLOB   |
| **AI**        | OpenAI GPT-4o | Latest               | Vision model for extraction |

### Frontend

| Technology    | Purpose                                 |
| ------------- | --------------------------------------- |
| React 18.3.1  | UI library                              |
| Tailwind CSS  | Utility-first styling                   |
| shadcn/ui     | Component library (Radix UI + Tailwind) |
| Radix UI      | Accessible component primitives         |
| Lucide React  | Icon library                            |
| React Context | State management (selection)            |
| Next.js Image | Optimized image rendering               |

### Backend

| Technology         | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| Next.js API Routes | RESTful API endpoints                               |
| FormData API       | Multipart form data parsing for file uploads        |
| bcryptjs           | ~~Password hashing~~ (not used - auth removed)      |
| better-sqlite3     | Synchronous SQLite driver                           |
| OpenAI Node SDK    | OpenAI API client                                   |
| uuid               | ~~Session ID generation~~ (not used - auth removed) |

### Development Tools

| Tool         | Purpose                     | Configuration                    |
| ------------ | --------------------------- | -------------------------------- |
| Vitest       | Testing framework           | `vitest.config.ts` (path aliases) |
| ESLint       | Code linting                | `.eslintrc.json` (Next.js + Prettier) |
| Prettier     | Code formatting             | Default config (all files formatted) |
| Husky        | Git hooks                   | Pre-commit hooks configured      |
| lint-staged  | Pre-commit quality checks   | Runs ESLint and Prettier         |
| Task Master  | Task breakdown and tracking | `.taskmaster/` directory          |
| Git + GitHub | Version control + CI/CD     | Main branch, auto-deploy Railway  |

## Development Setup

### Prerequisites

- **Node.js 20.x** (required - specified in `.nvmrc`, incompatible with Node 22+)
- npm 9.0.0+
- Git installed
- OpenAI API key (for GPT-4o Vision API)
- Railway account (for deployment, optional)

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/tornari2/Treasury_Take_Home.git
cd Treasury_Take_Home

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example.local .env.local
# Edit .env.local and add:
# OPENAI_API_KEY=sk-proj-... (required for verification)
# DATABASE_PATH=./data/database.db (default, can be overridden)
# SESSION_SECRET=your-secret-here

# 4. Initialize database (runs automatically on import)
# Database is created at first import of lib/migrations.ts
# Migrations automatically add missing columns (reviewed_at, review_notes, assigned_agent_id)

# 5. Start development server (authentication removed - no test user needed)
npm run dev

# 7. Open browser
open http://localhost:3000
```

### Environment Variables (`.env`)

```bash
# Required
OPENAI_API_KEY=sk-proj-...           # OpenAI API key (required for verification)

# Database
DATABASE_PATH=./data/database.db     # SQLite database path (default)
# For Railway deployment: /app/data/database.db

# Node Environment (automatically set by Next.js)
# NODE_ENV=development                 # development | production

# Port (optional, defaults to 3000)
# PORT=3000
```

**Note:** `.env` file is gitignored for security. Next.js automatically loads `.env` files on server startup.

### PostCSS Configuration

**File:** `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Required for:** Tailwind CSS compilation in Next.js. Without this file, CSS won't compile and styling will be missing.

### TypeScript Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Key Configuration:**

- `baseUrl: "."` - Sets the base directory for module resolution
- `paths: { "@/*": ["./*"] }` - Maps the `@/` alias to the project root directory
- `strictNullChecks: true` - Enables strict null checking (added Jan 30, 2026)

**Required for:** Path alias support (`@/components/ui/*`, `@/lib/*`, etc.). Without this configuration, imports using `@/` prefix will fail with module resolution errors.

**Usage:** Allows imports like `import { Button } from '@/components/ui/button'` instead of relative paths like `import { Button } from '../../../components/ui/button'`.

**Note:** With `strictNullChecks: true`, TypeScript will catch potential null/undefined errors. All code must properly handle nullable values.

### Node.js Version Management

**Critical:** Node.js v22 is **incompatible** with Next.js 14.2.35 and will cause:

- Corrupted webpack chunks
- Missing static assets (404 errors)
- API route failures
- CSS not loading
- Native module ABI mismatches

**Required Setup:**

- Node.js version: **20** (specified in `.nvmrc` and `package.json` engines)
- Version enforcement: `scripts/check-node-version.js` runs as `predev` hook
- NVM recommended: `nvm install 20 && nvm use 20 && nvm alias default 20`
- After switching versions: `rm -rf node_modules .next && npm install && npm rebuild better-sqlite3`

**Version Check Script:**

- Location: `scripts/check-node-version.js`
- Blocks Node v22+ with clear error message
- Runs automatically before `npm run dev` via `predev` hook
- Exits with error code 1 if unsupported version detected

### Development Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript type checking
npm run quality      # Run all quality checks

# Testing
npm run test         # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run test:run     # Run tests once (CI mode)

# Database
npx tsx scripts/test-db.ts        # Test database schema
npx tsx scripts/create-test-user.ts # Create test user
```

## Technical Constraints

### Performance Requirements

- **Single verification:** < 5 seconds (95th percentile) - Target
- **Batch processing (100):** < 3 minutes (target: ~20 seconds)
- **Page load:** < 2 seconds to interactive
- **API response (non-AI):** < 200ms (95th percentile)
- **Database queries:** < 50ms (with indexing)

### Browser Support

- **Desktop:** Chrome, Firefox, Safari, Edge (last 2 versions)
- **Tablet:** iPad Safari, Android Chrome (1024px minimum width)
- **Mobile:** Not supported (use tablet/desktop)
- **JavaScript:** Required (no graceful degradation)

### Data Constraints

- **SQLite database:** ~10GB limit (Railway persistent volume)
- **Image size:** < 500KB per image (stored as BLOB)
- **Concurrent writes:** Limited (mostly read workload, acceptable)
- **Application limit:** 150K/year sustainable with SQLite

### API Constraints

- **OpenAI rate limits:** 10 concurrent requests maximum (batch processing)
- **OpenAI costs:** ~$0.01 per application (all images processed together in single call)
- **Network latency:** Railway → OpenAI typically 200-500ms
- **Timeout:** 30 seconds per image, scales with number of images (max 2 minutes)
- **Multi-image processing:** All label images (front, back, neck, side) processed together in single API call
- **Retry logic:** Automatic retry with exponential backoff (max 2 retries for transient failures)
- **Error handling:** Custom error types for API key, timeout, network, and API errors
  - Enhanced network error messages with firewall/connectivity guidance
  - Graceful degradation for network restrictions blocking cloud APIs
  - Clear user messaging about system administrator contact for connectivity issues
- **API key validation:** Validates key presence and format before processing

### Security Requirements (Prototype)

- **Authentication:** ~~Session-based with bcrypt password hashing~~ (REMOVED - all endpoints publicly accessible)
- **HTTPS:** Enforced (Railway provides SSL)
- **Input validation:** All API inputs sanitized
- **SQL injection:** Prevented via parameterized queries
- **XSS:** Prevented via React's built-in escaping
- **CSRF:** Not implemented (acceptable for prototype)
- **Rate limiting:** Not implemented (acceptable for prototype)

## Dependencies

### Production Dependencies (package.json)

```json
{
  "next": "^14.2.5",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.5.4",
  "better-sqlite3": "^12.6.2",
  "openai": "^6.16.0",
  "bcryptjs": "^3.0.3",
  "uuid": "^13.0.0",
  "cookie": "^1.1.1",
  "tailwindcss": "^3.4.7",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.4",
  "lucide-react": "^0.469.0",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-select": "^2.1.2",
  "@radix-ui/react-checkbox": "^1.1.2"
}
```

### Development Dependencies

```json
{
  "vitest": "^4.0.18",
  "@vitest/ui": "^4.0.18",
  "@testing-library/react": "^16.0.1",
  "@testing-library/jest-dom": "^6.6.3",
  "@vitejs/plugin-react": "^5.1.2",
  "eslint": "^8.57.1",
  "eslint-config-next": "^14.2.5",
  "prettier": "^3.4.1",
  "eslint-config-prettier": "^9.1.0",
  "eslint-plugin-prettier": "^5.2.1",
  "husky": "^9.1.7",
  "lint-staged": "^15.2.11",
  "@types/node": "^22.5.5",
  "@types/react": "^18.3.5",
  "@types/better-sqlite3": "^7.6.13",
  "@types/bcryptjs": "^2.4.6",
  "@types/uuid": "^10.0.0"
}
```

### External Services

- **OpenAI API:** GPT-4o vision model
  - Endpoint: `https://api.openai.com/v1/chat/completions`
  - Error handling: Custom error types, timeout handling, retry logic
  - Network error detection: Enhanced messages for firewall/connectivity issues
  - FormatChecks extraction: Extracts bold, caps, and formatting metadata from OpenAI responses
  - Image preprocessing: Conservative thresholds (only extreme cases trigger preprocessing)
  - API key validation before processing
  - Model: `gpt-4o` (vision-capable, upgraded from GPT-4o-mini)
  - Multi-image processing: All images sent together in single API call
  - Cost: ~$0.01 per application (all images processed together)
- **Railway:** Deployment platform (to be configured)
  - Build: Railpack (auto-detects Next.js)
  - Runtime: Node.js 20
  - Persistent Volume: 10GB at `/app/data`

## Testing Infrastructure

### Test Framework: Vitest

- **Configuration:** `vitest.config.ts`
- **Test Files:** `__tests__/` directory
- **Coverage:** v8 provider
- **Current Status:** 29 tests passing

### Test Structure

```
__tests__/
├── api/              # API endpoint tests
├── lib/              # Utility function tests
└── components/      # React component tests (future)
```

### Code Quality Tools

- **ESLint:** Next.js + Prettier rules
- **Prettier:** Consistent code formatting
- **Husky:** Pre-commit Git hooks
- **lint-staged:** Run linters on staged files
- **TypeScript:** Strict type checking

## Deployment Configuration

### Railway Setup ✅ Deployed & Configured

**Builder:** Nixpacks (Railway's standard builder, auto-detects Next.js)

**Configuration Files:**

- `railway.json` - Railway configuration (Nixpacks builder)
- `.railway.toml` - Alternative Railway config format
- No Dockerfile - Using Nixpacks instead (Railway standard)

**Environment Variables (Railway dashboard):**

```bash
OPENAI_API_KEY=sk-proj-...
DATABASE_PATH=/app/data/database.db
NODE_ENV=production
```

**Build Configuration:**

- Builder: Nixpacks (configured in `railway.json`)
- Build Command: Auto-detected by Nixpacks (`npm install && npm run build`)
- Start Command: `npm start` (configured in `railway.json`)
- Node Version: 20 (specified via `.nvmrc` and `package.json` engines)

**Key Implementation Details:**

- Database lazy initialization: Prevents build-time errors, initializes at runtime
- Build-time protection: Safe no-op proxy prevents DB access during Next.js static analysis
- Build-time detection: Multiple indicators (NEXT_PHASE, NODE_ENV, npm lifecycle) ensure migrations skip during build
- Health endpoint: `/api/health` for Railway health checks
- ESLint skipped during builds: Configured in `next.config.js`
- TypeScript types: Complete type definitions in `types/database.ts`
- TypeScript strictNullChecks: Enabled (`strictNullChecks: true` in `tsconfig.json`)

- **Build Fixes (Jan 30, 2026):**
  - Fixed build hanging by reverting lazy initialization in db-helpers.ts, kept top-level `ensureMigrations()` call which properly detects build time
  - Fixed `Cannot find module for page: /_document` error by adding `pages/_document.tsx` (required for Next.js pages manifest)
  - Added `pages/__app-router-placeholder.tsx` to ensure Next.js generates `pages-manifest.json` even when using App Router exclusively
  - Fixed TypeScript strictNullChecks errors:
    - `app/review/[id]/page.tsx`: Added null-safe handling for `params.id` from `useParams()`
    - `app/api/debug/env/route.ts`: Added null coalescing for `process.env[key]` values
    - `lib/validation/validators/common.ts`: Fixed boolean type coercion in `hasName` variable
  - **Build Process:** If encountering manifest errors, clean build cache: `rm -rf .next && npm run build`

- **Node.js Version Compatibility Fixes (Jan 30, 2026):**
  - **Critical:** Node.js v22 incompatible with Next.js 14.2.35 - causes corrupted builds
  - Implemented version enforcement: `scripts/check-node-version.js` + `predev` hook
  - Created `.nvmrc` specifying Node.js version `20`
  - Updated `package.json` engines: `>=18.0.0 <22.0.0`
  - Fixed all development server issues (500 errors, 404s, CSS not loading, API failures) via Node v20 switch
  - Disabled webpack cache in dev mode (`config.cache = false`) to prevent stale chunk issues
  - Required after version switch: `rm -rf node_modules .next && npm install && npm rebuild better-sqlite3`

**Persistent Volume:**

- **Mount Path:** `/app/data`
- **Purpose:** SQLite database file storage
- **Size:** 10GB (sufficient for 150K apps/year with images)
- **Backup:** Manual download via Railway dashboard (future: automated)

**Deployment URL:**

- Production: `https://treasurytakehome-production.up.railway.app`
- Auto-deploy: Enabled (pushes to `main` branch trigger deployment)

**User Management:**

- Registration endpoint: `/api/auth/register` (allows public signup)
- User creation scripts: `scripts/create-test-user.ts`, `scripts/create-users.ts`
- Database export: `npm run db:export` (creates `database-backup.db`)

## Code Organization (Updated January 30, 2026)

### Project Structure

**Key Directories:**

```
Treasury_Take_Home/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (all dynamic)
│   │   ├── applications/         # Application CRUD and verification
│   │   ├── auth/                # Auth endpoints (login, register, logout, me)
│   │   ├── batch/               # Batch verification
│   │   └── health/              # Health check endpoint
│   ├── dashboard/               # Dashboard page
│   └── review/                  # Review page
├── pages/                        # Next.js Pages Router (build-time only)
│   ├── _document.tsx             # Custom document (required for pages manifest)
│   └── __app-router-placeholder.tsx  # Placeholder page (ensures manifest generation)
├── components/
│   ├── application-form.tsx      # Main form orchestrator (~100 lines)
│   ├── application-form/         # Form section components (NEW)
│   │   ├── BasicInfoSection.tsx
│   │   ├── BrandInfoSection.tsx
│   │   ├── ProducerInfoSection.tsx
│   │   ├── WineInfoSection.tsx
│   │   ├── ImageUploadSection.tsx
│   │   └── useApplicationForm.ts
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── db.ts                    # Database connection (build-time safe)
│   ├── db-helpers.ts            # Database query helpers
│   ├── migrations.ts            # Database migrations (build-time safe)
│   ├── validation/              # Validation module
│   │   └── validators/
│   │       └── common.ts         # validateProducerNameAddress() decomposed
│   └── ...
├── public/test_labels/          # Test label images (consolidated)
└── scripts/                     # Utility scripts
```

### Component Architecture

**Application Form Components:**

```
components/
├── application-form.tsx          # Main form orchestrator (~100 lines)
└── application-form/
    ├── BasicInfoSection.tsx       # TTB ID, Beverage Type, Origin Type
    ├── BrandInfoSection.tsx       # Brand Name, Fanciful Name
    ├── ProducerInfoSection.tsx    # Producer/Importer Name, City, State
    ├── WineInfoSection.tsx       # Appellation, Varietal (conditional)
    ├── ImageUploadSection.tsx    # Image upload and management
    └── useApplicationForm.ts     # Custom hook for form state/logic
```

**Benefits:**

- Smaller, focused components (easier to maintain and test)
- Clear separation of concerns
- Reusable form hook for state management
- Improved code readability

### Validation Module Architecture

### Modular Structure (`lib/validation/`)

The validation rules are organized into a modular folder structure for better maintainability:

```
lib/validation/
├── types.ts              # Enums (BeverageType, OriginType, MatchStatus) and interfaces (ApplicationData, AIExtractionResult, etc.)
├── validators/
│   ├── common.ts         # Common validators (validateProducerNameAddress decomposed into helpers)
│   │                     # Helper functions: checkCityInAddress, checkStateInAddress, checkNameMatch, etc.
│   ├── wine.ts           # Wine-specific validators
│   ├── spirits.ts        # Spirits-specific validators
│   └── beer.ts           # Beer-specific validators (to be created)
├── constants.ts          # Validation constants (REQUIRED_HEALTH_WARNING, ALCOHOL_CONTENT_PATTERNS, NET_CONTENTS_PATTERNS)
├── prompts.ts            # AI extraction prompts (BEER_EXTRACTION_PROMPT, SPIRITS_EXTRACTION_PROMPT, WINE_EXTRACTION_PROMPT)
├── utils.ts              # Utility functions (normalizeString, stringsMatch, isSoftMismatch, matchesAnyPattern, normalizeState, statesMatch, normalizeCity, citiesMatch, normalizeBusinessEntitySuffix, producerNamesMatchIgnoringEntitySuffix, healthWarningMatchesExact, etc.)
├── validators/
│   ├── common.ts         # Common validators used across all beverage types
│   │                     # validateProducerNameAddress() decomposed into helpers:
│   │                     # - checkCityInAddress(), checkStateInAddress(), checkNameMatch()
│   │                     # - checkAllPartsPresent(), validatePhraseRequirement()
│   ├── beer.ts           # Beer-specific validators (placeholder for future)
│   ├── spirits.ts        # Spirits-specific validators (age statement)
│   └── wine.ts           # Wine-specific validators (appellation, varietal, vintage, sulfite, foreign wine percentage)
├── surfaced.ts           # Surfaced fields extraction functions (extractBeerSurfacedFields, extractSpiritsSurfacedFields, extractWineSurfacedFields)
├── validation.ts         # Main validation functions (validateLabel, validateBeerLabel, validateSpiritsLabel, validateWineLabel, calculateOverallStatus)
├── display.ts            # Display helpers (FIELD_LABELS, STATUS_DISPLAY, REQUIRED_FIELDS)
└── index.ts              # Main export file (re-exports all public APIs)
```

### ApplicationData Format

The system now uses `ApplicationData` as the source of truth for application data:

```typescript
interface ApplicationData {
  id: string;
  ttbId?: string | null; // TTB ID for the application (optional)
  beverageType: BeverageType; // 'beer' | 'wine' | 'spirits'
  originType: OriginType; // 'domestic' | 'imported'
  brandName: string; // Required - must match label
  fancifulName?: string | null; // Optional - if present, must match label
  producerName: string; // Required - must match label
  producerAddress: {
    city: string; // Required - must match label
    state: string; // Required - must match label
  };
  appellation?: string | null; // Wine-specific - if present, must match label
  varietal?: string | null; // Wine-specific - if present, classType must match
  vintageDate?: string | null; // Wine-specific - if present, must match label
  labelImages: string[]; // Array of image URLs or base64 strings
}
```

**Key Changes:**

- `originCode: string` replaced with `originType: OriginType` enum (DOMESTIC/IMPORTED)
- Origin codes infrastructure completely removed (no longer using TTB origin code mappings)
- All origin code references removed from codebase
- Application converter uses `inferOriginTypeFromCountry()` instead of origin codes

**Database Storage:** Stored as JSON in `application_data` column (migrated from `expected_label_data`)

**Manual Application Creation:** Users can create applications via a form dialog accessible from the dashboard. The form:

- Matches the ApplicationData structure exactly
- Supports all fields including conditional wine-specific fields
- Allows multiple image uploads with type selection (front/back/side/neck)
- Validates input client-side and server-side
- Stores images as BLOBs in `label_images` table
- Updates ApplicationData with image IDs after creation

**Conversion:** `lib/application-converter.ts` converts database `Application` records to `ApplicationData` format

### Validation Rules Summary

**Cross-Check Fields (Bidirectional):** If field exists in application OR label, it must exist in both and match:

- Brand Name (always required)
- Fanciful Name (optional)
- Producer Name & Address (only city and state validated, not full street address)
  - **Phrase Requirements:** Producer name/address must immediately follow required phrases with no intervening text
    - Spirits/Wine: Must follow "Bottled By" or "Imported By" → SOFT_MISMATCH if missing
    - Imported Beer: Must follow "Imported by" or similar phrase → SOFT_MISMATCH if missing
    - Domestic Beer: No phrase requirement
- Wine Varietal (if application has varietal, classType must match)
- Vintage Date (wine, if present)
- Appellation (wine, if present)

**Presence Fields (Required on Label):**

- Class/Type designation (all beverages)
- Net Contents (all beverages)
  - Beer: U.S. customary units REQUIRED (fl. oz., pints, quarts, gallons), metric optional
  - Wine/Spirits: Metric units REQUIRED (mL, L), U.S. customary optional
  - Wine/Spirits: Must match authorized standards of fill (SOFT_MISMATCH if non-standard)
- Health Warning (all beverages, exact text + formatting)
- Alcohol Content (all beverages - REQUIRED)
  - Beer: Required, special terms validated (low/reduced alcohol < 2.5%, non-alcoholic requires statement, alcohol free = 0%)
  - Wine: > 14% ABV requires numerical statement, 7-14% ABV optional if "table wine" or "light wine"
  - Spirits: Standard format validation
- Country of Origin (required if `originType === IMPORTED`, shows "N/A - Domestic" for domestic)
- Age Statement (spirits only, conditionally required: mandatory for whisky &lt; 4 years, grape lees/pomace/marc brandy &lt; 2 years; approved format when present)
- Sulfite Declaration (wine only)
- Appellation (wine, conditionally required if varietal/vintage/estate bottled present)
- Foreign Wine Percentage (wine, required if foreign wine referenced)

**Special Validation Rules:**

- **State Equivalence:** State names and abbreviations are equivalent (ME = Maine, CA = California)
- **Standards of Fill:** Wine and spirits must use authorized container sizes (25 standard sizes each, wine allows even liters ≥4L)
- **Net Contents Format:** Normalized variations accepted (mL/ml./ML, L/litre/liter, fl. oz./fluid ounces)
- **Producer Name/Address Phrase Requirements:**
  - Spirits: Name/address must immediately follow "Bottled By" or "Imported By" (SOFT_MISMATCH if missing)
  - Wine: Name/address must immediately follow "Bottled By" or "Imported By" (SOFT_MISMATCH if missing)
  - Imported Beer: Importer name/address must immediately follow "Imported by" or similar phrase (SOFT_MISMATCH if missing)
  - Domestic Beer: No phrase requirement

## Database Management

### Migrations

**File:** `lib/migrations.ts`

**Automatic Migrations:**

- Migrations run automatically when database helpers are imported (`ensureMigrations()`)
- Handles missing columns for older databases:
  - `assigned_agent_id` column (if missing)
  - `reviewed_at` column (if missing)
  - `review_notes` column (if missing)
- Renames `expected_label_data` to `application_data` if needed
- Updates CHECK constraints for image types to include 'other'

**Manual Migration:** Run `npx tsx scripts/create-batch-applications.ts` to seed test data

### Schema

- **users:** User accounts table exists but authentication removed (endpoints are public)
- **applications:** Application records with `application_data` (JSON, ApplicationData format)
- **label_images:** Label images with extracted/verification data
- **audit_logs:** Table exists but audit logging is disabled until authentication is re-enabled (helpers available in `db-helpers.ts` for future use)

### Indexes

- `idx_applications_status` - Status filtering
- `idx_applications_assigned_agent` - Agent filtering
- `idx_label_images_application` - Image lookup
- `idx_audit_logs_user` - User activity tracking
- `idx_audit_logs_application` - Application history
- `idx_audit_logs_timestamp` - Time-based queries

## UI Component Library

### shadcn/ui Integration

The project uses **shadcn/ui** as the primary component library, providing:

- **Accessible Components:** Built on Radix UI primitives with full ARIA support
- **Consistent Design System:** Unified styling with Tailwind CSS
- **Copy-Paste Architecture:** Components live in codebase for full customization
- **TypeScript Support:** Fully typed components with IntelliSense support

### Installed Components

- **Button** - Multiple variants (default, destructive, outline, ghost, link, secondary)
- **Input** - Form input fields with consistent styling
- **Select** - Accessible dropdown menus
- **Table** - Data tables with proper semantic structure
- **Badge** - Status indicators and labels
- **Alert** - Notification and feedback messages
- **Textarea** - Multi-line text input
- **Checkbox** - Accessible checkbox inputs
- **Label** - Form labels with proper associations
- **Dialog** - Modal dialogs for forms and overlays (January 28, 2025)

### Component Location

All shadcn/ui components are located in `components/ui/` directory and can be customized as needed.

## Project Documentation

### Core Documentation Files

- **README.md** - Project overview, setup instructions, API endpoints, deployment guide
- **APPROACH.md** - Technical approach, tools used, and assumptions
  - GPT-4o model selection rationale (accuracy over speed)
  - Multi-image processing strategy
  - Validation architecture
  - Error handling and resilience
  - Infrastructure and network assumptions
- **TRADE_OFFS_AND_LIMITATIONS.md** - Trade-offs and known limitations
  - Model selection trade-offs (GPT-4o vs. hybrid OCR/Vision)
  - Production recommendations (Google Vision + GPT-4o-mini)
  - Conditional preprocessing for poor-quality images
  - Validation scope limitations (field-level vs. overall assessment)
  - Edge case handling limitations
  - Scalability and security considerations

### Memory Bank Documentation

Located in `memory-bank/` directory:
- **activeContext.md** - Current work focus and recent changes
- **progress.md** - Implementation status and what's left
- **techContext.md** - Technologies, setup, and constraints (this file)

---

_Last Updated: January 30, 2026 (Documentation: Added APPROACH.md and TRADE_OFFS_AND_LIMITATIONS.md. Previous: Validation utilities: Added normalizeCity and citiesMatch functions for handling city name variations with directional prefixes. Updated normalizeState to handle periods in state abbreviations. Enhanced validation accuracy for net contents, varietal/appellation extraction, brand/fanciful names, health warnings, and producer/importer addresses. Update when dependencies, tools, or constraints change._
