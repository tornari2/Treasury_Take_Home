# Validation Rules: Soft vs Hard Mismatches

This document outlines all SOFT_MISMATCH and HARD_MISMATCH rules for each beverage type.

## Status Definitions

- **MATCH** ✅: Field passes validation
- **SOFT_MISMATCH** ⚠️: Review required - values are semantically equivalent but differ in formatting
- **HARD_MISMATCH** ❌: Material difference - likely rejection
- **NOT_FOUND** ❌: Required field missing (treated as HARD_MISMATCH for overall status)

---

## Common Fields (All Beverage Types)

### Brand Name

**HARD_MISMATCH:**

- Field missing (NOT_FOUND)
- Brand name doesn't match application (different words/meaning)

**SOFT_MISMATCH:**

- Brand name matches after normalization but differs in case/punctuation/formatting
  - Example: "STONE'S THROW" vs "Stone's Throw"
  - Example: "Old Tom" vs "old tom"

**MATCH:**

- Exact match or normalized match with no formatting differences

---

### Fanciful Name

**HARD_MISMATCH:**

- Application has fanciful name but label doesn't (NOT_FOUND)
- Label has fanciful name but application doesn't
- Fanciful names don't match (different words/meaning)

**SOFT_MISMATCH:**

- Fanciful name matches after normalization but differs in case/punctuation/formatting

**MATCH:**

- Both present and match, or both absent (NOT_APPLICABLE)

---

### Class/Type Designation

**HARD_MISMATCH:**

- Field missing (NOT_FOUND)

**MATCH:**

- Present on label (no cross-checking for beer/spirits)

**Note:** For wine, class/type is cross-checked as varietal (see Wine section)

---

### Producer Name & Address

**HARD_MISMATCH:**

- Both name and address missing (NOT_FOUND)
- Producer name doesn't match application
- City doesn't match application
- State doesn't match application (state names and abbreviations are equivalent: ME = Maine)

**SOFT_MISMATCH:**

- Producer name matches but has minor formatting differences (case/punctuation)

**MATCH:**

- Name, city, and state all match
- Only city and state are validated (street address not validated)

---

### Health Warning Statement

**HARD_MISMATCH:**

- Field missing (NOT_FOUND)
- Text doesn't match exact required wording word-for-word
- "GOVERNMENT WARNING" is not in ALL CAPS
- "GOVERNMENT WARNING" is not bold
- "Surgeon" is not capitalized
- "General" is not capitalized

**MATCH:**

- Exact text match with proper formatting

**Note:** Health warning has NO soft mismatch tolerance - any deviation is HARD_MISMATCH

---

### Country of Origin

**NOT_APPLICABLE:**

- Domestic products (shows "N/A - Domestic" in UI)

**NOT_FOUND (HARD_MISMATCH):**

- Imported products missing country of origin

**MATCH:**

- Present on label (no cross-checking - filled by TTB agents)

---

## Beer/Malt Beverages

### Alcohol Content

**HARD_MISMATCH:**

- Field missing (REQUIRED for all beverages)
- "Low alcohol" or "Reduced alcohol" used but alcohol content ≥ 2.5% ABV
- "Low alcohol" or "Reduced alcohol" used but no numerical alcohol content stated
- "Non-alcoholic" used but missing required statement "contains less than 0.5% (or .5%) alcohol by volume"
- "Alcohol free" used but alcohol content > 0% ABV or missing

**SOFT_MISMATCH:**

- Format doesn't match accepted patterns (if no special terms used)
  - Accepted: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", "XX% Alcohol by Volume"
  - Invalid: "80 Proof", "5%", "5% ABV"
- Special terms used but format doesn't match when percentage required

**MATCH:**

- Present with valid format
- Special terms comply with rules (< 2.5% for low/reduced, 0% for alcohol free, statement present for non-alcoholic)

---

### Net Contents

**NOT_FOUND (HARD_MISMATCH):**

- Field missing

**HARD_MISMATCH:**

