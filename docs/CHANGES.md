# PRD & Architecture Updates - Version 2.0

**Date:** January 26, 2025  
**Status:** Final

---

## Summary of Changes

This document summarizes the key updates made to the PRD and Architecture documents based on stakeholder clarifications and technical decisions.

---

## Major Clarifications Added

### 1. **Image Handling Workflow** ✅ CLARIFIED
**Original:** Ambiguous whether images are uploaded or pre-loaded  
**Updated:** 
- Images are **always pre-loaded** into SQLite database as BLOBs
- No upload functionality in MVP
- Agents trigger verification on pre-existing database images
- Assumption: Manual data loading process outside application scope

### 2. **Batch Processing Concurrency** ✅ CLARIFIED
**Original:** "Batch processing up to 500 applications"  
**Updated:**
- **10 concurrent OpenAI API workers**
- Batch of 100 applications: ~20 seconds (well under 3-minute target)
- Batch of 500 applications: ~100 seconds (~1.7 minutes)
- Sequential chunks of 10 processed in parallel

### 3. **Health Warning Exact Text** ✅ ADDED
**Original:** No exact text provided  
**Added:**
```
GOVERNMENT WARNING: (1) According to the Surgeon General, women 
should not drink alcoholic beverages during pregnancy because of 
the risk of birth defects. (2) Consumption of alcoholic beverages 
impairs your ability to drive a car or operate machinery, and may 
cause health problems.
```

**Validation Rules:**
- Must be ALL CAPS for "GOVERNMENT WARNING:"
- Must be bold formatted
- Word-for-word accuracy required
- Any deviation = HARD MISMATCH (no soft matching)

### 4. **Normalization Algorithm** ✅ SPECIFIED
**Original:** Vague "intelligent matching"  
**Updated:** Explicit normalization steps:
1. Convert to lowercase
2. Collapse whitespace (multiple spaces → single space)
3. Trim leading/trailing whitespace
4. Remove punctuation (periods, commas, apostrophes, hyphens)
5. Apply abbreviation expansion (KY ↔ Kentucky, oz ↔ ounce, etc.)

### 5. **Beverage Type Source of Truth** ✅ CLARIFIED
**Original:** Unclear if AI detects beverage type  
**Updated:**
- Beverage type **pre-set in database** (source of truth)
- AI does NOT infer beverage type
- If label conflicts with database type → rejection recommended

### 6. **Multi-Panel Label Support** ✅ UPDATED
**Original:** Only "front" and "back" images  
**Updated:**
- Data model supports `front`, `back`, `side`, `neck` panel types
- MVP assumes 2 images per application (front + back)
- Extensible to additional panels in future

### 7. **Error Handling Specifications** ✅ ADDED
**New Section:** Comprehensive error handling UI:
- OpenAI API timeout → Retry button
- Rate limit → Queue notification
- Invalid/corrupted image → Suggest rejection
- Missing fields → Block verification
- AI returns invalid JSON → Log error, allow retry

### 8. **Audit Logging** ✅ ADDED
**New Entity:** `AuditLog` table tracks:
- User actions (login, logout, viewed, verified, approved, rejected)
- Timestamp and user ID
- Application ID (if applicable)
- JSON details field for action-specific metadata

### 9. **Confidence Score Thresholds** ✅ SPECIFIED
**Original:** Vague "confidence scores"  
**Updated:**
- **Threshold: 0.85**
- Confidence < 0.85 → Automatic SOFT MISMATCH (yellow flag)
- Per-field confidence scores stored in `extracted_data` JSON
- Low confidence requires human review even if normalized values match

### 10. **Keyboard Shortcuts** ✅ ADDED
**New Feature:** Power user accessibility
- A = Approve
- R = Reject  
- F = Flag for Review
- N = Next application
- ↑/↓ = Navigate list
- Space = Toggle checkbox
- Ctrl+A = Select all
- +/- = Zoom image
- ? = Show shortcuts legend
- Esc = Return to dashboard

### 11. **Admin vs. Agent Permissions** ✅ ADDED
**New Section:** Role-based permissions matrix
- Agents: View assigned apps, verify, approve/reject, batch process
- Admins: All agent permissions + create/edit apps, reassign, view all audit logs, manage users

---

## Architecture Changes

### Major Change: Single Railway Deployment ✅ SIMPLIFIED

**Original Architecture:**
```
Vercel (Frontend CDN) + Railway (Backend + DB)
- Two deployment platforms
- Separate environment configs
- Potential CORS issues
- Network latency between services
```

**Updated Architecture:**
```
Railway ONLY (Full-Stack Next.js + SQLite)
- Single service deployment
- Shared environment variables
- No cross-origin issues
- Simpler development workflow
- Lower cost (one platform)
```

**Rationale:**
- Faster development (tight 1-week timeline)
- Simpler ops (prototype-appropriate)
- No CDN needed (internal tool, not public-facing)
- Railway handles Next.js full-stack perfectly

### Technology Stack Updates

| Component | Original | Updated | Reason |
|-----------|----------|---------|--------|
| Frontend Deploy | Vercel | Railway | Simplified single-service |
| Backend Deploy | Railway | Railway | Consolidated |
| Database | SQLite on Railway | SQLite on Railway (persistent volume) | Confirmed - no PostgreSQL |
| API | Next.js API Routes | Next.js API Routes | Confirmed optimal |
| State | React Context | React Context | Confirmed sufficient |

---

