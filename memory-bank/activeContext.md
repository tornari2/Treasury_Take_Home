# Active Context

_Synthesizes [productContext.md](./productContext.md), [systemPatterns.md](./systemPatterns.md), and [techContext.md](./techContext.md). Current work focus and next steps._

## Current Work Focus

**Phase:** Implementation Complete → Testing & Deployment Ready  
**Primary Goal:** TTB Label Verification System prototype - **COMPLETE** ✅  
**Current Sprint:** Performance optimization and testing

## Recent Changes (January 30, 2025 - Latest)

### Navigation UX Improvements ✅ (Latest - January 30, 2025)

- **Eliminated Loading Screen Flicker:**
  - Removed all "Loading application..." messages during transitions between review pages
  - Removed "Loading applications..." message when navigating between dashboard and review pages
  - Previous content now stays visible during navigation for smooth transitions
  - Loading screens only appear on true initial page loads (first visit ever)
- **Review Page Navigation:**
  - Use in-memory refs (`previousApplicationRef`) to preserve previous application data during navigation
  - Previous application stays visible while new one loads in background
  - No loading overlays or messages during transitions
  - Smooth, flicker-free experience when navigating between applications
- **Dashboard Navigation:**
  - Use module-level cache (`cachedApplications`, `hasLoadedBefore`) to persist across component remounts
  - Previous applications list stays visible when navigating back from review page
  - Data refreshes in background without showing loading screen
  - Eliminates flicker when moving between queue and review pages

### Performance Optimizations ✅ (January 30, 2025)

- **GPT-4o API Call Optimizations:**
  - Set `temperature: 0` for deterministic, faster responses (also improves accuracy)
  - Reduced `max_tokens` from 2000 to 1500 (conservative reduction, still safe buffer)
  - Reorganized prompt structure: static content (lines 231-257) moved before dynamic content
  - Changed model to `gpt-4o` as requested (was temporarily `gpt-4o-mini`)
  - Prompt caching automatically enabled (works for prompts >1024 tokens)
- **Code-Level Optimizations:**
  - Cache JSON stringification in verify route (`extractedDataJson`, `verificationResultJson`)
  - Avoids repeated `JSON.stringify()` calls for same data
- **Performance Analysis:**
  - Current verification time: ~10 seconds average
  - Main bottleneck: OpenAI API processing time (~9-10s), not code execution
  - Prompt caching provides ~50% cost savings on cached portions (~500-700 tokens)
  - Expected improvement: 15-25% reduction (7-8 seconds realistic target)
  - To reach <5s target would require: model downgrade (gpt-4o-mini), infrastructure changes, or Azure OpenAI regional endpoints
- **Testing Infrastructure:**
  - Added `scripts/test-verification-speed-api.ts` - tests via API endpoint
  - Added `scripts/test-verification-speed.ts` - tests direct function calls
  - Scripts measure average, min, max processing times across 3 test runs
- **Key Findings:**
  - Prompt caching already working automatically (no code changes needed)
  - Regional endpoints not available for standard OpenAI API
  - Parallel processing already optimal (all images in single API call)
  - Beverage-specific prompts should remain separate (too many critical differences to merge)

## Recent Changes (January 29, 2025 - Latest)

### Critical Verification Fixes and Dashboard Enhancements ✅ (Latest - January 29, 2025)

- **Review Notes Column in Dashboard:**
  - Added "Review Notes" column to application queue table (positioned after Status, before Created)
  - Shows message box icon (MessageSquare from lucide-react) for approved/rejected applications with review notes
  - Hover tooltip displays full review notes content with proper styling
  - Icon only appears when review notes exist and status is approved or rejected
  - Empty state shows "—" when no review notes exist

- **Critical Verification Fixes:**
  - **Prefilled AI Recommendations Issue:** Fixed persistent display of old verification results when re-verifying
    - Added `clearVerificationResults()` method to `lib/db-helpers.ts` to clear verification results before processing
    - Verification API route now clears old results BEFORE starting new verification (prevents stale data display)
    - Frontend clears verification results to `null` (not empty object) when starting verification
    - Updated verification result checks to properly handle `null` values
    - Removed premature `useEffect` that was blocking verification trigger
  - **Verification Hanging Issue:** Fixed indefinite hanging during verification
    - Added client-side timeout: 3-minute abort controller with user-friendly timeout message
    - Added server-side timeout: Hard 3-minute cap using Promise.race to prevent API route hanging
    - Increased OpenAI service timeout from 30s to 60s per image, max from 2min to 5min
    - Verification now always resolves (success or timeout) preventing UI from staying stuck
    - Proper error handling for timeout scenarios with clear user feedback

### Review Notes Persistence and Verification Clearing ✅ (January 29, 2025)

- **Review Notes Persistence:**
  - Review notes now persist when switching from review page back to dashboard
  - Review notes persist when changing status (approve after reject, or reject after approve)
  - Review notes are loaded from database when returning to a previously reviewed application
  - Added `useEffect` hook to load `review_notes` from application data when page loads
  - Notes are only cleared when reverifying (clicking Verify button)

- **Confirmation Dialog Removal:**
  - Removed confirmation dialog popup that appeared when approving/rejecting applications with AI verification mismatches
  - Removed Dialog component imports and related state variables (`showConfirmDialog`, `pendingStatus`)
  - Removed `confirmStatusUpdate` function
  - Approve/Reject actions now execute immediately without confirmation prompts
  - Users can still add review notes to document their decision rationale

