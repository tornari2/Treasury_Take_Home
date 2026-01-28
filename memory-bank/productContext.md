# Product Context

_Derives from [projectbrief.md](./projectbrief.md). Describes why this project exists and how it should work._

## Why This Project Exists

### The Problem

TTB reviews ~150,000 alcohol label applications annually with 47 agents. The current manual review process requires agents to compare label artwork against application data field-by-field—consuming roughly **50% of each agent's workday** on routine data matching tasks that are well-suited to automation.

### Previous Failed Solution

A prior pilot project failed because processing times exceeded 30 seconds per label—agents could verify manually faster than the automated system. **Performance is a make-or-break requirement.**

### Business Impact

By automating routine verification (e.g., "does brand name on label match database?"), agents can focus their expertise on nuanced compliance decisions requiring human judgment. This doesn't replace agents—it augments them.

## Problems It Solves

### 1. Manual Data Matching Bottleneck

- **Current:** Agents manually compare 10-15 fields per application
- **Solution:** AI extracts all fields in ~2 seconds, highlights only discrepancies
- **Impact:** Reduce verification time from 5 minutes → 30 seconds per application

### 2. Inconsistent Soft Mismatch Handling

- **Current:** Different agents treat formatting differences inconsistently
- **Solution:** Normalization algorithm handles case, punctuation, abbreviations uniformly
- **Impact:** Consistent treatment of "STONE'S THROW" vs "Stone's Throw"

### 3. Strict Health Warning Enforcement

- **Current:** Manual checking misses subtle violations (e.g., "Government Warning" vs "GOVERNMENT WARNING")
- **Solution:** Exact validation with no tolerance for deviations
- **Impact:** 100% compliance on critical regulatory requirement

### 4. Batch Processing Inefficiency

- **Current:** Agents process applications one-by-one
- **Solution:** Select 100+ applications → verify all in ~1 minute
- **Impact:** Process end-of-day backlog in minutes instead of hours

## How It Should Work

### Core User Flows

#### Flow 1: Single Application Review

1. **Agent logs in** → Dashboard with application queue
2. **Agent clicks application row** → Review screen opens, verification auto-triggers
3. **System fetches images from database** (pre-loaded)
4. **System sends to GPT-4o-mini** (front + back labels in parallel)
5. **System normalizes and compares** extracted vs. expected values
6. **Agent sees side-by-side results** with color coding (< 5 seconds total)
7. **Agent reviews** discrepancies and makes decision
8. **Agent presses 'A' (Approve) or 'R' (Reject)** → Status updates, audit logged

#### Flow 2: Batch Processing

1. **Agent filters queue** (e.g., "show pending spirits applications")
2. **Agent selects 100 applications** (checkboxes or Ctrl+A)
3. **Agent clicks "Verify Selected"** → Progress modal appears
4. **System processes 10 at a time** (concurrent workers)
5. **Agent sees real-time progress** (45/100 processed...)
6. **System completes in ~20 seconds** → Notification shown
7. **Agent reviews flagged items** (yellow/red indicators)

#### Flow 3: Power User Workflow (Keyboard-Driven)

1. **Agent navigates with ↑/↓** through application list
2. **Presses Enter** → Opens application (auto-verifies)
3. **Reviews results**, presses **'A' (Approve)** or **'R' (Reject)**
4. **Presses 'N'** → Next application (repeat)
5. **No mouse needed** → 10x faster for experienced users

### Beverage-Specific Validation

The system validates different fields based on beverage type (pre-set in database):

**Distilled Spirits (9 fields):** Brand, fanciful name (if present), class/type, ABV, net contents, producer name/address, health warning, country of origin (imports only), age statement (required)

**Wine (12 fields):** Brand, fanciful name (if present), class/type (required, cross-checks if app has varietal), ABV, net contents, producer name/address, health warning, country of origin (imports only), appellation (conditionally required), vintage date (if present), sulfite declaration (required), foreign wine percentage (if foreign wine referenced)

