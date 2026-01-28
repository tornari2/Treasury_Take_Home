# Project Brief

**Source of truth for project scope. Foundation document that shapes all other Memory Bank files.**

## Project Identity

- **Name:** Treasury Take Home - TTB Label Verification System
- **Repository:** https://github.com/tornari2/Treasury_Take_Home
- **Type:** AI-Powered Alcohol Label Verification System (TTB Compliance Prototype)
- **Client:** Alcohol and Tobacco Tax and Trade Bureau (TTB) - Compliance Division
- **Timeline:** End of next week
- **Documentation:** `docs/prd.md` (v2.0), `docs/architecture.md`, `docs/CHANGES.md`

## Core Requirements and Goals

### Primary Objective

Automate the alcohol beverage label compliance review process using AI to reduce manual verification time while maintaining accuracy.

### Key Deliverables

- ✅ Web application for TTB compliance agents
- ✅ AI-powered label data extraction (OpenAI GPT-4o-mini)
- ✅ Automated field comparison with intelligent matching
- ✅ Side-by-side verification results display
- ✅ Batch processing capability (up to 500 applications)
- ✅ Approval/rejection workflow with audit logging

### Success Criteria

- **Performance:** < 5 seconds per single label verification (CRITICAL - previous pilot failed at 30s)
- **Batch Performance:** < 3 minutes for 100 applications (10 concurrent workers)
- **Usability:** "My mother could figure it out" - intuitive for non-technical users
- **Accuracy:** Intelligent matching distinguishes trivial differences from material mismatches
- **Scale:** Support 100 concurrent users, 150K applications/year
- **Strict Validation:** Health warning must be exact (no soft matching)

## Scope Boundaries

### In Scope

- Standalone prototype web application
- User authentication (simple session-based)
- Application queue and filtering
- AI extraction from **pre-loaded images** (SQLite BLOBs)
- Three-tier matching: MATCH / SOFT MISMATCH / HARD MISMATCH
- Normalization algorithm (case, whitespace, punctuation, abbreviations)
- Confidence score thresholds (< 0.85 = soft mismatch)
- Batch processing with 10 concurrent workers
- Keyboard shortcuts for power users
- Audit logging (all user actions)
- Admin vs. agent role permissions
- Responsive UI (desktop-first, tablet-capable)
- Error handling for API failures, corrupted images, low confidence
- Railway deployment (single full-stack service)

### Out of Scope (Explicitly)

- Image upload functionality (images pre-loaded in database)
- Integration with existing COLA system
- FedRAMP certification or federal compliance requirements
- PII handling or data retention policies
- Production security hardening
- PostgreSQL migration (SQLite only)
- API rate limiting (prototype)
- Async queue systems (synchronous processing acceptable)

## Key Stakeholders / Users

### Primary Stakeholders

1. **Sarah Chen** - Deputy Director, Label Compliance
   - Requirements: <5s response, batch processing, simple UI
   - Pain Point: Failed pilot (30+ sec), staff overwhelmed with routine work
2. **Marcus Williams** - IT Systems Administrator
   - Requirements: Railway-compatible, standalone prototype
   - Pain Point: Legacy infrastructure constraints
3. **Dave Morrison** - Senior Agent (28 years)
   - Requirements: Intelligent matching, keyboard shortcuts, minimal workflow disruption
   - Pain Point: Skeptical of automation, needs nuanced judgment preserved
4. **Jenny Park** - Junior Agent (8 months)
   - Requirements: Strict warning validation, handle imperfect images
   - Pain Point: Manual checklist process, rejects for minor issues

### End Users

- **47 TTB compliance agents** reviewing ~150,000 label applications annually
- **Technical skill level:** Mixed (50% over age 50, varying computer literacy)
- **Primary workflow:** Field-by-field manual comparison → Approve/Reject
- **Pain point:** ~50% of workday spent on routine data matching

## Critical Constraints

### Technical

- **Performance Hard Limit:** Sub-5-second verification (non-negotiable)
- **Database:** SQLite only (no PostgreSQL for prototype)
- **Images:** Pre-loaded in database (no upload flow)
- **Deployment:** Railway single service (no Vercel split)
- **Concurrency:** 10 parallel OpenAI API calls maximum

### Business

- **Budget:** Railway free tier → ~$20/month (cost-sensitive)
- **Timeline:** Delivery by end of next week (aggressive)
- **User Base:** 100 concurrent users maximum
- **Scale:** 150K applications/year sustainable with SQLite

### Regulatory

- **Health Warning Validation:** Must be exact (ALL CAPS, bold, word-for-word)
- **Beverage-Specific Fields:** Spirits, Wine, Beer each have different required fields
- **Audit Trail:** All approvals/rejections must be logged with user + timestamp

---

_Last Updated: January 26, 2025 (PRD v2.0 finalized). All other memory-bank files derive from this brief._
