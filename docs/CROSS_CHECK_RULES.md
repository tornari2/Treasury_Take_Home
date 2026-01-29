# Cross-Check Rules

Cross-check rules compare values extracted from the label against values stored in the application data. These ensure that what appears on the label matches what was approved in the application.

## Overview

Cross-check validation uses normalized string comparison (case-insensitive, whitespace-normalized) to determine matches. Fields can have three outcomes:

- **MATCH**: Values match exactly or after normalization
- **SOFT_MISMATCH**: Values match after normalization but differ in case/punctuation/formatting
- **HARD_MISMATCH**: Values don't match (different content)

---

## Common Cross-Check Rules (All Beverage Types)

### 1. Brand Name

**Rule**: Brand name on label must match brand name in application

**Validation Logic**:

- If missing on label: `NOT_FOUND` (HARD_MISMATCH)
- If matches exactly: `MATCH`
- If matches after normalization but differs in formatting: `SOFT_MISMATCH`
- If doesn't match: `HARD_MISMATCH`

**Examples**:

- ✅ MATCH: Application "Stone's Throw" → Label "Stone's Throw"
- ⚠️ SOFT_MISMATCH: Application "Stone's Throw" → Label "STONE'S THROW"
- ❌ HARD_MISMATCH: Application "Stone's Throw" → Label "Stone Throw"

**Applied To**: Beer, Wine, Spirits

---

### 2. Fanciful Name

**Rule**: Fanciful name must be consistent between application and label

**Validation Logic**:

- If neither application nor label has fanciful name: `NOT_APPLICABLE`
- If application has it but label doesn't: `HARD_MISMATCH`
- If label has it but application doesn't: `HARD_MISMATCH`
- If both have it and match exactly: `MATCH`
- If both have it and match after normalization: `SOFT_MISMATCH`
- If both have it but don't match: `HARD_MISMATCH`

**Examples**:

- ✅ MATCH: Application "Reserve" → Label "Reserve"
- ⚠️ SOFT_MISMATCH: Application "Reserve" → Label "RESERVE"
- ❌ HARD_MISMATCH: Application "Reserve" → Label "Premium"

**Applied To**: Beer, Wine, Spirits

---

### 3. Producer Name & Address

**Rule**: Producer name, city, and state on label must match application

**Important**: Only validates producer name, city, and state. **Street address is NOT validated**.

**Validation Logic**:

- If both name and address missing: `NOT_FOUND` (HARD_MISMATCH)
- Producer name must match (normalized comparison)
- City must match (normalized comparison)
- State must match (state names and abbreviations are EQUIVALENT: "ME" = "Maine", "CA" = "California")
- If name matches but formatting differs: `SOFT_MISMATCH`
- If name, city, or state don't match: `HARD_MISMATCH`

**State Equivalence**:

- State abbreviations and full names are treated as equivalent
- Examples: "ME" = "Maine", "California" = "CA", "New York" = "NY"

**Examples**:

- ✅ MATCH: Application "Acme Brewing, Portland, ME" → Label "Acme Brewing, Portland, Maine"
- ⚠️ SOFT_MISMATCH: Application "Acme Brewing" → Label "ACME BREWING" (name formatting difference)
- ❌ HARD_MISMATCH: Application "Acme Brewing, Portland, ME" → Label "Acme Brewing, Boston, MA"

**Applied To**: Beer, Wine, Spirits

---

## Wine-Specific Cross-Check Rules

### 4. Appellation of Origin

**Rule**: Appellation must be consistent between application and label

**Context**: Appellation is required if label contains varietal, vintage date, or "Estate Bottled"

**Validation Logic**:

- If appellation is required (varietal/vintage/estate bottled) but missing: `NOT_FOUND` (HARD_MISMATCH)
- If neither application nor label has appellation (and not required): `NOT_APPLICABLE`
- If application has appellation but label doesn't: `NOT_FOUND` (HARD_MISMATCH)
- If label has appellation but application doesn't: `HARD_MISMATCH`
- If both have appellation and match exactly: `MATCH`
- If both have appellation and match after normalization: `SOFT_MISMATCH`
- If both have appellation but don't match: `HARD_MISMATCH`

**Examples**:

- ✅ MATCH: Application "Napa Valley" → Label "Napa Valley"
- ⚠️ SOFT_MISMATCH: Application "Napa Valley" → Label "NAPA VALLEY"
- ❌ HARD_MISMATCH: Application "Napa Valley" → Label "Sonoma Valley"

