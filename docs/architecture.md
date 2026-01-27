# TTB Label Verification System - Architecture

## System Architecture Overview

```mermaid
graph TB
    subgraph "Railway - Single Service"
        subgraph "Frontend Layer"
            UI[Next.js Frontend<br/>React + TypeScript]
            Auth[Auth Context<br/>Session Management]
            State[React Context<br/>Application State]
        end

        subgraph "API Layer"
            API[Next.js API Routes<br/>RESTful Endpoints]
            AuthM[Auth Middleware<br/>Session Validation]
            Verify[Verification Service<br/>Match Logic]
            Batch[Batch Processor<br/>10 Concurrent Workers]
        end

        subgraph "Data Layer"
            DB[(SQLite Database<br/>Applications + Images)]
            BlobStore[BLOB Storage<br/>Label Images]
        end
    end

    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4o-mini Vision]
    end

    UI --> Auth
    UI --> State
    UI --> API
    API --> AuthM
    AuthM --> Verify
    AuthM --> Batch
    Verify --> DB
    Batch --> DB
    Verify --> OpenAI
    Batch --> OpenAI
    DB --> BlobStore

    style UI fill:#e1f5ff
    style API fill:#fff4e1
    style DB fill:#e8f5e9
    style OpenAI fill:#fce4ec
```

## Data Flow - Single Application Verification

```mermaid
sequenceDiagram
    participant Agent as Agent Browser
    participant UI as Next.js Frontend
    participant API as API Routes
    participant DB as SQLite DB
    participant AI as OpenAI GPT-4o-mini

    Agent->>UI: Click application row
    UI->>UI: Navigate to review screen
    UI->>API: POST /api/applications/:id/verify
    activate API

    API->>DB: Fetch application + images
    DB-->>API: Application data + BLOB images

    API->>AI: Send front label image + prompt
    activate AI
    AI-->>API: Extracted front label JSON
    deactivate AI

    API->>AI: Send back label image + prompt
    activate AI
    AI-->>API: Extracted back label JSON
    deactivate AI

    API->>API: Run normalization + matching logic
    API->>API: Calculate match/soft/hard status

    API->>DB: Store verification results + timing
    API-->>UI: Return verification results
    deactivate API

    UI->>UI: Render side-by-side comparison
    UI->>Agent: Display color-coded results (<5s total)
```

## Data Flow - Batch Processing

