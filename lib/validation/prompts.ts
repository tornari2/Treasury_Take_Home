// ============================================================
// TTB AI Extraction Prompts
// ============================================================

import { BeverageType } from './types';

/**
 * AI extraction prompt for BEER / MALT BEVERAGES
 */
export const BEER_EXTRACTION_PROMPT = `
You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance expert analyzing a BEER / MALT BEVERAGE label image.

LABEL ANATOMY - Where to find each field:
- BRAND NAME: Usually the largest, most prominent text on the label
- FANCIFUL NAME: Secondary name, often stylized, near or below brand name
- CLASS/TYPE: Beer style (Ale, Lager, IPA, Stout, etc.) - often near brand name
- NET CONTENTS: Usually at bottom of label (e.g., "12 FL OZ", "16 fl oz", "355 mL")
- ALCOHOL CONTENT: Small text, often near net contents or bottom edge (e.g., "5.0% ALC/VOL", "ABV 4.5%")
- PRODUCER NAME/ADDRESS: Typically at bottom, may include "Brewed by", "Imported by"
- HEALTH WARNING: Block of small text, often on back label, starts with "GOVERNMENT WARNING:"
- COUNTRY OF ORIGIN: For imports, usually "Product of [Country]" or "Imported from [Country]"

EXTRACTION RULES:
1. Extract text EXACTLY as shown - preserve capitalization, punctuation, spacing
   - CRITICAL: For ALL fields (brand name, fanciful name, class type, producer name, producer address, appellation, country of origin, etc.), preserve the exact capitalization as it appears on the label
   - If ANY field appears in ALL CAPS on the label (e.g., "FAR MOUNTAIN", "MOON MOUNTAIN DISTRICT"), extract it as ALL CAPS
   - If ANY field appears in Title Case (e.g., "Far Mountain", "Moon Mountain District"), extract it as Title Case
   - Do NOT normalize or change capitalization - extract exactly as shown on the label
2. For ALCOHOL CONTENT: Look carefully at small text. Common formats:
   - "X.X% ALC/VOL" or "X.X% ALC./VOL."
   - "ALC. X.X% BY VOL." or "ALCOHOL X.X% BY VOLUME"
   - "ABV X.X%" or "X.X% ABV"
   - CRITICAL: Extract the COMPLETE text exactly as shown, including any prefix words like "ALCOHOL", "ALC.", or "ABV"
   - If the label says "ALCOHOL 14% BY VOLUME", extract it as "ALCOHOL 14% BY VOLUME" (not just "14% BY VOLUME")
   - If the label says "ALC. 5.0% BY VOL.", extract it as "ALC. 5.0% BY VOL." (not just "5.0% BY VOL.")
   - Read the number carefully - distinguish 5 from 6, 4 from 9, etc.
3. For NET CONTENTS: Usually formatted as:
   - "12 FL OZ" or "12 fl oz" or "12 FL. OZ."
   - "355 mL" or "355ml"
4. If a field is not visible or not present, use null
5. If text is partially obscured but you can reasonably infer it, extract it and note in confidenceNotes

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact text or null",
    "fancifulName": "exact text or null (optional - many beers don't have one)",
    "classType": "exact beer style text (e.g., 'Ale', 'Lager', 'India Pale Ale', 'Stout') or null",
    "netContents": "exact text (e.g., '12 FL OZ', '16 fl oz', '355 mL') or null",
    "alcoholContent": "exact COMPLETE text including any prefix words (e.g., '5.0% ALC/VOL', 'ALCOHOL 14% BY VOLUME', 'ALC. 5.0% BY VOL.', 'ABV 4.5%') or null - READ CAREFULLY, this is often small. Extract the ENTIRE text including 'ALCOHOL', 'ALC.', or 'ABV' if present",
    "producerName": "exact text of brewer/bottler name or null",
    "producerAddress": "exact text (city, state format) or null",
    "producerNamePhrase": "exact text of the phrase immediately preceding producer name/address. IMPORTANT: For IMPORTED beers only, extract 'Imported by' or similar phrase if present. For domestic beers, this field should be null (no phrase requirement). Extract the phrase only if the beer appears to be imported.",
    "healthWarningText": "EXACT full text preserving ALL formatting, or null",
    "countryOfOrigin": "exact text (e.g., 'Product of Mexico', 'Imported from Germany') or null if domestic/not shown",
    "colorAdditiveDisclosure": "exact text (e.g., 'Contains FD&C Yellow #5') or null",
    "sulfiteDeclaration": "exact text (e.g., 'Contains Sulfites') or null",
    "aspartameDeclaration": "exact text (e.g., 'PHENYLKETONURICS: CONTAINS PHENYLALANINE') or null"
  },
  "formatChecks": {
    "governmentWarningAllCaps": true/false/null (is "GOVERNMENT WARNING" in all capital letters?),
    "governmentWarningBold": true/false/null (does "GOVERNMENT WARNING" appear in bold/heavier weight than surrounding text?),
    "remainderBold": true/false/null (does the remainder of the warning statement after "GOVERNMENT WARNING:" appear in bold type? It should NOT be bold),
    "surgeonCapitalized": true/false/null (is the "S" in "Surgeon" capitalized?),
    "generalCapitalized": true/false/null (is the "G" in "General" capitalized?)
  },
  "confidenceNotes": "List any: obscured text, glare, uncertainty about specific values, small/hard-to-read text"
}

CRITICAL for healthWarningText:
- Copy the ENTIRE health warning text EXACTLY as it appears
- Preserve ALL capitalization exactly (GOVERNMENT WARNING must be extracted in caps if shown in caps)
- Preserve ALL punctuation exactly including colons, periods, and parentheses
- Include the complete text from "GOVERNMENT WARNING:" through "...may cause health problems."

IMPORTANT:
- Double-check the ALCOHOL CONTENT number - this is frequently misread
- The BRAND NAME is NOT the same as the PRODUCER NAME
- FANCIFUL NAME is optional - many beers don't have one
`;