- **Verification Clearing Fix:**
  - Review notes are now properly cleared when reverifying (set to empty string in UI immediately and null in database)
  - Verification results are completely wiped when reverifying (both in UI state and database)
  - Verification results UI is hidden during verification process (shows "Verification in progress..." message instead of old results)
  - Extracted data (`extracted_data`) is also cleared when reverifying to ensure fresh start
  - Verify route always clears review notes regardless of current status (not just when status isn't pending)

### Verification Flow Fixes and UI Enhancements ✅ (January 29, 2025)

- **Verification Flow Improvements:**
  - Fixed infinite loop bug: Added `isVerifyingRef` guard to prevent re-triggering when clearing results
  - Clear old verification results immediately when re-verifying (prevents showing stale data)
  - Fixed race conditions in application navigation with `currentFetchIdRef` tracking
  - Single application verify now uses synchronous API and navigates immediately
  - Proper verification state management prevents multiple simultaneous calls

- **Navigation & Loading Enhancements:**
  - Fixed "Application not Found" errors during transitions with race condition protection
  - Added loading overlay during transitions (keeps previous content visible, no blank screen)
  - Improved error handling with distinct states (not_found vs network error)
  - Skip unnecessary fetches when application already loaded for current ID
  - Better loading messages: "Loading application and starting verification..." when verify=true

- **UI/UX Improvements:**
  - Zoom increments increased from 10% to 25% per click (faster zooming)
  - Reset button always visible (disabled when zoom=100% and pan=0,0)
  - Replaced pagination with scrollable table (max-height 600px, shows ~10 rows at a time)
  - Enhanced verifying alert with spinner animation and clearer messaging
  - Scrollable application list provides smoother navigation experience

- **Validation Display Updates:**
  - Country of Origin: Changed display text from "Required (not cross-checked)" to "Required for imported beverages"

- **Dashboard Enhancements:**
  - Single application verify navigates immediately with loading feedback
  - Batch verify uses asynchronous API for multiple applications
  - Improved user feedback during verification process

### Validation Display Improvements and UX Enhancements ✅ (January 29, 2025)

- **Validation Error Display Fix:**
  - NOT_FOUND fields now show only "Field not found" without Expected/Extracted format
  - Expected/Extracted format only shown for cross-checked fields (match, soft_mismatch, hard_mismatch)
  - Updated review page display logic to wrap Expected/Extracted section with `result.type !== 'not_found'` check
  - Changed "Field not found on label" to just "Field not found" for cleaner display

- **Alcohol Content Validator Fix:**
  - Changed from HARD_MISMATCH to NOT_FOUND when alcohol content is missing
  - Alcohol content is a presence field (always required), so missing should be NOT_FOUND, not HARD_MISMATCH
  - Updated for all beverage types (beer, wine, spirits)
  - Now correctly shows "Field not found" instead of "Expected: Field not found / Extracted: null"

- **Net Contents Validator Enhancement:**
  - Fixed pattern matching to recognize US customary units when they appear after metric units
  - Created `containsNetContentsPattern()` helper function that removes regex anchors (^ and $)
  - Now correctly validates labels like "710 ML / 1 PINT 8 FL OZ" for beer (has both required US customary and optional metric)
  - Patterns now match anywhere in the string, not just at start/end

- **Producer/Importer Label Updates:**
  - Application form now shows "Importer Name" instead of "Producer Name" when `originType === IMPORTED`
  - Section header changes from "Producer Information" to "Importer Information" for imported beverages
  - Review page shows "Importer Name & Address" instead of "Producer Name & Address" for imported beverages
  - Updated `getFieldLabel()` function to accept `originType` parameter and conditionally return importer labels
  - Updated error messages to use "Importer" terminology when applicable
  - Works for both `expected_label_data` and `application_data` formats

- **UX Improvement - Removed Loading Screen:**
  - Removed "Loading application..." screen when switching between individual applications
  - Page now shows current application content until new one loads (no flicker)
  - Only shows "Application not found" error after failed fetch attempt
  - Removed `loading` state variable entirely
  - Much smoother navigation experience

### Critical Verification Fix and Batch Testing Infrastructure ✅ (January 29, 2025)

- **Verification Function Export Fix:**
  - Fixed `normalizeBusinessEntitySuffix` function in `lib/validation/utils.ts` - was defined but not exported
  - Function was being imported in `lib/validation/validators/common.ts` causing runtime error: "normalizeBusinessEntitySuffix is not a function"
  - Verification was silently catching this error and returning empty `{}` results
  - Fixed by adding `export` keyword to the function definition

- **Error Handling Improvements:**
  - Updated `verifyApplication()` in `lib/verification.ts` to re-throw errors instead of silently returning `{}`
  - Errors are now properly propagated to the API layer for better debugging

- **Empty Verification Result Detection:**
  - Updated review page (`app/review/[id]/page.tsx`) to properly detect empty verification results
  - Changed check from `img.verification_result` (truthy) to `Object.keys(img.verification_result).length > 0`
  - Auto-verification now correctly retries when results are empty

- **Manual Verify Button:**
  - Added "Verify Application" button to review page when no verification results exist
  - Allows users to manually trigger verification retry

- **Batch Testing Infrastructure:**
  - Created `scripts/create-batch-applications.ts` - Script to create 50 copies of test applications
  - Created `scripts/verify-batch.ts` - Script to verify batch applications were created correctly
  - Added GALLO beer test images to `test_labels/beer_imported/`
  - Supports batch verification testing with realistic data

### Fanciful Name Extraction, Batch Verification, and UI Improvements ✅ (January 29, 2025)

- **Fanciful Name Extraction Fix:**
  - Added `fanciful_name` field to extraction for spirits and malt beverages (beer)
  - Previously missing from field definitions in `lib/openai-service.ts`, causing extraction to fail
  - Added explicit guidance in spirits-specific instructions with examples: "REPOSADO", "SINGLE BARREL SELECT", "AÑEJO", "BLANCO"
  - Extraction now correctly captures fanciful names like "REPOSADO" and "SINGLE BARREL SELECT" for spirits
  - Wine does not support fanciful names (removed from wine validation previously)

- **Health Warning Display Enhancement:**
  - Added bold formatting for "GOVERNMENT WARNING" text in review page
  - Expected text always shows "GOVERNMENT WARNING" in bold (required formatting)
  - Extracted text shows "GOVERNMENT WARNING" in bold when present on label
  - Uses helper function `formatHealthWarning()` to detect and format the text
  - Preserves exact case from label while applying bold styling

- **Batch Verification Fix:**
  - Fixed batch verification to actually process applications (was not completing)
  - Refactored `processBatch()` to return batchId immediately and process in background
  - Split processing into `processBatchApplications()` function that runs asynchronously
  - Frontend now polls batch status endpoint every 2 seconds and waits for completion
  - Applications are verified before redirecting to review page
  - Batch processing runs 10 concurrent applications at a time

- **Batch Action Button Labels:**
  - Updated dashboard buttons to show "Review Batch (X)", "Verify Batch (X)", "Delete Batch (X)" when multiple applications selected
  - Shows count in parentheses when 2+ applications are selected
  - Single selection shows standard labels without "Batch"

- **Code Quality:**
  - Fixed duplicate import of `producerNamesMatchIgnoringEntitySuffix` in `lib/validation/validators/common.ts`

### Image Type, Validation, and UI Improvements ✅ (January 29, 2025)

- **Image Type Enhancement:**
  - Added "other" as a valid image type option for label images (in addition to front, back, side, neck)
  - Updated database migration to support 'other' image type in CHECK constraint
  - Updated API validation to accept 'other' as valid image type
  - Updated application form to include "Other" option in image type selector dropdown

- **Alcohol Content Validation:**
  - Added pattern to accept "XX% Alc. by Vol." format (e.g., "40% Alc. by Vol.")
  - Previously only accepted formats like "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", "XX% Alcohol by Volume"
  - Now correctly validates formats where percentage comes before "Alc." followed by "by Vol."

- **Producer Name Matching:**
  - Improved matching to handle entity suffix differences (e.g., "PARK STREET IMPORTS LLC" matches "PARK STREET IMPORTS")
  - Updated `hasName` check to consider names without entity suffixes when comparing
  - Uses `normalizeBusinessEntitySuffix` and `producerNamesMatchIgnoringEntitySuffix` functions
  - Allows matching when core business name matches even if entity suffix differs or is missing

- **Review Page Display:**
  - Fixed display to show "Extracted:" field even when extracted value is empty/null, as long as expected value exists
  - Previously only showed "Extracted:" when extracted value had content
  - Now shows "Extracted: " (blank) when field was checked but nothing extracted

- **Application Form:**
  - Removed "Other Information" field from the form UI
  - Field remains in ApplicationData type for backward compatibility but is always set to null
  - Users can no longer enter additional notes/information when creating applications

### Age Statement, N/A Display, Fanciful Name & Alcohol Content ✅ (January 29, 2025)

- **Age Statement Validation (Spirits):**
  - Age statement is **conditionally required** based on Class/Type (not always required).
  - Mandatory for: whisky aged &lt; 4 years; grape lees/pomace/marc brandy aged &lt; 2 years; distillation date or miscellaneous age references (latter two would need separate extraction).
  - When not required: `expected` is "N/A - Not required for Class or Type"; `extracted` is null; status NOT_APPLICABLE.
  - When present: must match approved formats (e.g. "X years old", "Aged X years", "Aged at least X years", blended whisky format).
  - `validateAgeStatement(extracted, classType)` in `lib/validation/validators/spirits.ts`; `validateSpiritsLabel` passes `extraction.classType`.

- **N/A Display (Review Page):**
  - Values starting with "N/A" (e.g. "N/A - Not applicable", "N/A - Domestic", "N/A - Not required for Class or Type") are shown **without** the "Expected:" label and in **gray** (`text-muted-foreground`).
  - Applies to NOT_APPLICABLE results and any expected value that starts with "N/A".

- **Fanciful Name:**
  - When label has fanciful name but application does not: `expected` is "None" (not null) so review page shows "Expected: None" instead of omitting.

- **Alcohol Content:**
  - Alcohol content is required on all labels. When `expected` is missing for alcohol content, review page shows "Expected: Required" instead of "Expected: None".
  - Special handling in review page for `alcoholContent` / `alcohol_content` when `result.expected` is falsy.

### UI/UX & Validation Improvements ✅ (January 29, 2025)

- **Soft Mismatch Visual Feedback:**
  - Fields with soft mismatch status now display a yellow border matching the warning icon color
  - Border uses `border-yellow-600` class to match the `text-yellow-600` warning icon
  - Improves visual consistency and makes soft mismatches more noticeable

- **Minor Misspelling Detection:**
  - Added Levenshtein distance algorithm to detect strings that differ by 1-2 characters
  - Minor misspellings (e.g., "TOBIAS FROG" vs "Tobias Frogg") are now treated as SOFT_MISMATCH instead of HARD_MISMATCH
  - Applied to all cross-checked fields: brand name, fanciful name, appellation, varietal, vintage date, producer name
  - Handles common OCR errors and typos appropriately
  - Health Warning Statement excluded (must remain exact match)

- **Class/Type Requirement Messages:**
  - Beer/Spirits Class/Type fields now show requirement messages when expected is null
  - Spirits: "A Class or Type designation describing the kind of distilled spirits"
  - Beer: "A Class or Type designation describing the kind of malt beverage"
  - Replaces "Expected: None" with appropriate requirement statement

- **Alcohol Content Validation Enhancement:**
  - Updated spirits validation to allow proof statements alongside Alc/Vol format
  - Proof statements (e.g., "80 PROOF") are allowed when combined with valid Alc/Vol statement
  - Added `containsValidAlcoholFormat()` function that checks for valid format within text (allows additional text)
  - Example: "40% Alc./Vol. 80 PROOF" now validates correctly

- **Application Navigation Fix:**
  - Fixed "Application Not Found" flicker when transitioning between application pages
  - Added `hasAttemptedFetch` state to track fetch attempts
  - Only shows "not found" message after fetch completes, not during initial render
  - Improved loading state management prevents UI flicker during transitions

- **Dashboard Product Type Column:**
  - Updated Product Type column to match application form labels
  - "beer" → "Malt Beverage" (instead of "Beer")
  - "wine" → "Wine" (unchanged)
  - "spirits" → "Distilled Spirits" (instead of "Spirits")

### Previous UI/UX & Validation Improvements ✅ (January 29, 2025)

- **Deletion Flow Improvements:**
  - Removed confirmation dialogs for single and batch application deletion
  - Removed success/failure alert messages after deletion
  - Deletions now happen immediately without user prompts

- **Field Display Logic Enhancements:**
  - Hide "Extracted" field when field is not found (shows null instead of "Field not found")
  - Applies to all cross-checked fields when extracted value is null/empty or "Field not found"
  - Updated text colors: Expected text is black, Extracted text is grey
  - Field title text remains black even when fields don't match (no red text for mismatches)

- **Wine Class/Type Display:**
  - When expected is null (no varietal), shows requirement message: "A Class/Type designation is required whenever a Varietal is not listed on the application."
  - Replaces "Expected: None" with the requirement statement

- **Sulfite Declaration Display:**
  - When expected is null, shows requirement message: "Must appear if the product has 10 ppm or more (total) sulfur dioxide."
  - Replaces "Expected: None" with the requirement statement

- **Sulfite Declaration Validation:**
  - Added validation rule: "No sulfites added" must appear together with "contains naturally occurring sulfites" or "may contain naturally occurring sulfites"
  - Returns HARD_MISMATCH if "No sulfites added" appears without required phrase
  - Updated extraction prompts to extract complete text when both phrases appear

- **Appellation Validation Enhancement:**
  - Updated extraction prompts to recognize state names (e.g., "Virginia", "California") as valid appellations when listed prominently and separately
  - Enhanced validation to match appellations with additional text (e.g., "Virginia, USA" matches "VIRGINIA")
  - Uses word-boundary matching for single-word appellations and checks all words for multi-word appellations

- **Net Contents Extraction:**
  - Updated extraction prompts to exclude prefix words like "CONTENTS", "NET CONTENTS", or "NET"
  - Extract only measurement value and unit (e.g., "750 mL" from "CONTENTS 750ML")
  - Applied to all beverage types (beer, wine, spirits)

- **Producer Name & Address Validation:**
  - Enhanced to handle ZIP codes in extracted addresses (e.g., "LEESBURG, VA 20176" matches "LEESBURG, VA")
  - Checks combined name+address string for all required parts (name, city, state)
  - Handles cases where extraction puts everything in one field
  - Removes ZIP codes before state matching

### Validation & Extraction Accuracy Improvements ✅ (Previous - January 29, 2025)

- **Confidence Score Removal:**
  - Removed confidence score calculations from extraction service (`lib/openai-service.ts`)
  - Removed confidence score display from review page UI (`app/review/[id]/page.tsx`)
  - Updated database operations to pass `null` for confidence_score (kept column for backward compatibility)
  - Updated tests to use 0 for confidence values (type still requires it but values aren't used)

- **Review Page UI Cleanup:**
  - Removed "Your Decision" informational alert window from review page
  - Simplified review interface while keeping review notes and approve/reject buttons

- **Wine Varietal Extraction Enhancement:**
  - Strengthened wine varietal priority rule in extraction prompts
  - Added explicit instructions: if both varietal (e.g., "Khikhvi") and class/type (e.g., "White Dry Wine") appear, extract the VARIETAL
  - Updated generic extraction prompt to include wine-specific varietal priority instructions
  - Refactored prompts to use beverage-specific instruction functions (`getBeverageSpecificInstructions`, `getClassTypeFieldDescription`)

- **Importer Extraction Improvement:**
  - Enhanced instructions to handle variations: "Imported By", "Imported by", "DISTRIBUTED AND IMPORTED BY", "Distributed and Imported By", etc.
  - Added explicit rule: extract US importer/distributor name/address, NOT foreign producer
  - Added example showing correct extraction (Geo US Trading vs LTD WINIVERIA)
  - Updated field definitions to include phrase variations

- **Alcohol Content Extraction Enhancement:**
  - Added critical instructions to extract COMPLETE text including prefixes (ALC., ALCOHOL, ABV)
  - Updated field definition to emphasize prefix requirement
  - Added examples showing correct vs incorrect extraction
  - Updated validation to show expected format even when validation passes (for required field clarity)

- **Producer Name/Address Matching Improvements:**
  - Updated `stringsMatch` to normalize punctuation differences (handles "Geo US Trading, Inc" vs "Geo US Trading Inc")
  - Updated `producerNamesMatchIgnoringEntitySuffix` to normalize punctuation before removing entity suffixes
  - Updated `normalizeState` to extract state part when zip code follows (handles "IL 60148-1215" → "IL")
  - Now correctly matches producer names with punctuation differences and addresses with zip codes

- **Brand Name Validation Enhancement:**
  - Added `normalizeBrandNameArticles` function to remove leading articles (THE, A, AN)
  - Updated brand name validation to treat articles as optional
  - "INFAMOUS GOOSE" now matches "THE INFAMOUS GOOSE"
  - Handles all article variations: THE, A, AN (case-insensitive)

- **Dashboard Table Enhancements:**
  - Added "Product Type" column after "Brand Name" (shows capitalized beverage type: Beer, Wine, Spirits)
  - Added "Product Source" column after "Product Type" (shows Domestic or Imported from originType)
  - Updated table colspan for "No applications found" message

- **Prompt Architecture Refactoring:**
  - Moved beverage-specific instructions to dedicated functions in `lib/validation/prompts.ts`
  - Created `getBeverageSpecificInstructions()` for wine, beer, spirits-specific rules
  - Created `getClassTypeFieldDescription()` for beverage-specific class_type descriptions
  - Generic prompt now uses these functions instead of inline conditional logic
  - Better separation of concerns and maintainability

### UI/UX Improvements & Validation Refinements ✅ (January 29, 2025)

- **Application Form Enhancements:**
  - Removed vintage field from wine applications (no longer in use)
  - Auto-assign image types based on upload order: 1st image = "front", 2nd = "back", 3rd = "side", 4th = "neck" (cycles)
  - Hide fanciful name field when beverage type is wine (removed from wine validation)
  - Updated beverage type labels: "Beer" → "Malt Beverage", "Spirits" → "Distilled Spirits"
  - Clear fanciful name when switching to wine beverage type

- **Review Page Improvements:**
  - Display "Expected: None" when field is extracted but not expected (instead of omitting Expected line)
  - Fixed field label capitalization: "apellation of origin" → "Appellation of Origin"
  - Renamed field labels: "Class Type" → "Class/Type", "Producer Name Address" → "Producer Name & Address"
  - For wines: renamed "Class/Type (or Varietal)" → "Varietal (or Class/Type)" to reflect varietal priority

- **Validation Enhancements:**
  - Removed fanciful name from wine validation (`lib/validation/validation.ts`) and extraction prompts
  - Removed fanciful name from `WineExtractionResult` type
  - Removed "needs_review" status: soft mismatches now stay as "pending" (removed from status determination, dashboard display, and API routes)
  - Country of origin: show "Required (not cross-checked)" for imported beverages instead of null
  - Updated country of origin validation to show clearer expected values for imported products
  - Producer validation: enforce "Imported By" phrase detection for imported beverages (hard mismatch if missing)
  - Wine varietal priority: validation expects varietal when application has varietal, extraction prioritizes varietal over class/type

- **Extraction Prompt Improvements:**
  - Strengthened alcohol content extraction: added explicit warnings to preserve "ALC." prefix
  - Added varietal priority rule for wines: if both varietal and class/type appear, extract varietal
  - Enhanced instructions for imported beverages: extract importer name/address (following "Imported By"), not producer
  - Added examples: "Khikhvi", "Rkatsiteli", "Saperavi" to varietal examples
  - Improved clarity across all beverage type prompts

### Field Removal and Extraction Improvements ✅ (January 29, 2025)

- **Vintage Date Field Removed:**
  - Removed vintage date extraction from wine labels (no longer appearing in recent applications)
  - Updated wine extraction prompt (`lib/validation/prompts.ts`) to remove all vintage-related instructions
  - Removed vintage validation from wine label validation flow (`lib/validation/validation.ts`)
  - Updated appellation validator to remove vintage date requirement check (`lib/validation/validators/wine.ts`)
  - Updated verification converter to set `vintageDate: null` for wine (`lib/verification.ts`)
  - Removed vintage from required fields display (`lib/validation/display.ts`)

- **Loading Screen Flicker Fix:**
  - Removed "Loading Application" flicker screen when switching between review screens in batch mode
  - Updated review page (`app/review/[id]/page.tsx`) to initialize `loading` state to `false`
  - Loading screen now only shows when not in batch mode and no application data is present
  - Prevents unnecessary loading states during batch navigation

- **Alcohol Content Extraction Enhancement:**
  - Enhanced all extraction prompts (Beer, Spirits, Wine) to extract complete alcohol content text including prefix words
  - Added explicit instructions to extract "ALCOHOL", "ALC.", or "ABV" prefixes when present on labels
  - Updated JSON field descriptions for `alcoholContent` in all three prompts with examples
  - Example: If label says "ALCOHOL 14% BY VOLUME", extract as "ALCOHOL 14% BY VOLUME" (not just "14% BY VOLUME")
  - Addresses issue where prefix words were being omitted from extracted values

- **Health Warning Normalization Fix:**
  - Updated health warning normalization to handle optional Oxford comma variation
  - "machinery, and" and "machinery and" now both match expected text
  - Updated `normalizeHealthWarningForComparison()` in `lib/validation/utils.ts`

### UX and Extraction Accuracy Improvements ✅ (January 29, 2025)

- **Dashboard Row Selection:**
  - Application rows are now clickable - clicking anywhere on a row selects/deselects the checkbox
  - Added cursor pointer styling to indicate rows are interactive
  - Improved user experience for batch selection operations

- **Review Page Image Display:**
  - All label images now displayed vertically stacked on review page
  - Removed image type selector buttons (no longer needed)
  - Each image has independent zoom and pan controls
  - Removed mouse wheel zoom functionality (users can still use +/- buttons)
  - Images displayed simultaneously for easier comparison

- **Capitalization Preservation:**
  - Updated all extraction prompts (Beer, Spirits, Wine) to preserve exact capitalization for ALL fields
  - If ANY field appears in ALL CAPS on the label, it will be extracted as ALL CAPS
  - Applies to: brand name, fanciful name, class type, producer name, producer address, appellation, country of origin, and all other fields
  - Validation still uses case-insensitive matching, so "FAR MOUNTAIN" matches "Far Mountain"
  - Updated both detailed prompts (`lib/validation/prompts.ts`) and OpenAI service prompt (`lib/openai-service.ts`)

- **Net Contents Validation Enhancement:**
  - Added support for "milliliters" and "millilitres" (British spelling) as valid metric units
  - Updated `NET_CONTENTS_PATTERNS.metric` to recognize full word forms
  - Updated `parseNetContentsToML()` to parse "milliliters" correctly
  - Now accepts: "750 mL", "750 ml", "750 milliliters", "750 millilitres" as equivalent

### Multi-Image Processing Enhancement ✅

- **Unified Image Extraction:**
  - Modified `extractLabelData` to accept array of images instead of single image
  - All label images (front, back, neck, side) now processed together in single OpenAI API call
  - AI looks across ALL images to extract all fields - information may be spread across different label panels
  - Updated verify route to pass all images at once instead of processing individually
  - Updated batch processor to use new multi-image extraction
  - Timeout scales with number of images (30s per image, max 2 minutes)
  - Same extracted data stored for all images since extraction is done together

- **Status UI Simplification:**
  - Removed "needs_review" option from status dropdown in dashboard
  - Removed "Flag for Review" button from review page
  - Users now only have "Pending", "Approved", and "Rejected" status options
  - Existing applications with "needs_review" status still display correctly ("Flagged for Review")

### Error Handling & Resilience ✅

- **Comprehensive OpenAI API Error Handling:**
  - Custom error types: `OpenAIAPIKeyError`, `OpenAITimeoutError`, `OpenAINetworkError`, `OpenAIAPIError`
  - API key validation before processing (checks presence and format)
  - 30-second timeout per image with explicit timeout handling
  - Retry logic with exponential backoff (max 2 retries for transient failures)
  - User-friendly error messages distinguishing error types
  - Graceful degradation: single image errors don't block batch processing

- **Frontend Error Display:**
  - Specific error messages instead of generic alerts
  - Network error detection and appropriate messaging
  - Error details from API responses displayed to users
  - Better error handling in both single and batch verification flows

- **Re-verification Status Reset:**
  - Application status automatically resets to "pending" when re-verifying
  - Ensures fresh start for re-verification regardless of previous status
  - Status then updated based on new verification results

### UX Enhancements ✅ (Latest)

- **Label Image Viewer Improvements:**
  - Click-and-drag panning for zoomed images
  - Mouse wheel zoom centered at cursor position
  - Less sensitive zoom (5% increments instead of 10%)
  - Reset button appears when image is zoomed/panned
  - Auto-reset pan when switching between image types

- **Dashboard Improvements:**
  - Action buttons (Review, Verify, Delete) always visible
  - Buttons disabled (greyed out) when no applications selected
  - Count shown on buttons only when 2+ applications selected
  - Removed "Exit Batch" button (kept only "Return to Dashboard")

- **Batch Review Flow:**
  - Automatic redirect to dashboard after completing last application in batch
  - No confirmation popup - seamless flow

### Validation Improvements ✅ (Latest)

- **Brand Name Validation:**
  - Case-only differences (e.g., "CROOKED HAMMOCK BREWERY" vs "Crooked Hammock Brewery") treated as MATCH
  - Only formatting differences (punctuation, whitespace) result in SOFT_MISMATCH
  - Minor misspellings (1-2 character differences) detected via Levenshtein distance also result in SOFT_MISMATCH
  - Added `differsOnlyByCase()` utility function

- **Extraction Prompt Enhancements:**
  - Added TTB expert framing to all prompts (beer, spirits, wine)
  - Label anatomy sections explaining where fields appear on labels
  - Detailed extraction rules with format examples
  - Better guidance for alcohol content, net contents, and other fields
  - Wine prompt includes front/back label structure guidance

- **Field Label Updates:**
  - "Producer Name Address" renamed to "Producer Name & Address" for consistency

## Recent Changes (January 29, 2025)

### Dashboard UI Improvements ✅ (Latest)

- **Table Column Updates:**
  - Replaced "Beverage Type" column with "Brand Name" column
  - Brand name displays from `application_data.brandName` or `expected_label_data.brand_name`
  - Removed "Actions" column from table
  - Removed individual "Verify" and "Delete" buttons from each row

- **Action Buttons:**
  - Added three action buttons below the application queue table: Review, Verify, Delete
  - Buttons appear when one or more applications are selected
  - Review: Navigates to first selected application with sequential navigation enabled
  - Verify: Batch verifies selected applications and navigates through them sequentially
  - Delete: Deletes selected applications with confirmation dialog

- **Sequential Batch Review Navigation:**
  - After batch verification or selecting applications for review, users can navigate sequentially
  - Previous/Next buttons in review page header
  - Position indicator shows "Application X of Y"
  - Exit Batch button to return to dashboard
  - Auto-navigation to next application after status update (approve/reject/flag)
  - Batch context persists in sessionStorage across page refreshes
  - Navigation handles missing/deleted applications gracefully

### Validation Enhancements ✅ (Latest)

- **Health Warning Validation Fix:**
  - Updated validation: Only "GOVERNMENT WARNING:" must be in ALL CAPS
  - Remainder of warning can have normal capitalization (e.g., "According to the Surgeon General...")
  - Updated `REQUIRED_HEALTH_WARNING` constant to reflect correct format
  - Comparison function normalizes remainder case-insensitively while preserving "GOVERNMENT WARNING:" case

- **Producer Name Validation:**
  - Case-only differences (e.g., "LAKE HOUSTON BREWERY" vs "LAKE HOUSTON Brewery") now treated as MATCH
  - Only non-case formatting differences (punctuation, whitespace) result in SOFT_MISMATCH
  - Entity suffix differences still result in SOFT_MISMATCH
  - Minor misspellings (1-2 character differences) detected via Levenshtein distance also result in SOFT_MISMATCH

- **Field Not Found Display Improvements:**
  - All cross-checked fields now show actual expected values instead of "Field not found"
  - When field exists in application but not found by AI:
    - Expected: [actual value from application]
    - Extracted: "Field not found"
  - Updated fields: brandName, fancifulName, producerNameAddress, healthWarning, appellation, vintageDate, classType (wine)

### AI Model Update ✅ (Latest)

- **Vision Model:** Updated from GPT-4o-mini to GPT-4o for label verification
- Updated in `lib/openai-service.ts`
- Improved accuracy for complex label extraction tasks

## Recent Changes (January 28, 2025)

### Validation UX Improvements ✅

- **Improved Error Messages:**
  - All validation functions now show "Field not found" instead of format strings when fields are missing
  - Applies to all fields across all beverage types (brandName, fancifulName, classType, alcoholContent, netContents, producerNameAddress, healthWarning, countryOfOrigin, ageStatement, appellation, vintageDate, sulfiteDeclaration, foreignWinePercentage)
  - More user-friendly error messages for missing fields

- **Net Contents Validation Enhancement:**
  - Added support for "U.S." or "US" prefix before unit names (gallons, quarts, pints)
  - Patterns now match: "5.16 U.S. Gallons", "1 U.S. quart", "2 US pints", etc.
  - Updated parsing functions to handle U.S. prefix correctly
  - Updated format validation to allow U.S. prefix in exact format checks

- **Producer Name Matching Enhancement:**
  - Added business entity suffix normalization (CO, CO., COMPANY, LLC, INC, INC., INCORPORATED, LTD, LIMITED)
  - Core business name matching ignores entity suffixes (e.g., "BISSELL BROTHERS BREWING CO." matches "Bissell Brothers Brewing Co LLC")
  - Entity suffix differences result in SOFT_MISMATCH instead of HARD_MISMATCH
  - Example: "BISSELL BROTHERS BREWING CO." vs "Bissell Brothers Brewing Co LLC" → SOFT_MISMATCH (core name matches)

- **Health Warning Validation Enhancement:**
  - Added validation rule: Only "GOVERNMENT WARNING" must be bold
  - Remainder of warning statement (after "GOVERNMENT WARNING:") must NOT be bold
  - Added `remainderBold` field to formatChecks in all extraction result types
  - Updated all three extraction prompts (Beer, Wine, Spirits) to check remainder bold status
  - Validation returns HARD_MISMATCH if remainder is bold

### UI/UX Enhancements ✅ (Latest)

- **Dashboard Improvements:**
  - ID column now displays TTB_ID from application_data instead of database ID
  - Falls back to "#{id}" format if TTB_ID not available
  - Added delete button for each application (removed confirmation dialogs)
  - Delete operation cascades to associated label images
  - Added DELETE endpoint at `/api/applications/[id]`
  - Added delete methods to `applicationHelpers` and `labelImageHelpers`
  - Removed success/failure alert messages after deletion

- **Review Page Display:**
  - Removed title "Review Application #{id}" and applicant name from top of page
  - Hide "Extracted" field when field is not found (shows null)
  - Expected text is black, Extracted text is grey
  - Field titles remain black even for mismatches
  - Wine Class/Type and Sulfite Declaration show requirement messages instead of "Expected: None"
  - Beer/Spirits Class/Type fields also show requirement messages when expected is null
  - Soft mismatch fields display yellow border matching warning icon color

- **Verification Flow:**
  - Removed "verification completed successfully" alert
  - Verification now redirects directly to review page (`/review/{id}`)
  - Smoother user experience without interruption

### Enhanced Validation Rules ✅

- **State Name/Abbreviation Equivalence:**
  - State names and two-letter abbreviations are now treated as equivalent
  - Example: "ME" = "Maine", "California" = "CA"
  - Updated producer address validation to use `statesMatch()` utility
- **Net Contents Validation Enhancements:**
  - Beverage-specific unit requirements:
    - Beer: U.S. customary units REQUIRED (fl. oz., pints, quarts, gallons), metric optional
    - Wine/Spirits: Metric units REQUIRED (mL, L), U.S. customary optional
  - Enhanced format normalization: mL/ml./ML → metric, L/litre/liter → liters, fl. oz./fluid ounces → U.S. units
  - Standards of fill validation for wine and spirits (SOFT_MISMATCH for non-standard container sizes)
  - UI now displays beverage-specific expected formats
- **Producer Address Validation:**
  - Updated to only validate city and state (not full street address)
  - Improved state extraction logic handles various address formats
  - **Phrase Requirements Added (January 28, 2025):**
    - Spirits/Wine: Producer name/address must immediately follow "Bottled By" or "Imported By" with no intervening text
    - Imported Beer: Importer name/address must immediately follow "Imported by" or similar phrase with no intervening text
    - Domestic Beer: No phrase requirement
    - Added `producerNamePhrase` field to extraction types (Beer, Wine, Spirits)
    - Updated extraction prompts to capture phrase preceding producer name/address
    - Validation returns SOFT_MISMATCH if required phrase is missing
- **Alcohol Content Validation Enhancements:**
  - Beer: Missing alcohol content now HARD_MISMATCH (was NOT_FOUND, non-failing)
  - Beer special terms validation (27 CFR 7.65):
    - "Low alcohol" or "Reduced alcohol": Only allowed if < 2.5% ABV
    - "Non-alcoholic": Requires adjacent statement "contains less than 0.5% alcohol by volume"
    - "Alcohol free": Only allowed if 0% ABV
  - Wine-specific rules:
    - Wines > 14% ABV: Numerical alcohol content statement mandatory
    - Wines 7-14% ABV: Numerical statement optional if "table wine" or "light wine" appears
- **UI Improvements:**
  - Domestic beverages show "N/A - Domestic" for country of origin
  - Net contents expected format shows beverage-specific requirements
  - Added `not_applicable` type support in verification results

### Authentication System Removed ✅

- **Removed Components:**
  - Login page (`app/login/page.tsx`)
  - Auth API routes (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`)
  - Authentication middleware checks from all API routes
- **Impact:** All API endpoints are now publicly accessible
- **Home Page:** Redirects directly to `/dashboard` instead of `/login`
- **Reason:** Authentication not required for prototype/demo purposes

### Application Form Enhancements ✅

- **TTB_ID Field Added:**
  - Added to `ApplicationData` type as optional field
  - Added input field to application form (top of Basic Information section)
  - Stored in `application_data` JSON in database
  - Optional field - users can leave blank

### Origin Code System Completely Removed ✅

- **Removed References:**
  - All `originCode` and `origin_code` references removed
  - Removed `inferOriginCodeFromCountry` function
  - Removed `require('./validation/origin-codes')` import
- **Replaced With:**
  - `OriginType` enum (DOMESTIC/IMPORTED) used throughout
  - `inferOriginTypeFromCountry` function returns OriginType enum
  - Application converter uses `originType` instead of `originCode`
- **Tests Updated:** Verification tests now use `originType: OriginType.DOMESTIC`

### UI/UX Improvements ✅

- **Flag for Review Button:**
  - Now redirects to dashboard after clicking
  - Application status properly updated to `needs_review`
  - Dashboard displays "Flagged for Review" instead of "needs_review"
- **Status Display:**
  - Added `getStatusDisplayText()` helper function
  - Formatted status badges: "Approved", "Rejected", "Flagged for Review", "Pending"
- **Review Page:**
  - Added confirmation dialog for overriding hard mismatches
  - Improved messaging emphasizing agent judgment
  - Better review notes guidance

### Government Warning Constant Updated ✅

- **Change:** Updated `REQUIRED_HEALTH_WARNING` constant to all capital letters
- **Text:** Entire warning now in uppercase for consistency

### Bug Fixes ✅

- **Cookie Handling:** Fixed Next.js 15 cookie setting (using `NextResponse.cookies.set()`)
- **Audit Logs:** Removed audit log calls that caused foreign key constraint failures
- **Application Converter:** Fixed to use `originType` instead of `originCode`

## Previous Changes (January 27, 2025)

### Validation Module Refactoring ✅ (January 27, 2025)

- **Modular Validation Structure:** Reorganized validation rules into organized folder structure
  - Split large `ttb-validation-v4.ts` (2015 lines) into 13 focused modules
  - Created `lib/validation/` directory with logical separation:
    - `types.ts` - Enums and interfaces
    - `origin-codes.ts` - Origin code constants and helpers
    - `constants.ts` - Validation constants (health warning, patterns)
    - `prompts.ts` - AI extraction prompts for each beverage type
    - `utils.ts` - Utility functions (normalization, matching)
    - `validators/common.ts` - Common validators (brand, fanciful, class, alcohol, net contents, producer, health warning, country)
    - `validators/beer.ts` - Beer-specific validators (placeholder)
    - `validators/spirits.ts` - Spirits-specific validators (age statement)
    - `validators/wine.ts` - Wine-specific validators (appellation, varietal, vintage, sulfite, foreign wine percentage)
    - `surfaced.ts` - Surfaced fields extraction functions
    - `validation.ts` - Main validation functions (`validateLabel`, `validateBeerLabel`, etc.)
    - `display.ts` - Display helpers (field labels, status display)
    - `index.ts` - Main export file
  - **ApplicationData Direct Usage:** Removed backward compatibility layer
    - `verification.ts` now accepts `ApplicationData` directly (no conversion from `ExpectedLabelData`)
    - Created `application-converter.ts` to convert database `Application` to `ApplicationData`
    - Updated database schema: `expected_label_data` → `application_data` (with migration)
    - Updated all API routes and call sites to use `ApplicationData` format
  - **Benefits:** Better maintainability, easier to extend, clearer separation of concerns

### Implementation Complete ✅

- **All 10 Tasks Completed:** Every major feature implemented
  - Task 1: Project environment setup
  - Task 2: User authentication system
  - Task 3: Database schema
  - Task 4: Application management API
  - Task 5: AI verification service
  - Task 6: Frontend dashboard
  - Task 7: Application review interface
  - Task 8: Batch processing logic
  - Task 9: Audit log system
  - Task 10: Testing & code quality

- **All 50 Subtasks Completed:** Every detailed subtask finished

### UI Component Library Integration ✅ (January 27, 2025)

- **shadcn/ui Integration:** Complete migration to accessible component library
  - All pages migrated (Login, Dashboard, Review)
  - Components: Button, Input, Select, Table, Badge, Alert, Textarea, Checkbox, Label
  - Icons: Lucide React integration
  - Improved accessibility with Radix UI primitives
  - Consistent design system with Tailwind CSS theme variables
  - Better UX with proper loading states, variants, and visual feedback

### Railway Deployment Configuration ✅ (January 27, 2025)

- **Deployment Platform:** Railway configured and ready
  - Builder: Railpack (auto-detects Next.js)
  - Database lazy initialization: Prevents build-time errors
  - Health endpoint: `/api/health` created for monitoring
  - Build configuration: ESLint skipped during builds, database initialization deferred to runtime
  - Environment variables: OPENAI_API_KEY, DATABASE_PATH, NODE_ENV configured
  - Persistent volume: `/app/data` for SQLite database storage
  - All nixpacks references removed, using Railpack auto-detection

### Code Quality Infrastructure Added ✅

1. **Testing Framework:** Vitest with 29 passing tests
   - Verification logic tests (20 tests)
   - Authentication tests (7 tests)
   - API validation tests (2 tests)

2. **Linting & Formatting:**
   - ESLint with Next.js + Prettier integration
   - Prettier for consistent code formatting
   - Custom rules for code quality

3. **Pre-commit Hooks:**
   - Husky for Git hooks
   - lint-staged for automatic linting/formatting
   - Prevents commits with quality issues

4. **Quality Scripts:**
   - `npm run quality` - Runs all checks
   - `npm run test` - Test suite
   - `npm run lint` - Linting
   - `npm run format` - Formatting

### Build Status ✅

- **Build:** Successful (all code compiles)
- **Tests:** 29/29 passing
- **Linting:** All issues resolved
- **Type Checking:** No errors
- **Formatting:** All files formatted

## Next Steps (Testing & Deployment Phase)

### Immediate (This Week)

1. ✅ Code quality infrastructure (COMPLETE)
2. ✅ Railway deployment configuration (COMPLETE)
3. ⏳ Performance testing (verify < 5s verification times)
4. ⏳ User acceptance testing with stakeholders
5. ⏳ Production deployment verification

### Short Term (Next Week)

6. ⏳ Add keyboard shortcuts (A/R/F, ↑/↓, N, Space, +/-)
7. ⏳ Keyboard shortcuts legend component
8. ⏳ Enhanced error handling UI
9. ⏳ Loading states and progress indicators
10. ✅ Railway deployment configured (ready for production)

### Future Enhancements (Post-MVP)

11. ⏳ Admin dashboard for audit log viewing
12. ⏳ Advanced filtering and search
13. ⏳ Export functionality
14. ⏳ Accessibility improvements
15. ⏳ Mobile responsive design

## Active Decisions and Considerations

### Technical Decisions Made ✅

- **Testing Framework:** Vitest (fast, Jest-compatible)
- **Linting:** ESLint + Prettier (industry standard)
- **Pre-commit Hooks:** Husky + lint-staged (automatic quality)
- **Code Style:** Prettier configuration (consistent formatting)

### Product Decisions Pending

- **Keyboard Shortcuts:** Which shortcuts to prioritize?
- **Admin UI:** Separate interface or same as agents?
- **Audit Log UI:** Should agents see their own audit trail?
- **Performance Targets:** Actual verification times vs. targets

### No Blockers

- All core functionality implemented
- All tests passing
- Code quality tools configured
- Build successful
- Ready for testing and deployment

## Current Work Environment

### Repository State

- Branch: `main`
- Latest Commit: `18991f5` - "fix: improve alcohol content extraction and remove vintage field"
- All code committed and pushed

### Project Status

- ✅ **Implementation:** 100% complete
- ✅ **Testing:** Framework configured, 29 tests passing
- ✅ **Code Quality:** Linting, formatting, pre-commit hooks active
- ✅ **Documentation:** Complete (PRD, Architecture, API docs)
- ✅ **Deployment:** Railway configured, ready for production
- ⏳ **User Testing:** Ready to begin

### Files Structure

```
✅ app/                    # Next.js App Router (complete)
✅ lib/                    # Utility libraries (complete)
   ├── validation/         # Modular validation rules (NEW)
   │   ├── types.ts
   │   ├── ~~origin-codes.ts~~ (REMOVED - no longer exists)
   │   ├── constants.ts
   │   ├── prompts.ts
   │   ├── utils.ts
   │   ├── validators/
   │   │   ├── common.ts
   │   │   ├── beer.ts
   │   │   ├── spirits.ts
   │   │   └── wine.ts
   │   ├── surfaced.ts
   │   ├── validation.ts
   │   ├── display.ts
   │   └── index.ts
   ├── verification.ts      # Updated to use ApplicationData
   └── application-converter.ts  # NEW: DB to ApplicationData converter
✅ types/                  # TypeScript definitions (complete)
✅ __tests__/              # Test suites (complete)
✅ docs/                   # Documentation (complete)
✅ scripts/                # Utility scripts (complete)
✅ .husky/                 # Pre-commit hooks (configured)
✅ .eslintrc.json          # ESLint config (configured)
✅ .prettierrc             # Prettier config (configured)
✅ vitest.config.ts        # Test config (configured)
```

### Next Action

**Performance Testing & Final Deployment:**

1. Test verification times (target: < 5s)
2. Test batch processing (target: 100 apps in ~20s)
3. ✅ Railway deployment configured (Railpack auto-detection)
4. Verify production deployment on Railway
5. Begin user acceptance testing

## Timeline Awareness

**Status:** Ahead of Schedule ✅  
**All Core Features:** Implemented  
**Testing Framework:** Configured and passing  
**Code Quality:** Enforced via pre-commit hooks  
**Ready For:** User testing and deployment

**Next Milestones:**

- Performance validation
- User acceptance testing
- Production deployment
- Stakeholder feedback

---

_Last Updated: January 29, 2025 (Critical verification fixes: resolved prefilled AI recommendations issue by clearing old results before processing, fixed verification hanging with client/server timeouts. Dashboard enhancements: added Review Notes column with hover tooltip. Previous: Review notes persistence, confirmation dialog removal, verification clearing fixes, navigation improvements, UI enhancements. Ready for production deployment and testing.)_
