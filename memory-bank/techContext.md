# Tech Context

_Derives from [projectbrief.md](./projectbrief.md). Technologies, setup, and constraints._

## Technologies Used

### Core Stack

| Layer         | Technology         | Version              | Purpose                     |
| ------------- | ------------------ | -------------------- | --------------------------- |
| **Runtime**   | Node.js            | 20+                  | JavaScript runtime          |
| **Framework** | Next.js            | 14+ (App Router)     | Full-stack React framework  |
| **Language**  | TypeScript         | 5+                   | Type-safe JavaScript        |
| **Database**  | SQLite             | 3.x (better-sqlite3) | Persistent storage + BLOB   |
| **AI**        | OpenAI GPT-4o-mini | Latest               | Vision model for extraction |

### Frontend

| Technology    | Purpose                            |
| ------------- | ---------------------------------- |
| React 18+     | UI library                         |
| Tailwind CSS  | Utility-first styling              |
| shadcn/ui     | Pre-built UI components            |
| React Context | State management (auth, selection) |
| next/image    | Optimized image rendering          |

### Backend

| Technology         | Purpose                           |
| ------------------ | --------------------------------- |
| Next.js API Routes | RESTful API endpoints             |
| bcrypt             | Password hashing (cost factor 12) |
| better-sqlite3     | Synchronous SQLite driver         |
| OpenAI Node SDK    | OpenAI API client                 |

### Development Tools

| Tool                   | Purpose                     |
| ---------------------- | --------------------------- |
| Task Master            | Task breakdown and tracking |
| ESLint + Prettier      | Code linting and formatting |
| Git + GitHub           | Version control + CI/CD     |
| Railway CLI (optional) | Local Railway testing       |

## Development Setup

### Prerequisites

- Node.js 20+ installed
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
cp .env.example .env
# Edit .env and add OPENAI_API_KEY=sk-proj-...

# 4. Initialize database
npm run db:init     # Create schema
npm run db:seed     # Load sample data (50-100 applications)

# 5. Start development server
npm run dev

# 6. Open browser
open http://localhost:3000
```

### Environment Variables (`.env`)

```bash
# Required
OPENAI_API_KEY=sk-proj-...           # OpenAI API key

# Database
DATABASE_URL=file:./data/treasury.db # SQLite database path

# Authentication
JWT_SECRET=your-secure-random-string # Session signing key
SESSION_SECRET=another-random-string # Session encryption

# Node Environment
NODE_ENV=development                 # development | production
```

### Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run db:init      # Initialize database schema
npm run db:seed      # Seed sample data
npm run db:reset     # Drop + recreate + seed
```

### Task Master Usage

```bash
# Initialize project (already done)
# See .taskmaster/ directory

# Use Cursor commands (Cmd+K):
# @tm/parse-prd        # Parse PRD into tasks
# @tm/list-tasks       # Show all tasks
# @tm/next-task        # Get next task to work on
# @tm/to-done          # Mark current task done
```

## Technical Constraints

### Performance Requirements

- **Single verification:** < 5 seconds (95th percentile)
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
- **Image size:** < 500KB per image (optimize on seed if needed)
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
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "better-sqlite3": "^9.0.0",
  "openai": "^4.0.0",
  "bcrypt": "^5.1.0",
  "zod": "^3.22.0",
  "tailwindcss": "^3.4.0"
}
```

### Development Dependencies

```json
{
  "eslint": "^8.0.0",
  "prettier": "^3.0.0",
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/better-sqlite3": "^7.6.0",
  "@types/bcrypt": "^5.0.0"
}
```

### External Services

- **OpenAI API:** GPT-4o-mini vision model
  - Endpoint: `https://api.openai.com/v1/chat/completions`
  - Model: `gpt-4o-mini` (vision-capable)
  - Cost: ~$0.005 per image
- **Railway:** Deployment platform
  - Build: Nixpacks (auto-detects Next.js)
  - Runtime: Node.js 20
  - Persistent Volume: 10GB at `/app/data`

## Deployment Configuration

### Railway Setup

```bash
# Environment variables (Railway dashboard)
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=file:/app/data/treasury.db
JWT_SECRET=production-secret-here
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

### Auto-Deploy Pipeline

1. Push to GitHub `main` branch
2. Railway webhook detects push
3. Railway builds (`npm install && npm run build`)
4. Railway starts (`npm start`)
5. Health check at `/api/health`
6. Live at `treasury-app.railway.app`

## Database Management

### Schema Initialization

```sql
-- src/lib/db/schema.sql
CREATE TABLE users (...);
CREATE TABLE applications (...);
CREATE TABLE label_images (...);
CREATE TABLE audit_log (...);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_agent ON applications(assigned_agent_id);
CREATE INDEX idx_label_images_app ON label_images(application_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
```

### Sample Data Seeding

```bash
# src/lib/db/seed.ts
npm run db:seed
# Creates:
# - 2 users (agent + admin)
# - 50-100 applications (spirits, wine, beer mix)
# - 100-200 label images (front + back per app)
# - Variety of match/mismatch scenarios
```

---

_Last Updated: January 26, 2025 (Tech stack finalized). Update when dependencies, tools, or constraints change._