```mermaid
sequenceDiagram
    participant Agent as Agent Browser
    participant UI as Next.js Frontend
    participant API as API Routes
    participant Batch as Batch Processor
    participant DB as SQLite DB
    participant AI as OpenAI GPT-4o-mini

    Agent->>UI: Select 100 applications
    Agent->>UI: Click "Verify Selected"
    UI->>API: POST /api/batch/verify<br/>{application_ids: [1,2,...100]}
    activate API

    API->>Batch: Create batch job
    API-->>UI: Return batch_id + status URL
    deactivate API

    UI->>UI: Show progress modal

    loop Every 2 seconds
        UI->>API: GET /api/batch/status/:batchId
        API-->>UI: {processed: 45, total: 100, status: "processing"}
    end

    activate Batch
    Batch->>DB: Fetch all applications + images

    par Process 10 concurrent applications
        Batch->>AI: Verify app 1-10 (parallel)
        AI-->>Batch: Results 1-10
        Batch->>AI: Verify app 11-20 (parallel)
        AI-->>Batch: Results 11-20
        Note over Batch,AI: Continue until all 100 processed
    end

    Batch->>DB: Store all verification results
    Batch->>Batch: Update batch status to "complete"
    deactivate Batch

    UI->>API: GET /api/batch/status/:batchId
    API-->>UI: {processed: 100, total: 100, status: "complete"}
    UI->>Agent: Show completion notification
```

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        Login[LoginPage]
        Dashboard[Dashboard<br/>Application Queue]
        Review[ReviewPage<br/>Side-by-Side View]
        ImageViewer[ImageViewer<br/>Zoom/Pan]
        ComparisonTable[ComparisonTable<br/>Color-Coded Fields]
        BatchModal[BatchProgressModal]
    end

    subgraph "Context Providers"
        AuthContext[AuthContext<br/>User Session]
        AppContext[ApplicationContext<br/>Selected Apps]
    end

    subgraph "API Routes"
        AuthAPI[/api/auth/*]
        AppAPI[/api/applications/*]
        BatchAPI[/api/batch/*]
    end

    subgraph "Services"
        AuthService[AuthService<br/>Session + bcrypt]
        VerificationService[VerificationService<br/>AI + Matching]
        NormalizationService[NormalizationService<br/>Text Normalization]
        ImageService[ImageService<br/>BLOB Management]
    end

    Login --> AuthContext
    Dashboard --> AuthContext
    Dashboard --> AppContext
    Review --> AppContext
    Review --> ImageViewer
    Review --> ComparisonTable
    Dashboard --> BatchModal

    AuthAPI --> AuthService
    AppAPI --> VerificationService
    BatchAPI --> VerificationService
    VerificationService --> NormalizationService
    VerificationService --> ImageService

    style Login fill:#e1f5ff
    style Dashboard fill:#e1f5ff
    style Review fill:#e1f5ff
    style AuthContext fill:#fff4e1
    style VerificationService fill:#e8f5e9
```

## Database Schema

```mermaid
erDiagram
    User ||--o{ Application : "assigned_to"
    Application ||--|{ LabelImage : "has"
    Application ||--o{ AuditLog : "tracked_in"
    User ||--o{ AuditLog : "performed_by"

    User {
        int id PK
        string email UK
        string password_hash
        string name
        enum role
        timestamp created_at
        timestamp last_login
    }

    Application {
        int id PK
        string applicant_name
        enum beverage_type
        enum status
        int assigned_agent_id FK
        json expected_label_data
        timestamp created_at
        timestamp reviewed_at
        text review_notes
    }

    LabelImage {
        int id PK
        int application_id FK
        enum image_type
        blob image_data
        string mime_type
        json extracted_data
        json verification_result
        float confidence_score
        timestamp processed_at
        int processing_time_ms
    }

    AuditLog {
        int id PK
        int user_id FK
        int application_id FK
        enum action
        timestamp timestamp
        json details
    }
```

## Verification Logic Flow

```mermaid
flowchart TD
    Start([Agent triggers verification]) --> LoadApp[Load application from DB]
    LoadApp --> LoadImages[Load front + back images]
    LoadImages --> ExtractFront[Send front image to GPT-4o-mini]

    ExtractFront --> ParseFront{Parse front<br/>JSON response}
    ParseFront -->|Invalid JSON| ErrorFront[Log error, mark as failed]
    ParseFront -->|Valid| ExtractBack[Send back image to GPT-4o-mini]

    ExtractBack --> ParseBack{Parse back<br/>JSON response}
    ParseBack -->|Invalid JSON| ErrorBack[Log error, mark as failed]
    ParseBack -->|Valid| Merge[Merge front + back extracted data]

    Merge --> GetExpected[Get expected_label_data from application]
    GetExpected --> Loop{For each<br/>required field}

    Loop -->|Next field| CheckField{Field extracted?}
    CheckField -->|No| MarkMissing[Mark as NOT FOUND / Red]
    CheckField -->|Yes| CheckHealth{Is health_warning<br/>field?}

    CheckHealth -->|Yes| ExactMatch{Exact match?<br/>Case + Bold + Text}
    ExactMatch -->|No| MarkHardHealth[Mark as HARD MISMATCH / Red]
    ExactMatch -->|Yes| MarkMatchHealth[Mark as MATCH / Green]

    CheckHealth -->|No| Normalize[Normalize both values]
    Normalize --> CompareNorm{Exact match<br/>after normalization?}

    CompareNorm -->|Yes| CheckConfidence{Confidence > 0.85?}
    CheckConfidence -->|Yes| MarkMatch[Mark as MATCH / Green]
    CheckConfidence -->|No| MarkSoftConf[Mark as SOFT MISMATCH / Yellow<br/>Low confidence]

    CompareNorm -->|No| CheckSemantic{Semantically<br/>equivalent?}
    CheckSemantic -->|Yes| MarkSoft[Mark as SOFT MISMATCH / Yellow<br/>Case/punctuation diff]
    CheckSemantic -->|No| MarkHard[Mark as HARD MISMATCH / Red]

    MarkMissing --> Loop
    MarkHardHealth --> Loop
    MarkMatchHealth --> Loop
    MarkMatch --> Loop
    MarkSoftConf --> Loop
    MarkSoft --> Loop
    MarkHard --> Loop

    Loop -->|Done| AutoStatus{Any soft<br/>mismatches?}
    AutoStatus -->|Yes| SetReview[Auto-update to NEEDS REVIEW]
    AutoStatus -->|No| KeepPending[Keep as PENDING]

    SetReview --> SaveResults[Save verification results to DB]
    KeepPending --> SaveResults
    SaveResults --> Return([Return results to UI])

    ErrorFront --> Return
    ErrorBack --> Return

    style Start fill:#e1f5ff
    style Return fill:#e1f5ff
    style MarkMatch fill:#c8e6c9
    style MarkSoft fill:#fff9c4
    style MarkHard fill:#ffcdd2
    style MarkHardHealth fill:#ffcdd2
    style MarkMissing fill:#ffcdd2
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Railway - Single Service"
        App[Next.js Full-Stack App<br/>Frontend + API Routes]
        SQLite[(SQLite Database<br/>Persistent Volume<br/>/app/data)]
    end

    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4o-mini Vision]
        GitHub[GitHub Repository<br/>Version Control]
    end

    Agent[Agent Browser] -->|HTTPS| App
    GitHub -->|Auto Deploy on Push| App
    App --> SQLite
    App -->|API Calls| OpenAI

    style Agent fill:#e1f5ff
    style App fill:#fff4e1
    style SQLite fill:#e8f5e9
    style OpenAI fill:#fce4ec
    style GitHub fill:#f3e5f5
```

## Technology Stack Summary

| Layer                | Technology                | Purpose                                 |
| -------------------- | ------------------------- | --------------------------------------- |
| **Framework**        | Next.js 14+ (App Router)  | Full-stack React framework with SSR/SSG |
| **UI Components**    | Tailwind CSS + shadcn/ui  | Styling + pre-built components          |
| **State Management** | React Context             | Authentication + application state      |
| **API Layer**        | Next.js API Routes        | RESTful API endpoints (same codebase)   |
| **Database**         | SQLite (better-sqlite3)   | Persistent storage with BLOB support    |
| **AI Integration**   | OpenAI Node SDK           | GPT-4o-mini vision model                |
| **Authentication**   | bcrypt + httpOnly cookies | Session-based auth                      |
| **Image Handling**   | sharp (optional)          | Image processing/optimization if needed |
| **Deployment**       | Railway (single service)  | Full-stack hosting + persistent volume  |
| **Version Control**  | Git + GitHub              | Source control + auto-deploy            |
| **Runtime**          | Node.js 20+               | JavaScript runtime                      |

## Performance Optimization Strategy

```mermaid
flowchart LR
    subgraph "Frontend Optimizations"
        A1[Image lazy loading]
        A2[React.memo for lists]
        A3[Debounced search/filters]
        A4[Optimistic UI updates]
    end

    subgraph "API Optimizations"
        B1[Connection pooling]
        B2[Query result caching]
        B3[Parallel OpenAI calls 10x]
        B4[Index on status + agent_id]
    end

    subgraph "AI Optimizations"
        C1[Concurrent requests]
        C2[Structured output mode]
        C3[Optimized prompts]
        C4[Retry with backoff]
    end

    A1 --> Target[Target: <5s verification]
    A2 --> Target
    A3 --> Target
    A4 --> Target
    B1 --> Target
    B2 --> Target
    B3 --> Target
    B4 --> Target
    C1 --> Target
    C2 --> Target
    C3 --> Target
    C4 --> Target

    style Target fill:#c8e6c9
```

## Security Architecture

```mermaid
flowchart TD
    Request[Incoming Request] --> HTTPS{HTTPS?}
    HTTPS -->|No| Reject[Reject - Force HTTPS]
    HTTPS -->|Yes| Auth{Has valid<br/>session cookie?}

    Auth -->|No| Login{Is /login<br/>endpoint?}
    Login -->|No| Reject401[Return 401 Unauthorized]
    Login -->|Yes| ValidateCreds[Validate credentials]

    ValidateCreds --> CheckUser{User exists +<br/>password match?}
    CheckUser -->|No| Reject401
    CheckUser -->|Yes| CreateSession[Create httpOnly cookie]

    Auth -->|Yes| Validate[Validate session]
    Validate --> CheckExpiry{Session<br/>expired?}
    CheckExpiry -->|Yes| Reject401
    CheckExpiry -->|No| Sanitize[Sanitize input params]

    CreateSession --> Process[Process request]
    Sanitize --> Process

    Process --> Response[Return response]

    style Request fill:#e1f5ff
    style Response fill:#c8e6c9
    style Reject fill:#ffcdd2
    style Reject401 fill:#ffcdd2
```

---

## Railway Deployment Configuration

### Environment Setup

**Environment Variables (Railway):**

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-...

# Database
DATABASE_URL=file:/app/data/treasury.db

# Authentication
JWT_SECRET=your-secure-random-secret-here
SESSION_SECRET=your-secure-session-secret-here

# Node Environment
NODE_ENV=production
```

### Railway Service Configuration

**Build Settings:**

```json
{
  "builder": "NIXPACKS",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start"
}
```

**Persistent Volume:**

- Mount Path: `/app/data`
- Purpose: SQLite database file storage
- Size: 10GB (sufficient for 150K apps/year with images)

**Health Check:**

- Endpoint: `/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds

### Deployment Process

1. **Push to GitHub:** Commit and push to `main` branch
2. **Auto-Deploy Trigger:** Railway detects push via webhook
3. **Build Phase:** `npm install && npm run build`
4. **Start Phase:** `npm start` (Next.js production server)
5. **Health Check:** Railway verifies `/api/health` endpoint
6. **Live:** Application available at `treasury-app.railway.app`

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with OPENAI_API_KEY

# Initialize database (run seed script)
npm run db:seed

# Start development server
npm run dev

# Open browser
http://localhost:3000
```

---

## Key Architecture Decisions

### 1. **Single Railway Service** (vs. Vercel + Railway split)

- **Rationale:** Simpler deployment, no CORS issues, single environment, faster development
- **Trade-off:** No edge CDN (acceptable - app is internal, not public-facing)
- **Why not Vercel:** Adds complexity, two billing accounts, network latency between services

### 2. **Monolithic Next.js App** (vs. separate frontend/backend)

- **Rationale:** Shared TypeScript types, simpler deployment, faster development
- **Trade-off:** Less flexibility for independent scaling (acceptable for prototype)

### 3. **SQLite with BLOBs** (vs. PostgreSQL + S3)

- **Rationale:** Simple deployment, single backup file, no external storage, perfect for 150K apps/year
- **Trade-off:** Limited concurrent writes (acceptable for mostly-read workload)

### 4. **Synchronous Batch Processing** (vs. async queue with Redis)

- **Rationale:** Simpler implementation, real-time progress updates, no additional infrastructure
- **Trade-off:** API server blocks during batch (acceptable for 100 concurrent users)

### 5. **10 Concurrent OpenAI Calls** (vs. 1 or unlimited)

- **Rationale:** Balances speed with rate limits and cost (100 apps in ~20 seconds)
- **Trade-off:** Not unlimited parallelism (acceptable - meets <3min target)

### 6. **React Context** (vs. Redux/Zustand)

- **Rationale:** Sufficient for auth + selection state, no complex global store needed
- **Trade-off:** Less structured state management (acceptable for prototype scope)

### 7. **Session Cookies** (vs. JWT)

- **Rationale:** Simpler server-side revocation, no token refresh logic, more secure
- **Trade-off:** Less suitable for multi-server deployments (not needed - single Railway service)

---

## Scalability Considerations

| Bottleneck               | Current Solution         | Production Migration Path          |
| ------------------------ | ------------------------ | ---------------------------------- |
| SQLite concurrent writes | Single Railway instance  | → PostgreSQL on Railway/RDS        |
| BLOB storage             | SQLite BLOB column       | → S3/Cloudflare R2 + DB references |
| Batch processing         | Synchronous 10x parallel | → Bull queue + Redis + workers     |
| Session storage          | SQLite sessions table    | → Redis session store              |
| API rate limits          | None (prototype)         | → Express rate-limit middleware    |

---

## Development Workflow

```mermaid
flowchart LR
    Dev[Local Development<br/>npm run dev] --> Commit[Git Commit]
    Commit --> Push[Push to GitHub main]

    Push --> RailwayDeploy[Railway Auto-Deploy<br/>Build + Start]

    RailwayDeploy --> AppLive[Full-Stack App Live<br/>treasury-app.railway.app<br/>Frontend + API + DB]

    AppLive --> Test[Manual Testing<br/>All Features]

    Test --> Fixed{Issues Found?}
    Fixed -->|Yes| Dev
    Fixed -->|No| Done[✅ Ready for Review]

    style Dev fill:#e1f5ff
    style Done fill:#c8e6c9
    style AppLive fill:#fff4e1
```