## Performance Targets (Confirmed)

| Metric | Target | Strategy |
|--------|--------|----------|
| Single verification | < 5 seconds | Parallel front+back processing, pre-loaded images |
| Batch 100 apps | < 3 minutes | 10 concurrent workers (~20s actual) |
| Page load | < 2 seconds | Next.js SSR, optimized queries |
| API non-AI | < 200ms | SQLite indexing, connection pooling |

**Key to meeting 5-second target:**
- Images pre-loaded in DB (no upload latency)
- GPT-4o-mini is fast (~1-2s per image)
- Parallel processing (front + back simultaneous)
- Optimized prompts for structured output

---

## Scope Confirmations

### In Scope ✅
- Pre-loaded images (SQLite BLOBs)
- 10 concurrent batch workers
- Keyboard shortcuts + legend
- Audit logging
- Admin vs. agent roles
- Confidence score thresholds
- Exact health warning validation
- Error handling UI
- Railway-only deployment

### Out of Scope ❌
- Image upload functionality
- Integration with COLA system
- PostgreSQL migration
- PII/compliance features
- Production security hardening
- Rate limiting (prototype)
- FedRAMP certification
- Vercel deployment

---

## Database Schema Updates

### New Entities
1. **AuditLog** table (new)
   - Tracks all user actions
   - Links to User and Application
   - JSON details field

### Updated Entities
2. **LabelImage** table
   - Added `image_type` ENUM: 'front', 'back', 'side', 'neck'
   - Added `extracted_data` JSON with per-field confidence scores
   - Structure: `{ "field_name": { "value": "...", "confidence": 0.98 } }`

3. **Application** table
   - Clarified `beverage_type` is source of truth (pre-set)
   - Clarified `expected_label_data` JSON structure by beverage type

---

## API Updates

### New Response Fields
- **Per-field confidence scores** in verification results
- **Processing time** in milliseconds
- **Overall status** (needs_review, pending)
- **Reason codes** for match status (case_difference, normalized_match, etc.)

### Batch Processing
- **POST /api/batch/verify** accepts up to 500 application IDs
- **GET /api/batch/status/:batchId** returns progress (processed/total)
- Real-time status updates via polling

---

## UI/UX Updates

### New Features
1. **Keyboard shortcuts legend** button (bottom-right, hover to display)
2. **Image zoom controls** (+/- keys or mouse wheel)
3. **Error messages** for all failure scenarios
4. **Progress indicators** for batch processing
5. **Color-coded confidence warnings** (yellow for <0.85)

### Updated Workflows
- Click application row → Auto-trigger verification (no manual button)
- Batch select up to 500 → Process in parallel (10 workers)
- Low confidence → Yellow flag even if normalized match

---

## Deployment Configuration

### Railway Setup
```bash
# Build
npm install && npm run build

# Start
npm start

# Environment
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=file:/app/data/treasury.db
JWT_SECRET=...
SESSION_SECRET=...
NODE_ENV=production

# Persistent Volume
Mount: /app/data
Size: 10GB
```

### GitHub Auto-Deploy
- Push to `main` branch → Automatic Railway deployment
- Build time: ~2-3 minutes
- Health check: `/api/health` endpoint

---

## Testing & Acceptance Criteria Updates

### New Edge Cases
- Low confidence extraction (< 0.85) → Soft mismatch
- Corrupted image in DB → Suggest rejection
- Beverage type mismatch → Flag hard mismatch
- Concurrent batch processing → No data corruption

### Performance Tests
- 95% of single verifications < 5 seconds
- Batch of 100 < 180 seconds (target: ~20s actual)
- Dashboard load < 2 seconds
- Query response < 200ms

---

## Migration from v1.0 to v2.0

### Breaking Changes
- None (this is the initial implementation)

### New Requirements
- Railway account (not Vercel)
- Persistent volume setup for SQLite
- OpenAI API key
- Database seeding script for sample data

### Configuration Changes
- Single `.env` file (not separate frontend/backend)
- Single deployment pipeline
- Consolidated environment variables

---

## Next Steps

1. ✅ PRD finalized (v2.0)
2. ✅ Architecture finalized (Railway-only)
3. ⏳ Set up Railway project
4. ⏳ Initialize Next.js codebase
5. ⏳ Implement database schema + seed data
6. ⏳ Build API routes (auth, applications, batch)
7. ⏳ Build UI components (login, dashboard, review)
8. ⏳ Integrate OpenAI GPT-4o-mini
9. ⏳ Implement verification logic + normalization
10. ⏳ Add keyboard shortcuts + legend
11. ⏳ Test all acceptance criteria
12. ⏳ Deploy to Railway
13. ⏳ User acceptance testing

**Target:** End of next week

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Pre-loaded or upload images? | Pre-loaded in SQLite BLOBs |
| Batch concurrency? | 10 concurrent workers |
| Exact health warning text? | Added to PRD Section 4.3 |
| Normalization algorithm? | 5-step process specified |
| Beverage type source? | Database pre-set (source of truth) |
| Multi-panel labels? | Data model supports, MVP uses 2 |
| Admin permissions? | Full matrix added to PRD |
| Vercel or Railway? | Railway only (simplified) |
| PostgreSQL migration? | Out of scope for prototype |
| Confidence threshold? | 0.85 (below = soft mismatch) |

---

**Document Version:** 2.0  
**Last Updated:** January 26, 2025  
**Status:** Ready for Implementation