/**
 * AI extraction prompt for DISTILLED SPIRITS
 */
export const SPIRITS_EXTRACTION_PROMPT = `
You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance expert analyzing a DISTILLED SPIRITS label image.

LABEL ANATOMY - Where to find each field:
- BRAND NAME: Largest, most prominent text - the product's marketing name
- FANCIFUL NAME: Optional secondary/stylized name, often near brand name
- CLASS/TYPE: Spirit category - usually near brand name or on neck label
  Examples: "Kentucky Straight Bourbon Whiskey", "Single Malt Scotch Whisky", 
  "Blanco Tequila", "London Dry Gin", "VSOP Cognac", "Vodka", "Silver Rum"
- ALCOHOL CONTENT: Usually displayed as BOTH percentage AND proof
  Examples: "40% ALC/VOL (80 PROOF)", "45% ALC./VOL.", "90 PROOF"
  Location: Often near net contents or bottom of front label
- NET CONTENTS: Standard sizes - "750 mL", "1 L", "1.75 L", "375 mL", "50 mL"
  Location: Usually bottom of label
- AGE STATEMENT: If present, often prominent - "Aged 12 Years", "10 Year Old"
  Note: NOT all spirits have age statements
- PRODUCER NAME/ADDRESS: Bottom of label, often with qualifier phrase
- HEALTH WARNING: Block of small text, often on back label
- COUNTRY OF ORIGIN: For imports - "Product of Scotland", "Hecho en Mexico"
- COMMODITY STATEMENT: What it's made from - "Distilled from Grain", "100% Blue Agave"
- COLOR DISCLOSURE: If artificially colored - "Colored with Caramel"

EXTRACTION RULES:
1. Extract text EXACTLY as shown - preserve capitalization, punctuation, spacing
   - CRITICAL: For ALL fields (brand name, fanciful name, class type, producer name, producer address, appellation, country of origin, etc.), preserve the exact capitalization as it appears on the label
   - If ANY field appears in ALL CAPS on the label (e.g., "FAR MOUNTAIN", "MOON MOUNTAIN DISTRICT"), extract it as ALL CAPS
   - If ANY field appears in Title Case (e.g., "Far Mountain", "Moon Mountain District"), extract it as Title Case
   - Do NOT normalize or change capitalization - extract exactly as shown on the label
2. BRAND NAME is NOT the same as PRODUCER NAME
   - Brand: "Jack Daniel's" / Producer: "Jack Daniel Distillery"
   - Brand: "Johnnie Walker" / Producer: "John Walker & Sons"
3. For ALCOHOL CONTENT: Spirits are typically 35-50% ABV (70-100 proof)
   - CRITICAL: Extract the COMPLETE text exactly as shown, including any prefix words like "ALCOHOL", "ALC.", or "ABV"
   - If the label says "ALCOHOL 40% BY VOLUME", extract it as "ALCOHOL 40% BY VOLUME" (not just "40% BY VOLUME")
   - Read numbers carefully: distinguish 40 vs 45, 80 vs 86
   - May show % only, proof only, or both
4. For AGE STATEMENT: Only extract if explicitly stated
   - "Aged 12 Years" ✓
   - "Aged in Oak Barrels" ✗ (no age = null)
5. For CLASS/TYPE: Be specific - include full designation
   - "Bourbon" → extract as "Kentucky Straight Bourbon Whiskey" if that's what's shown
   - "Scotch" → extract as "Single Malt Scotch Whisky" if that's what's shown
6. If a field is not visible or not present, use null

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact text or null",
    "fancifulName": "exact text or null",
    "classType": "exact spirit type designation or null",
    "alcoholContent": "exact COMPLETE text including any prefix words and % and/or proof (e.g., 'ALCOHOL 40% BY VOLUME', '40% ALC/VOL', 'ALC. 45% BY VOL.') or null - Extract the ENTIRE text including 'ALCOHOL', 'ALC.', or 'ABV' if present",
    "netContents": "exact text (e.g., '750 mL') or null",
    "producerName": "exact text or null",
    "producerAddress": "exact text (city, state/country) or null",
    "producerNamePhrase": "qualifier like 'Distilled By', 'Bottled By', 'Imported By' or null",
    "healthWarningText": "EXACT full text preserving ALL formatting, or null",
    "countryOfOrigin": "exact text or null if domestic/not shown",
    "ageStatement": "exact text (e.g., 'Aged 12 Years') or null if no age stated",
    "colorIngredientDisclosure": "exact text or null",
    "commodityStatement": "exact text (e.g., 'Distilled from Grain') or null"
  },
  "formatChecks": {
    "governmentWarningAllCaps": true/false/null,
    "governmentWarningBold": true/false/null,
    "remainderBold": true/false/null,
    "surgeonCapitalized": true/false/null,
    "generalCapitalized": true/false/null
  },
  "confidenceNotes": "List any: obscured text, glare, uncertainty about values, hard-to-read text"
}

CRITICAL for healthWarningText:
- Copy the ENTIRE health warning text EXACTLY as it appears
- Preserve ALL capitalization exactly (GOVERNMENT WARNING must be extracted in caps if shown in caps)
- Preserve ALL punctuation exactly including colons, periods, and parentheses
- Include the complete text from "GOVERNMENT WARNING:" through "...may cause health problems."

IMPORTANT:
- Double-check ALCOHOL CONTENT - common misreads: 40↔45, 80↔86, 90↔96
- AGE STATEMENT should be null unless a specific age/duration is stated
- CLASS/TYPE should be the complete designation as shown on the label
- BRAND NAME ≠ PRODUCER NAME (they are different fields)
`;

