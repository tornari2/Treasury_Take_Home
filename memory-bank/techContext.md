# Tech Context

_Derives from [projectbrief.md](./projectbrief.md). Technologies, setup, and constraints._

## Technologies Used

### Core Stack

| Layer         | Technology         | Version              | Purpose                     |
| ------------- | ------------------ | -------------------- | --------------------------- |
| **Runtime**   | Node.js            | 20+                  | JavaScript runtime          |
| **Framework** | Next.js            | 14.2.5 (App Router)  | Full-stack React framework  |
| **Language**  | TypeScript         | 5.5.4                | Type-safe JavaScript        |
| **Database**  | SQLite             | 3.x (better-sqlite3) | Persistent storage + BLOB   |
| **AI**        | OpenAI GPT-4o-mini | Latest               | Vision model for extraction |

### Frontend

| Technology    | Purpose                            |
| ------------- | ---------------------------------- |
| React 18.3.1  | UI library                         |
| Tailwind CSS  | Utility-first styling              |
| React Context | State management (auth, selection) |
| Next.js Image | Optimized image rendering          |

### Backend

| Technology         | Purpose                           |
| ------------------ | --------------------------------- |
| Next.js API Routes | RESTful API endpoints             |
| bcryptjs           | Password hashing (cost factor 10) |
| better-sqlite3     | Synchronous SQLite driver         |
| OpenAI Node SDK    | OpenAI API client                 |
| uuid               | Session ID generation             |

### Development Tools

| Tool         | Purpose                     |
| ------------ | --------------------------- |
| Vitest       | Testing framework           |
| ESLint       | Code linting                |
| Prettier     | Code formatting             |
| Husky        | Git hooks                   |
| lint-staged  | Pre-commit quality checks   |
| Task Master  | Task breakdown and tracking |
| Git + GitHub | Version control + CI/CD     |

## Development Setup

### Prerequisites

- Node.js 18+ installed
- Git installed
- OpenAI API key
- Railway account (for deployment)

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
# OPENAI_API_KEY=sk-proj-...
# DATABASE_PATH=./data/database.db
# SESSION_SECRET=your-secret-here

# 4. Initialize database (runs automatically on import)
# Database is created at first import of lib/migrations.ts

# 5. Create test user
npx tsx scripts/create-test-user.ts

# 6. Start development server
npm run dev

# 7. Open browser
open http://localhost:3000
```

### Environment Variables (`.env.local`)

```bash
# Required
OPENAI_API_KEY=sk-proj-...           # OpenAI API key

# Database
DATABASE_PATH=./data/database.db     # SQLite database path

# Authentication
SESSION_SECRET=your-secret-here      # Session encryption key

# Node Environment
NODE_ENV=development                 # development | production
```

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
- **OpenAI costs:** ~$0.01 per application (2 images × GPT-4o-mini)
- **Network latency:** Railway → OpenAI typically 200-500ms
- **Timeout:** 10 seconds per OpenAI call (retry once on timeout)

### Security Requirements (Prototype)

- **Authentication:** Session-based with bcrypt password hashing
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
  "tailwindcss": "^3.4.7"
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

- **OpenAI API:** GPT-4o-mini vision model
  - Endpoint: `https://api.openai.com/v1/chat/completions`
  - Model: `gpt-4o-mini` (vision-capable)
  - Cost: ~$0.005 per image
- **Railway:** Deployment platform (to be configured)
  - Build: Nixpacks (auto-detects Next.js)
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

### Railway Setup (To Be Configured)

```bash
# Environment variables (Railway dashboard)
OPENAI_API_KEY=sk-proj-...
DATABASE_PATH=/app/data/database.db
SESSION_SECRET=production-secret-here
NODE_ENV=production
```

### Build Configuration

```json
{
  "builder": "NIXPACKS",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start",
  "healthcheck": {
    "path": "/api/health",
    "interval": 30,
    "timeout": 10
  }
}
```

### Persistent Volume

- **Mount Path:** `/app/data`
- **Purpose:** SQLite database file storage
- **Size:** 10GB (sufficient for 150K apps/year with images)
- **Backup:** Manual download via Railway dashboard (future: automated)

## Database Management

### Schema

- **users:** User accounts with authentication
- **applications:** Application records with expected label data
- **label_images:** Label images with extracted/verification data
- **audit_logs:** Action tracking for all user activities

### Indexes

- `idx_applications_status` - Status filtering
- `idx_applications_assigned_agent` - Agent filtering
- `idx_label_images_application` - Image lookup
- `idx_audit_logs_user` - User activity tracking
- `idx_audit_logs_application` - Application history
- `idx_audit_logs_timestamp` - Time-based queries

---

_Last Updated: January 27, 2025 (Implementation complete, testing and code quality tools added). Update when dependencies, tools, or constraints change._