- U.S. customary units required but only metric units found (wrong unit type)
- Metric units required but only U.S. customary units found (wrong unit type)
- Invalid format (doesn't match metric or U.S. customary patterns)
- Number detected but unit missing (for wine/spirits)

**SOFT_MISMATCH:**

- Volume doesn't match authorized standards of fill (non-standard container size for wine/spirits)

**MATCH:**

- U.S. customary units present (fl. oz., pints, quarts, gallons) for beer
- Metric units present (mL, L) for wine/spirits
- Optional units may also be present

**Accepted Formats:**

- U.S. Customary: "12 fl oz", "12 fl. oz.", "1 pint", "1 quart", "1 gallon", "12 fluid ounces", "1 pint 8 fl oz", "2 quarts 1 pint"
- Metric (optional): "750 mL", "750 ml", "750 ML", "1 L", "1 liter", "1 litre"

**Formatting Requirements (27 CFR 7.70):**

- Less than 1 pint: fluid ounces or fractions of a pint
- Exactly 1 pint, 1 quart, or 1 gallon: must be stated exactly as "1 pint", "1 quart", or "1 gallon"
- More than 1 pint but less than 1 quart: fractions of a quart, or pints and fluid ounces
- More than 1 quart but less than 1 gallon: fractions of a gallon, or quarts, pints, and fluid ounces
- More than 1 gallon: gallons and fractions thereof

---

## Wine

### Alcohol Content

**HARD_MISMATCH:**

- Missing and NOT "table wine" or "light wine" (could be > 14% ABV or 7-14% without designation)
- Present but no numerical percentage found and NOT "table wine" or "light wine"

**SOFT_MISMATCH:**

- Format doesn't match accepted patterns
- Wines > 14% ABV: Format issues
- Wines 7-14% ABV: Format issues
- Wines < 7% ABV: Format issues
- Table/light wine with format issues

**MATCH:**

- Present with valid format
- Missing but "table wine" or "light wine" appears (7-14% ABV, numerical statement optional)

**Rules:**

- Wines > 14% ABV: Numerical alcohol content statement is **mandatory**
- Wines 7-14% ABV: Numerical statement is **optional** if "table wine" or "light wine" appears as class/type designation

---

### Net Contents

**NOT_FOUND (HARD_MISMATCH):**

- Field missing

**HARD_MISMATCH:**

- Metric units required but only U.S. customary units found (wrong unit type)
- Invalid format (doesn't match metric or U.S. customary patterns)
- Number detected but unit missing (for wine/spirits)
- **Formatting violations per 27 CFR 4.72:**
  - Containers 4-17 liters: not expressed in whole liters (decimals not allowed)
  - Containers 4-17 liters: format doesn't match "X liters" or "X L" where X is a whole number
  - Containers 18+ liters: decimal portions exceed 2 decimal places (must be accurate to nearest one-hundredth)
  - Containers 18+ liters: format doesn't match "X.XX liters" or "X.XX L" with up to 2 decimal places

**SOFT_MISMATCH:**

- Volume doesn't match authorized standards of fill (non-standard container size)

**MATCH:**

- Metric units present (mL, L) and matches authorized standards of fill
- Proper formatting per 27 CFR 4.72 for containers 4L+
- U.S. customary units optional (may also be present)

**Authorized Standards of Fill:**

- 3L, 2.25L, 1.8L, 1.5L, 1L, 750mL, 720mL, 700mL, 620mL, 600mL, 568mL, 550mL, 500mL, 473mL, 375mL, 360mL, 355mL, 330mL, 300mL, 250mL, 200mL, 187mL, 180mL, 100mL, 50mL
- Or whole liters ≥ 4L (4L, 5L, 6L, etc.) for containers 4-17 liters

**Formatting Requirements (27 CFR 4.72):**

- Containers 4-17 liters: must be expressed in whole liters (e.g., "4 liters", "5 liters", "6 liters") - no decimals
- Containers 18+ liters: must be expressed in liters with decimal portions accurate to nearest one-hundredth (e.g., "18.50 liters", "20.25 L")

---

### Class/Type (Varietal)

**NOT_FOUND (HARD_MISMATCH):**

- Field missing

**HARD_MISMATCH:**

- Application has varietal but class/type doesn't match
- Label has varietal but application doesn't

**SOFT_MISMATCH:**

- Class/type matches varietal but differs in case/punctuation/formatting

**MATCH:**

- Present and matches application varietal (if application has varietal)
- Present but application has no varietal (no cross-check)

---

### Appellation of Origin

**NOT_FOUND (HARD_MISMATCH):**

- Required but missing (required if label contains: varietal, vintage date, or "Estate Bottled")
- Application has appellation but label doesn't

**HARD_MISMATCH:**

- Label has appellation but application doesn't
- Appellations don't match (different words/meaning)

**SOFT_MISMATCH:**

- Appellations match but differ in case/punctuation/formatting

**MATCH:**

- Both present and match, or both absent and not required

---

### Vintage Date

**HARD_MISMATCH:**

- Application has vintage but label doesn't (NOT_FOUND)
- Label has vintage but application doesn't
- Vintage dates don't match (different years)

**SOFT_MISMATCH:**

- Vintage dates match but differ in formatting

**MATCH:**

- Both present and match, or both absent (NOT_APPLICABLE)

---

### Sulfite Declaration

**NOT_FOUND (HARD_MISMATCH):**

- Field missing (REQUIRED for wine)

**MATCH:**

- Present on label (no format validation)

---

### Foreign Wine Percentage

**NOT_FOUND (HARD_MISMATCH):**

- Label references foreign wine but no percentage statement found

**NOT_APPLICABLE:**

- No foreign wine reference on label

**MATCH:**

- Present when required, or not applicable

---

## Spirits

### Alcohol Content

**HARD_MISMATCH:**

- Field missing (REQUIRED)

**SOFT_MISMATCH:**

- Format doesn't match accepted patterns
  - Accepted: "XX% Alc/Vol", "Alcohol XX% by Volume", "Alc. XX% by Vol", "XX% Alcohol by Volume"
  - Invalid: "80 Proof", "5%", "5% ABV"

**MATCH:**

- Present with valid format

---

### Net Contents

**NOT_FOUND (HARD_MISMATCH):**

- Field missing

**HARD_MISMATCH:**

- Metric units required but only U.S. customary units found (wrong unit type)
- Invalid format (doesn't match metric or U.S. customary patterns)
- Number detected but unit missing

**SOFT_MISMATCH:**

- Volume doesn't match authorized standards of fill (non-standard container size)

**MATCH:**

- Metric units present (mL, L) and matches authorized standards of fill
- U.S. customary units optional (may also be present)

**Authorized Standards of Fill:**

- 3.75L, 3L, 2L, 1.8L, 1.75L, 1.5L, 1L, 945mL, 900mL, 750mL, 720mL, 710mL, 700mL, 570mL, 500mL, 475mL, 375mL, 355mL, 350mL, 331mL, 250mL, 200mL, 187mL, 100mL, 50mL

---

### Age Statement

**NOT_FOUND (HARD_MISMATCH):**

- Field missing (REQUIRED for spirits)

**MATCH:**

- Present on label (no format validation)

---

## Summary by Beverage Type

### Beer

- **HARD_MISMATCH:** Missing alcohol content, missing brand name, missing class type, missing net contents, missing producer name/address, missing health warning, alcohol content violations (low/reduced ≥ 2.5%, non-alcoholic without statement, alcohol free > 0%), producer name/address mismatch, **net contents wrong unit type (metric when US required)**
- **SOFT_MISMATCH:** Brand name formatting, fanciful name formatting, alcohol content format issues, producer name formatting

### Wine

- **HARD_MISMATCH:** Missing alcohol content (if not table/light wine), missing brand name, missing class type, missing net contents, missing producer name/address, missing health warning, missing sulfite declaration, varietal mismatch, appellation mismatch, vintage date mismatch, foreign wine percentage missing when required, alcohol content format issues (if not table/light wine), **net contents wrong unit type (US customary when metric required)**
- **SOFT_MISMATCH:** Brand name formatting, fanciful name formatting, alcohol content format issues, net contents non-standard sizes, varietal formatting, appellation formatting, vintage date formatting

### Spirits

- **HARD_MISMATCH:** Missing alcohol content, missing brand name, missing class type, missing net contents, missing producer name/address, missing health warning, missing age statement, producer name/address mismatch, **net contents wrong unit type (US customary when metric required)**
- **SOFT_MISMATCH:** Brand name formatting, fanciful name formatting, alcohol content format issues, net contents non-standard sizes, producer name formatting

---

## Understanding "Format Issues"

"Format Issues" occur when an extracted value doesn't match the expected regex patterns, even though the semantic meaning might be correct. The validation system uses pattern matching to detect format problems.

### How Format Validation Works

1. **Pattern Matching**: Each field has a set of regex patterns that define acceptable formats
2. **Comparison**: The extracted value is tested against these patterns using `matchesAnyPattern()`
3. **Result**: If no pattern matches, it's flagged as a format issue

### Format Issues by Field

#### Net Contents Format Issues

**Patterns Checked:**

- **Metric**: `^\d+(\.\d+)?\s*m[Ll]\.?$`, `^\d+(\.\d+)?\s*[Ll]\.?$`, `^\d+(\.\d+)?\s*[Ll]iter(s)?$`, `^\d+(\.\d+)?\s*[Ll]itre(s)?$`
- **U.S. Customary**: `^\d+(\.\d+)?\s*fl\.?\s*oz\.?$`, `^\d+(\.\d+)?\s*fluid\s+ounce(s)?$`, `^\d+(\.\d+)?\s*pint(s)?$`, `^\d+(\.\d+)?\s*quart(s)?$`, `^\d+(\.\d+)?\s*gallon(s)?$`

**Examples of Format Issues:**

- ✅ Valid: "750 mL", "12 fl oz", "1 liter", "1 pint"
- ❌ Invalid: "750" (missing unit), "750ml" (no space), "750 milliliters" (not in pattern list), "750cc" (wrong unit)

**Current Behavior:**

- Wrong unit type (metric when US required, or vice versa): **HARD_MISMATCH**
- Missing unit (number only): **HARD_MISMATCH**
- Invalid format (doesn't match any pattern): **HARD_MISMATCH**

#### Alcohol Content Format Issues

**Patterns Checked:**

- `^\d+(\.\d+)?%\s*Alc\.?\s*\/?\s*Vol\.?$`
- `^Alcohol\s+\d+(\.\d+)?%\s*(by\s+)?Vol(ume)?\.?$`
- `^Alc\.?\s+\d+(\.\d+)?%\s*(by\s+)?Vol\.?$`
- `^\d+(\.\d+)?%\s*Alcohol\s+(by\s+)?Vol(ume)?\.?$`

**Examples of Format Issues:**

- ✅ Valid: "5% Alc/Vol", "Alcohol 5% by Volume", "Alc. 5% by Vol", "5% Alcohol by Volume"
- ❌ Invalid: "5%" (missing "Alc/Vol" or equivalent), "80 Proof" (wrong format), "5% ABV" (not in pattern list), "5 percent" (wrong wording)

**Current Behavior:**

- Missing alcohol content: **HARD_MISMATCH**
- Invalid format (doesn't match patterns): **SOFT_MISMATCH** (for beer/spirits), **SOFT_MISMATCH** or **HARD_MISMATCH** (for wine, depending on percentage and class type)

### Format vs. Content Validation

- **Format Validation**: Checks if the value matches expected patterns (regex)
- **Content Validation**: Checks if the value matches application data or meets business rules
- **Soft Mismatch**: Format is wrong but content is semantically correct (e.g., "5%" instead of "5% Alc/Vol")
- **Hard Mismatch**: Content is wrong (e.g., wrong unit type, missing required field)

### Normalization

Some fields use normalization before comparison:

- **String Fields** (Brand Name, Fanciful Name, etc.): Normalized to lowercase, whitespace collapsed
- **Soft Mismatch Detection**: Uses `isSoftMismatch()` which checks if strings match after normalization but differ in original form
  - Example: "Stone's Throw" vs "STONE'S THROW" → matches after normalization → SOFT_MISMATCH
  - Example: "Stone's Throw" vs "Stone Throw" → doesn't match after normalization → HARD_MISMATCH

---

_Last Updated: January 28, 2025_