**Applied To**: Wine only

---

### 5. Class/Type (Varietal)

**Rule**: If application specifies a varietal, the class/type designation on label must match it

**Context**: For wine, if the application has a varietal designation, the class/type field IS the varietal and must be cross-checked.

**Validation Logic**:

- If class/type missing on label: `NOT_FOUND` (HARD_MISMATCH) - class/type is REQUIRED
- If application has varietal:
  - If class/type matches varietal exactly: `MATCH`
  - If class/type matches varietal after normalization: `SOFT_MISMATCH`
  - If class/type doesn't match varietal: `HARD_MISMATCH`
- If application doesn't have varietal: `MATCH` (presence check only, no cross-check)

**Examples**:

- ✅ MATCH: Application varietal "Chardonnay" → Label class/type "Chardonnay"
- ⚠️ SOFT_MISMATCH: Application varietal "Chardonnay" → Label class/type "CHARDONNAY"
- ❌ HARD_MISMATCH: Application varietal "Chardonnay" → Label class/type "Sauvignon Blanc"

**Applied To**: Wine only

---

### 6. Vintage Date

**Rule**: Vintage date must be consistent between application and label

**Validation Logic**:

- If neither application nor label has vintage date: `NOT_APPLICABLE`
- If application has vintage but label doesn't: `NOT_FOUND` (HARD_MISMATCH)
- If label has vintage but application doesn't: `HARD_MISMATCH`
- If both have vintage and match exactly: `MATCH`
- If both have vintage and match after normalization: `SOFT_MISMATCH`
- If both have vintage but don't match: `HARD_MISMATCH`

**Examples**:

- ✅ MATCH: Application "2020" → Label "2020"
- ⚠️ SOFT_MISMATCH: Application "2020" → Label "2020 " (whitespace difference)
- ❌ HARD_MISMATCH: Application "2020" → Label "2021"

**Applied To**: Wine only

---

## Fields NOT Cross-Checked

The following fields are validated for presence and format but are **NOT** cross-checked against application data:

- **Alcohol Content**: Validated for format and compliance with TTB rules, but not cross-checked
- **Net Contents**: Validated for format and standards of fill, but not cross-checked
- **Health Warning**: Validated for exact text match and formatting, but not cross-checked (uses fixed required text)
- **Class/Type** (Beer/Spirits): Validated for presence only, not cross-checked
- **Country of Origin**: Validated for presence (imported products), but not cross-checked (filled by TTB agents)
- **Age Statement** (Spirits): Validated for presence only, not cross-checked
- **Sulfite Declaration** (Wine): Validated for presence only, not cross-checked
- **Foreign Wine Percentage** (Wine): Validated for presence when required, but not cross-checked

---

## Normalization Details

Cross-check comparisons use normalized string matching:

1. **Case-insensitive**: "Stone's Throw" matches "STONE'S THROW"
2. **Whitespace normalized**: Multiple spaces collapsed to single space
3. **Trimmed**: Leading/trailing whitespace removed
4. **State equivalence**: State abbreviations and full names are equivalent

**Soft Mismatch Detection**:

- Values match after normalization but differ in original form
- Examples: case differences, punctuation differences, whitespace differences

---

## Summary by Beverage Type

### Beer

- ✅ Brand Name (cross-checked)
- ✅ Fanciful Name (cross-checked)
- ✅ Producer Name & Address (cross-checked)
- ❌ Class/Type (presence only)
- ❌ Alcohol Content (format only)
- ❌ Net Contents (format only)

### Wine

- ✅ Brand Name (cross-checked)
- ✅ Fanciful Name (cross-checked)
- ✅ Producer Name & Address (cross-checked)
- ✅ Class/Type/Varietal (cross-checked if application has varietal)
- ✅ Appellation (cross-checked)
- ✅ Vintage Date (cross-checked)
- ❌ Alcohol Content (format only)
- ❌ Net Contents (format only)

### Spirits

- ✅ Brand Name (cross-checked)
- ✅ Fanciful Name (cross-checked)
- ✅ Producer Name & Address (cross-checked)
- ❌ Class/Type (presence only)
- ❌ Alcohol Content (format only)
- ❌ Net Contents (format only)
- ❌ Age Statement (presence only)

---

_Last Updated: January 28, 2025_