**Beer (8 fields):** Brand, fanciful name (if present), class/type, net contents, producer name/address, health warning, country of origin (imports only), alcohol content (surfaced if missing, doesn't fail)

### Verification Logic (Three-Tier System)

| Status            | Color     | Definition                                                          | Example                            |
| ----------------- | --------- | ------------------------------------------------------------------- | ---------------------------------- |
| **MATCH**         | Green ✅  | Exact match or normalized match (confidence > 0.85)                 | "45%" matches "45% ABV"            |
| **SOFT MISMATCH** | Yellow ⚠️ | Semantically equivalent but formatting differs OR confidence < 0.85 | "STONE'S THROW" vs "Stone's Throw" |
| **HARD MISMATCH** | Red ❌    | Materially different values OR required field missing               | "Old Tom" vs "Mountain Creek"      |

**Special Case: Health Warning** = Always exact validation (no soft matching). "Government Warning" ≠ "GOVERNMENT WARNING" = HARD MISMATCH.

### Automatic Status Updates

- All fields MATCH → Stays PENDING (agent must still approve)
- Any SOFT MISMATCH → Auto-updates to NEEDS REVIEW (agent reviews then decides)
- Any HARD MISMATCH → Stays PENDING (agent reviews, likely rejects)
- System **never auto-approves or auto-rejects** (human always confirms)

## User Experience Goals

### 1. Extreme Simplicity ("My Mother Could Figure It Out")

- **No training required:** Obvious buttons, color-coded results, minimal clicks
- **3-step workflow:** Select → Review → Decide
- **No hidden features:** Everything visible, nothing in menus
- **Clear error messages:** Plain English, actionable next steps

### 2. Sub-5-Second Performance (Non-Negotiable)

- **Visual feedback:** Spinner with "Verifying..." immediately on selection
- **Progress indication:** "Processing front label... Processing back label..."
- **Timer display:** Show actual processing time (builds trust)
- **Acceptable range:** 2-4 seconds typical, 5 seconds maximum

### 3. Keyboard-First for Power Users

- **Every action has a shortcut:** A/R/F for approve/reject/flag, ↑/↓ for navigation
- **Legend always available:** ? key or hover button shows all shortcuts
- **No mouse required:** Experienced users can process 100 apps without touching mouse
- **But mouse still works:** Junior users can click everything

### 4. Intelligent Error Handling

- **Corrupted image?** → "Label image corrupted. Suggest rejection." (don't crash)
- **API timeout?** → "Verification delayed. Retry?" (don't fail silently)
- **Low confidence?** → "AI uncertain about these fields" (flag yellow, not red)
- **Never lose context:** If error occurs, agent can retry without starting over

### 5. Visual Hierarchy and Color Coding

- **Green dominates when all good:** All matches → mostly green screen (reassuring)
- **Yellow draws attention:** Soft mismatches → yellow highlights (review needed)
- **Red demands action:** Hard mismatches → red warnings (likely rejection)
- **Gray for metadata:** Processing time, confidence scores (de-emphasized)

## Out of Scope (Product)

### Features Explicitly Excluded

- ❌ Image upload (images pre-loaded in database)
- ❌ Application creation/editing (agents only review)
- ❌ Label artwork editing or annotation
- ❌ Multi-user collaboration (no "claim" or "lock" features)
- ❌ Email notifications or reminders
- ❌ Reporting or analytics dashboards
- ❌ Mobile app (desktop/tablet browser only)
- ❌ Offline mode
- ❌ Export to PDF or print functionality (MVP)
- ❌ Integration with other TTB systems (COLA, etc.)

### Acceptance Criteria

**Core Functionality:**

- ✅ Agent logs in and sees dashboard
- ✅ Single verification completes in < 5 seconds (95% of cases)
- ✅ Batch of 100 completes in < 3 minutes
- ✅ Color-coded results (green/yellow/red) clearly visible
- ✅ Health warning validation is exact (all caps, bold, wording)
- ✅ Keyboard shortcuts work (A/R/F/N/↑/↓)
- ✅ Audit log captures all approvals/rejections
- ✅ Soft mismatches auto-update status to NEEDS REVIEW

**Edge Cases:**

- ✅ Handles corrupted images (error message, suggest rejection)
- ✅ Handles low confidence (< 0.85 → yellow flag)
- ✅ Handles API timeout (retry button)
- ✅ Handles missing fields (mark red, suggest rejection)

---

_Last Updated: January 28, 2025 (Updated validation field counts and rules to reflect OriginType enum and cross-check requirements). Update when user needs, acceptance criteria, or product scope change._