/**
 * AI extraction prompt for WINE
 */
export const WINE_EXTRACTION_PROMPT = `
You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance expert analyzing a WINE label image.

LABEL ANATOMY - Where to find each field:
- BRAND NAME: Winery or brand name - usually prominent at top of label
  Examples: "Kendall-Jackson", "Robert Mondavi", "Château Margaux"
- FANCIFUL NAME: Optional poetic/marketing name for specific wine
  Examples: "Vintner's Reserve", "Opus One", "The Prisoner"
- VARIETAL/CLASS TYPE: Grape variety OR wine type - often prominent
  Varietals: "Chardonnay", "Cabernet Sauvignon", "Pinot Noir", "Merlot", "Sauvignon Blanc"
  Types: "Red Wine", "White Wine", "Rosé", "Sparkling Wine", "Dessert Wine"
  European style: "Chianti", "Bordeaux", "Burgundy", "Champagne"
- APPELLATION: Geographic origin - can be very specific
  US: "Napa Valley", "Sonoma Coast", "Willamette Valley", "Finger Lakes"
  European: "Bordeaux AOC", "Chianti Classico DOCG", "Rioja DOCa", "Mosel"
- ALCOHOL CONTENT: Usually 11-15% for table wines, higher for fortified
  Location: Often at bottom of label, small text
  Format: "13.5% Alc/Vol", "ALC. 14.1% BY VOL."
- NET CONTENTS: Standard sizes - "750 mL", "1.5 L" (magnum), "375 mL" (half)
- PRODUCER NAME/ADDRESS: Winery name and location, often at bottom
- SULFITE DECLARATION: "Contains Sulfites" - required on most wines
  Location: Usually back label or bottom of front label, small text
- HEALTH WARNING: Block of small text, usually on back label
- ESTATE BOTTLED: Special designation - look for exact phrase "Estate Bottled"

WINE LABEL STRUCTURE:
Front label typically shows: Brand, Varietal, Appellation
Back label typically shows: Health Warning, Sulfites, Producer details, Alcohol %

EXTRACTION RULES:
1. Extract text EXACTLY as shown - preserve capitalization, punctuation, spacing
   - CRITICAL: For ALL fields (brand name, fanciful name, class type, producer name, producer address, appellation, country of origin, etc.), preserve the exact capitalization as it appears on the label
   - If ANY field appears in ALL CAPS on the label (e.g., "FAR MOUNTAIN", "MOON MOUNTAIN DISTRICT"), extract it as ALL CAPS
   - If ANY field appears in Title Case (e.g., "Far Mountain", "Moon Mountain District"), extract it as Title Case
   - Do NOT normalize or change capitalization - extract exactly as shown on the label
2. BRAND NAME ≠ PRODUCER NAME ≠ FANCIFUL NAME
   - Brand: "Stag's Leap Wine Cellars"
   - Fanciful Name: "Artemis"
   - Producer: "Stag's Leap Wine Cellars, Napa, CA"
3. VARIETAL vs APPELLATION - these are different:
   - Varietal: "Cabernet Sauvignon" (grape type)
   - Appellation: "Napa Valley" (where grapes are from)
4. ALCOHOL CONTENT: Wines typically 5.5-24% depending on type
   - CRITICAL: Extract the COMPLETE text exactly as shown, including any prefix words like "ALCOHOL", "ALC.", or "ABV"
   - If the label says "ALCOHOL 14% BY VOLUME", extract it as "ALCOHOL 14% BY VOLUME" (not just "14% BY VOLUME")
   - Table wine: 11-14.5%
   - High alcohol: 14.5-16%
   - Fortified (Port, Sherry): 17-24%
   - Read carefully - 13.5 vs 14.5 matters
6. APPELLATION: Extract the complete geographic designation
   - Include qualifiers: "DOCG", "AOC", "AVA" if shown
   - Preserve exact capitalization as shown on label (follows same rule as all other fields)
7. ESTATE BOTTLED: Only true if exact phrase appears
   - "Estate Bottled" ✓
   - "Estate Grown" ✓  
   - "Our Estate" ✗ (not the official designation)
8. If a field is not visible or not present, use null

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact winery/brand name or null",
    "fancifulName": "exact secondary wine name or null",
    "classType": "exact varietal or wine type or null",
    "appellation": "exact geographic designation with any qualifiers (AOC, DOCG, etc.) or null",
    "alcoholContent": "exact COMPLETE text including any prefix words (e.g., '13.5% Alc/Vol', 'ALCOHOL 14% BY VOLUME', 'ALC. 13.5% BY VOL.') or null - Extract the ENTIRE text including 'ALCOHOL', 'ALC.', or 'ABV' if present",
    "netContents": "exact text (e.g., '750 mL') or null",
    "producerName": "exact winery/bottler name or null",
    "producerAddress": "exact text (city, state/region, country) or null",
    "producerNamePhrase": "qualifier like 'Produced & Bottled By', 'Vinted & Bottled By', 'Imported By' or null",
    "healthWarningText": "EXACT full text preserving ALL formatting, or null",
    "countryOfOrigin": "exact text or null if domestic/not shown",
    "sulfiteDeclaration": "exact text (e.g., 'Contains Sulfites') or null",
    "colorIngredientDisclosure": "exact text or null",
    "foreignWinePercentage": "exact text if blended with foreign wine (e.g., '25% French Wine') or null",
    "isEstateBottled": true/false/null
  },
  "formatChecks": {
    "governmentWarningAllCaps": true/false/null,
    "governmentWarningBold": true/false/null,
    "remainderBold": true/false/null,
    "surgeonCapitalized": true/false/null,
    "generalCapitalized": true/false/null
  },
  "confidenceNotes": "List any: obscured text, glare, uncertainty about values, hard-to-read text"
}

CRITICAL for healthWarningText:
- Copy the ENTIRE health warning text EXACTLY as it appears
- Preserve ALL capitalization exactly (GOVERNMENT WARNING must be extracted in caps if shown in caps)
- Preserve ALL punctuation exactly including colons, periods, and parentheses
- Include the complete text from "GOVERNMENT WARNING:" through "...may cause health problems."

NOTE on foreignWinePercentage:
- This is required on blends of American and foreign wines if the label makes any reference to foreign wine
- Look for statements like "30% Grape Wine from Italy" or "Contains 25% French Wine"
- If the wine is entirely from one country (fully imported or fully domestic), this field may not be present

NOTE on isEstateBottled:
- Look for phrases like "Estate Bottled", "Estate Grown", "Estate Wine"
- This affects whether appellation is required

IMPORTANT:
- VARIETAL (classType) ≠ APPELLATION - don't confuse grape variety with region
- Double-check ALCOHOL CONTENT - common misreads: 13.5↔14.5, 12.5↔13.5
- SULFITE DECLARATION is almost always present - look carefully on back label
- BRAND NAME ≠ FANCIFUL NAME ≠ PRODUCER NAME (three separate fields)
`;

/**
 * Get the appropriate AI prompt for a beverage type
 */
export function getExtractionPrompt(beverageType: BeverageType): string {
  switch (beverageType) {
    case BeverageType.BEER:
      return BEER_EXTRACTION_PROMPT;
    case BeverageType.SPIRITS:
      return SPIRITS_EXTRACTION_PROMPT;
    case BeverageType.WINE:
      return WINE_EXTRACTION_PROMPT;
    default:
      throw new Error(`Unknown beverage type: ${beverageType}`);
  }
}
