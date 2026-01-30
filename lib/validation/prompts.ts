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
  IMPORTANT: For IMPORTED beers, extract the name/address that follows "Imported by" (this is the importer, not the producer)
  For domestic beers, extract the producer name/address (may follow "Brewed by", "Bottled by", etc.)
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
   - DO NOT OMIT PREFIX WORDS - if the label shows "ALC. 5.0% BY VOL.", extract it as "ALC. 5.0% BY VOL." (NOT "5.0% BY VOL.")
   - If the label says "ALCOHOL 14% BY VOLUME", extract it as "ALCOHOL 14% BY VOLUME" (not just "14% BY VOLUME")
   - If the label says "ALC. 5.0% BY VOL.", extract it as "ALC. 5.0% BY VOL." (not just "5.0% BY VOL.")
   - Read the number carefully - distinguish 5 from 6, 4 from 9, etc.
3. For NET CONTENTS: Usually formatted as:
   - "12 FL OZ" or "12 fl oz" or "12 FL. OZ."
   - "355 mL" or "355ml"
   - CRITICAL: Extract ONLY the measurement value and unit (e.g., "750 mL", "12 FL OZ")
   - DO NOT include prefix words like "CONTENTS", "NET CONTENTS", "NET", etc.
   - If label shows "CONTENTS 750ML" or "NET CONTENTS 750 mL", extract only "750ML" or "750 mL" (without the word "CONTENTS" or "NET CONTENTS")
4. If a field is not visible or not present, use null
5. If text is partially obscured but you can reasonably infer it, extract it and note in confidenceNotes

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact text or null",
    "fancifulName": "exact text or null (optional - many beers don't have one)",
    "classType": "exact beer style text (e.g., 'Ale', 'Lager', 'India Pale Ale', 'Stout') or null",
    "netContents": "exact text (e.g., '12 FL OZ', '16 fl oz', '355 mL') or null - CRITICAL: Extract ONLY the measurement value and unit. Do NOT include prefix words like 'CONTENTS', 'NET CONTENTS', or 'NET'. If label shows 'CONTENTS 750ML', extract only '750ML'.",
    "alcoholContent": "exact COMPLETE text including any prefix words (e.g., '5.0% ALC/VOL', 'ALCOHOL 14% BY VOLUME', 'ALC. 5.0% BY VOL.', 'ABV 4.5%') or null - READ CAREFULLY, this is often small. CRITICAL: Extract the ENTIRE text including 'ALCOHOL', 'ALC.', or 'ABV' if present. If label shows 'ALC. 5.0% BY VOL.', extract as 'ALC. 5.0% BY VOL.' NOT '5.0% BY VOL.'",
    "producerName": "exact text of brewer/bottler name or null",
    "producerAddress": "exact text (city, state format) or null",
    "producerNamePhrase": "exact text of the phrase immediately preceding producer name/address. IMPORTANT: For IMPORTED beers only, extract 'Imported by' or similar phrase if present. For domestic beers, this field should be null (no phrase requirement). Extract the phrase only if the beer appears to be imported.",
    "healthWarningText": "EXACT full text preserving ALL formatting, or null",
    "countryOfOrigin": "exact text (e.g., 'Product of Mexico', 'Imported from Germany') or null if domestic/not shown",
    "colorAdditiveDisclosure": "exact text (e.g., 'Contains FD&C Yellow #5') or null",
    "sulfiteDeclaration": "exact text (e.g., 'Contains Sulfites', 'No sulfites added. Contains naturally occurring sulfites.') or null - IMPORTANT: If label states 'No sulfites added', extract the COMPLETE text including any accompanying phrase about naturally occurring sulfites",
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
  CRITICAL: Brand names can include spirit type words (e.g., "BLACK ROSE GIN", "GREY GOOSE VODKA", "JACK DANIEL'S WHISKEY")
  Extract the COMPLETE brand name as shown on the label - DO NOT truncate or remove spirit type words
  Examples: "BLACK ROSE GIN" (extract as "BLACK ROSE GIN", NOT "BLACK ROSE"), "GREY GOOSE VODKA", "JACK DANIEL'S"
- FANCIFUL NAME: Optional secondary/stylized name, often near brand name
  CRITICAL: Fanciful names can include spirit type words (e.g., "PEANUT BUTTER WHISKEY", "CHOCOLATE VODKA", "CARAMEL RUM")
  Extract the COMPLETE fanciful name as shown on the label - DO NOT truncate or remove spirit type words
  Examples: "PEANUT BUTTER WHISKEY" (extract as "PEANUT BUTTER WHISKEY", NOT "PEANUT BUTTER"), "CHOCOLATE VODKA", "CARAMEL RUM"
- CLASS/TYPE: Spirit category - usually near brand name or on neck label
  Examples: "Kentucky Straight Bourbon Whiskey", "Single Malt Scotch Whisky", 
  "Blanco Tequila", "London Dry Gin", "VSOP Cognac", "Vodka", "Silver Rum"
  NOTE: This is SEPARATE from the brand name - if brand name is "BLACK ROSE GIN", the class/type might be "Gin" or "London Dry Gin"
- ALCOHOL CONTENT: Usually displayed as BOTH percentage AND proof
  Examples: "40% ALC/VOL (80 PROOF)", "45% ALC./VOL.", "90 PROOF"
  Location: Often near net contents or bottom of front label
- NET CONTENTS: Standard sizes - "750 mL", "1 L", "1.75 L", "375 mL", "50 mL"
  Location: Usually bottom of label
  CRITICAL: Extract ONLY the measurement value and unit. Do NOT include prefix words like "CONTENTS", "NET CONTENTS", or "NET". If label shows "CONTENTS 750ML" or "NET CONTENTS 750 mL", extract only "750ML" or "750 mL".
- AGE STATEMENT: If present, often prominent - "Aged 12 Years", "10 Year Old"
  Note: NOT all spirits have age statements
- PRODUCER NAME/ADDRESS: Bottom of label, often with qualifier phrase
  IMPORTANT: For IMPORTED spirits, extract the name/address that follows "Imported By" (this is the importer, not the producer)
  For domestic spirits, extract the producer name/address (may follow "Bottled By", "Distilled By", etc.)
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
3. BRAND NAME CRITICAL RULE - Extract COMPLETE brand name:
   - Brand names can include spirit type words (GIN, VODKA, WHISKEY, RUM, TEQUILA, etc.)
   - Extract the ENTIRE brand name exactly as shown on the label
   - DO NOT truncate brand names even if they contain spirit type words
   - Examples:
     * If label shows "BLACK ROSE GIN" → Extract as "BLACK ROSE GIN" (NOT "BLACK ROSE")
     * If label shows "GREY GOOSE VODKA" → Extract as "GREY GOOSE VODKA" (NOT "GREY GOOSE")
     * If label shows "JACK DANIEL'S" → Extract as "JACK DANIEL'S" (complete as shown)
   - The class/type field is SEPARATE and contains the full spirit designation (e.g., "Gin", "London Dry Gin", "Vodka")
4. FANCIFUL NAME CRITICAL RULE - Extract COMPLETE fanciful name:
   - Fanciful names can include spirit type words (GIN, VODKA, WHISKEY, RUM, TEQUILA, etc.)
   - Extract the ENTIRE fanciful name exactly as shown on the label
   - DO NOT truncate fanciful names even if they contain spirit type words
   - Examples:
     * If label shows "PEANUT BUTTER WHISKEY" → Extract as "PEANUT BUTTER WHISKEY" (NOT "PEANUT BUTTER")
     * If label shows "CHOCOLATE VODKA" → Extract as "CHOCOLATE VODKA" (NOT "CHOCOLATE")
     * If label shows "CARAMEL RUM" → Extract as "CARAMEL RUM" (complete as shown)
   - The class/type field is SEPARATE and contains the full spirit designation
3. For ALCOHOL CONTENT: Spirits are typically 35-50% ABV (70-100 proof)
   - CRITICAL: Extract the COMPLETE text exactly as shown, including any prefix words like "ALCOHOL", "ALC.", or "ABV"
   - DO NOT OMIT PREFIX WORDS - if the label shows "ALC. 40% BY VOL.", extract it as "ALC. 40% BY VOL." (NOT "40% BY VOL.")
   - If the label says "ALCOHOL 40% BY VOLUME", extract it as "ALCOHOL 40% BY VOLUME" (not just "40% BY VOLUME")
   - If the label says "ALC. 45% BY VOL.", extract it as "ALC. 45% BY VOL." (not just "45% BY VOL.")
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
    "brandName": "exact text or null - CRITICAL: Extract the COMPLETE brand name as shown on the label. Brand names can include spirit type words (GIN, VODKA, WHISKEY, etc.) - DO NOT truncate. If label shows 'BLACK ROSE GIN', extract as 'BLACK ROSE GIN' (NOT 'BLACK ROSE'). Extract exactly as shown.",
    "fancifulName": "exact text or null - CRITICAL: Extract the COMPLETE fanciful name as shown on the label. Fanciful names can include spirit type words (GIN, VODKA, WHISKEY, etc.) - DO NOT truncate. If label shows 'PEANUT BUTTER WHISKEY', extract as 'PEANUT BUTTER WHISKEY' (NOT 'PEANUT BUTTER'). Extract exactly as shown.",
    "classType": "exact spirit type designation or null",
    "alcoholContent": "exact COMPLETE text including any prefix words and % and/or proof (e.g., 'ALCOHOL 40% BY VOLUME', '40% ALC/VOL', 'ALC. 45% BY VOL.') or null - CRITICAL: Extract the ENTIRE text including 'ALCOHOL', 'ALC.', or 'ABV' if present. If label shows 'ALC. 45% BY VOL.', extract as 'ALC. 45% BY VOL.' NOT '45% BY VOL.'",
    "netContents": "exact text (e.g., '750 mL') or null - CRITICAL: Extract ONLY the measurement value and unit. Do NOT include prefix words like 'CONTENTS', 'NET CONTENTS', or 'NET'. If label shows 'CONTENTS 750ML', extract only '750ML'.",
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
- BRAND NAME CRITICAL RULE: Extract the COMPLETE brand name as shown - brand names can include spirit type words
  * If label shows "BLACK ROSE GIN" → Extract as "BLACK ROSE GIN" (complete, NOT "BLACK ROSE")
  * If label shows "GREY GOOSE VODKA" → Extract as "GREY GOOSE VODKA" (complete, NOT "GREY GOOSE")
  * DO NOT truncate brand names - extract exactly as shown on the label
- FANCIFUL NAME CRITICAL RULE: Extract the COMPLETE fanciful name as shown - fanciful names can include spirit type words
  * If label shows "PEANUT BUTTER WHISKEY" → Extract as "PEANUT BUTTER WHISKEY" (complete, NOT "PEANUT BUTTER")
  * If label shows "CHOCOLATE VODKA" → Extract as "CHOCOLATE VODKA" (complete, NOT "CHOCOLATE")
  * DO NOT truncate fanciful names - extract exactly as shown on the label
- Double-check ALCOHOL CONTENT - common misreads: 40↔45, 80↔86, 90↔96
- AGE STATEMENT should be null unless a specific age/duration is stated
- CLASS/TYPE should be the complete designation as shown on the label (this is SEPARATE from brand name and fanciful name)
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
- VARIETAL/CLASS TYPE: Grape variety OR wine type - often prominent
  Varietals: "Chardonnay", "Cabernet Sauvignon", "Pinot Noir", "Merlot", "Sauvignon Blanc", "Khikhvi", "Rkatsiteli", "Saperavi"
  Types: "Red Wine", "White Wine", "Rosé", "Sparkling Wine", "Dessert Wine"
  European style: "Chianti", "Bordeaux", "Burgundy", "Champagne"
  CRITICAL PRIORITY RULE: If BOTH a varietal (grape name) AND a class/type (e.g., "White Wine", "Red Wine") appear on the label, ALWAYS extract the VARIETAL, not the class/type. Varietals take precedence over generic class/type designations.
- APPELLATION: Geographic origin - can be very specific
  US: "Napa Valley", "Sonoma Coast", "Willamette Valley", "Finger Lakes", or state names like "Virginia", "California", "Oregon", "New York" when listed prominently and separately
  European: "Bordeaux AOC", "Chianti Classico DOCG", "Rioja DOCa", "Mosel"
  CRITICAL: State names are valid appellations when they appear prominently and separately on the label (not just in the producer address)
- ALCOHOL CONTENT: Usually 11-15% for table wines, higher for fortified
  Location: Often at bottom of label, small text
  Format: "13.5% Alc/Vol", "ALC. 14.1% BY VOL.", "ALC. 12.5% BY VOL.", "ALCOHOL 14% BY VOLUME"
  CRITICAL: Extract the complete text including prefix words like "ALC." or "ALCOHOL"
- NET CONTENTS: Standard sizes - "750 mL", "1.5 L" (magnum), "375 mL" (half)
  CRITICAL: Extract ONLY the measurement value and unit. Do NOT include prefix words like "CONTENTS", "NET CONTENTS", or "NET". If label shows "CONTENTS 750ML" or "NET CONTENTS 750 mL", extract only "750ML" or "750 mL".
- PRODUCER NAME/ADDRESS: Winery name and location, often at bottom
  IMPORTANT: For IMPORTED wines, extract the name/address that follows "Imported By" (this is the importer, not the producer)
  For domestic wines, extract the producer name/address (may follow "Bottled By", "Produced By", etc.)
- SULFITE DECLARATION: "Contains Sulfites" - required on most wines
  Location: Usually back label or bottom of front label, small text
  IMPORTANT: If label states "No sulfites added", extract the COMPLETE text including any accompanying phrase like "contains naturally occurring sulfites" or "may contain naturally occurring sulfites". Extract the full statement as it appears on the label.
- HEALTH WARNING: Block of small text, usually on back label
- ESTATE BOTTLED: Special designation - look for exact phrase "Estate Bottled"

WINE LABEL STRUCTURE:
Front label typically shows: Brand, Varietal, Appellation
Back label typically shows: Health Warning, Sulfites, Producer details, Alcohol %

EXTRACTION RULES:
1. Extract text EXACTLY as shown - preserve capitalization, punctuation, spacing
   - CRITICAL: For ALL fields (brand name, class type, producer name, producer address, appellation, country of origin, etc.), preserve the exact capitalization as it appears on the label
   - If ANY field appears in ALL CAPS on the label (e.g., "FAR MOUNTAIN", "MOON MOUNTAIN DISTRICT"), extract it as ALL CAPS
   - If ANY field appears in Title Case (e.g., "Far Mountain", "Moon Mountain District"), extract it as Title Case
   - Do NOT normalize or change capitalization - extract exactly as shown on the label
2. BRAND NAME ≠ PRODUCER NAME
   - Brand: "Stag's Leap Wine Cellars"
   - Producer: "Stag's Leap Wine Cellars, Napa, CA"
3. VARIETAL vs CLASS/TYPE vs APPELLATION - these are DIFFERENT and MUST NOT be confused:
   - VARIETAL (classType field): Grape variety name - examples: "Cabernet Sauvignon", "Khikhvi", "Chardonnay", "Pinot Noir", "Merlot", "Sauvignon Blanc"
     * These are GRAPE NAMES, typically 1-2 words
     * Examples: "CABERNET SAUVIGNON", "Chardonnay", "Pinot Noir"
     * DO NOT confuse with geographic locations
   - CLASS/TYPE: Generic wine category - examples: "Red Wine", "White Wine", "Dry Wine" (generic wine category)
   - APPELLATION (appellation field): Geographic origin designation - examples: "Napa Valley", "Sonoma Coast", "MOON MOUNTAIN DISTRICT SONOMA COUNTY", "Willamette Valley"
     * These are GEOGRAPHIC LOCATIONS, can be multi-word (e.g., "MOON MOUNTAIN DISTRICT SONOMA COUNTY")
     * Examples: "MOON MOUNTAIN DISTRICT SONOMA COUNTY", "Napa Valley", "Sonoma Coast", "California", "Virginia"
     * DO NOT confuse with grape variety names
   CRITICAL DISTINCTION:
   - If you see "CABERNET SAUVIGNON" → This is a VARIETAL (grape name) → Extract as classType
   - If you see "MOON MOUNTAIN DISTRICT SONOMA COUNTY" → This is an APPELLATION (geographic location) → Extract as appellation
   - If you see "Napa Valley" → This is an APPELLATION (geographic location) → Extract as appellation
   - If you see "Chardonnay" → This is a VARIETAL (grape name) → Extract as classType
   CRITICAL: If both a varietal AND a class/type appear on the label, extract the VARIETAL (grape name), not the class/type. For example, if label shows "Khikhvi" and "White Dry Wine", extract "Khikhvi" as the classType.
4. ALCOHOL CONTENT: Wines typically 5.5-24% depending on type
   - CRITICAL: Extract the COMPLETE text exactly as shown, including any prefix words like "ALCOHOL", "ALC.", or "ABV"
   - DO NOT OMIT PREFIX WORDS - if the label shows "ALC. 12.5% BY VOL.", extract it as "ALC. 12.5% BY VOL." (NOT "12.5% BY VOL.")
   - If the label says "ALCOHOL 14% BY VOLUME", extract it as "ALCOHOL 14% BY VOLUME" (not just "14% BY VOLUME")
   - If the label says "ALC. 13.5% BY VOL.", extract it as "ALC. 13.5% BY VOL." (not just "13.5% BY VOL.")
   - Common formats: "13.5% Alc/Vol", "ALC. 12.5% BY VOL.", "ALCOHOL 14% BY VOLUME", "Alc. 13.5% by Vol."
   - Table wine: 11-14.5%
   - High alcohol: 14.5-16%
   - Fortified (Port, Sherry): 17-24%
   - Read carefully - 13.5 vs 14.5 matters
6. APPELLATION: Extract the complete geographic designation
   - US appellations can be: AVA names (e.g., "Napa Valley", "Sonoma Coast"), state names (e.g., "Virginia", "California", "Oregon"), or regions
   - State names like "VIRGINIA", "CALIFORNIA", "OREGON", "NEW YORK" are valid appellations when listed separately on the label
   - Look for geographic designations that appear prominently and separately from other text
   - Include qualifiers: "DOCG", "AOC", "AVA" if shown
   - Preserve exact capitalization as shown on label (follows same rule as all other fields)
   - CRITICAL: If a state name appears prominently on the label (separate from producer address), extract it as the appellation
7. ESTATE BOTTLED: Only true if exact phrase appears
   - "Estate Bottled" ✓
   - "Estate Grown" ✓  
   - "Our Estate" ✗ (not the official designation)
8. If a field is not visible or not present, use null

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact winery/brand name or null",
    "classType": "exact varietal (grape name) or wine type or null - CRITICAL: Extract GRAPE VARIETY NAMES here (e.g., 'CABERNET SAUVIGNON', 'Chardonnay', 'Pinot Noir', 'Khikhvi'). These are GRAPE NAMES, NOT geographic locations. If both a varietal (grape name like 'Khikhvi', 'Chardonnay', 'CABERNET SAUVIGNON') and a class/type (like 'White Wine', 'Red Wine') appear on the label, extract the VARIETAL, not the class/type. Varietals always take precedence. DO NOT confuse with appellations - grape names go here, geographic locations go in appellation field.",
    "appellation": "exact geographic designation with any qualifiers (AOC, DOCG, etc.) or null - CRITICAL: Extract GEOGRAPHIC LOCATIONS here (e.g., 'MOON MOUNTAIN DISTRICT SONOMA COUNTY', 'Napa Valley', 'Sonoma Coast', 'California', 'Virginia'). These are WHERE THE GRAPES ARE FROM, NOT grape variety names. For US wines, state names like 'Virginia', 'California', 'Oregon' are valid appellations when listed prominently and separately on the label. Extract state names if they appear as geographic designations separate from producer address. DO NOT confuse with varietals - geographic locations go here, grape names go in classType field.",
    "alcoholContent": "exact COMPLETE text including any prefix words (e.g., '13.5% Alc/Vol', 'ALCOHOL 14% BY VOLUME', 'ALC. 13.5% BY VOL.', 'ALC. 12.5% BY VOL.') or null - CRITICAL: Extract the ENTIRE text including 'ALCOHOL', 'ALC.', or 'ABV' if present. If label shows 'ALC. 12.5% BY VOL.', extract as 'ALC. 12.5% BY VOL.' NOT '12.5% BY VOL.'",
    "netContents": "exact text (e.g., '750 mL') or null - CRITICAL: Extract ONLY the measurement value and unit. Do NOT include prefix words like 'CONTENTS', 'NET CONTENTS', or 'NET'. If label shows 'CONTENTS 750ML', extract only '750ML'.",
    "producerName": "exact winery/bottler name or null",
    "producerAddress": "exact text (city, state/region, country) or null",
    "producerNamePhrase": "qualifier like 'Produced & Bottled By', 'Vinted & Bottled By', 'Imported By' or null",
    "healthWarningText": "EXACT full text preserving ALL formatting, or null",
    "countryOfOrigin": "exact text or null if domestic/not shown",
    "sulfiteDeclaration": "exact text (e.g., 'Contains Sulfites', 'No sulfites added. Contains naturally occurring sulfites.') or null - IMPORTANT: If label states 'No sulfites added', extract the COMPLETE text including any accompanying phrase about naturally occurring sulfites",
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
- VARIETAL (classType) ≠ APPELLATION - CRITICAL: These are COMPLETELY DIFFERENT fields and MUST NOT be confused:
  * VARIETAL (classType): Grape variety names like "CABERNET SAUVIGNON", "Chardonnay", "Pinot Noir" → Extract as classType
  * APPELLATION: Geographic locations like "MOON MOUNTAIN DISTRICT SONOMA COUNTY", "Napa Valley", "California" → Extract as appellation
  * Example: If label shows "CABERNET SAUVIGNON" and "MOON MOUNTAIN DISTRICT SONOMA COUNTY":
    - "CABERNET SAUVIGNON" is the VARIETAL (grape name) → Extract as classType
    - "MOON MOUNTAIN DISTRICT SONOMA COUNTY" is the APPELLATION (geographic location) → Extract as appellation
  * DO NOT swap these - grape names belong in classType, geographic locations belong in appellation
- VARIETAL PRIORITY: If both a varietal (grape name) and a class/type (e.g., "White Wine") appear, extract the VARIETAL, not the class/type
- Double-check ALCOHOL CONTENT - common misreads: 13.5↔14.5, 12.5↔13.5
- SULFITE DECLARATION is almost always present - look carefully on back label
- BRAND NAME ≠ PRODUCER NAME (two separate fields)
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

/**
 * Get beverage-specific extraction instructions for the generic prompt
 * These are instructions that should be appended to the base extraction prompt
 * Returns empty string if no beverage-specific instructions needed
 */
export function getBeverageSpecificInstructions(beverageType: 'spirits' | 'wine' | 'beer'): string {
  switch (beverageType) {
    case 'wine':
      return `

CRITICAL WINE-SPECIFIC RULES:
- VARIETAL vs CLASS/TYPE vs APPELLATION - CRITICAL DISTINCTION (DO NOT CONFUSE THESE):
  * VARIETAL (class_type field): Grape variety name - examples: "Khikhvi", "Chardonnay", "Cabernet Sauvignon", "CABERNET SAUVIGNON", "Rkatsiteli", "Saperavi", "Pinot Noir"
    - These are GRAPE NAMES (what type of grape)
    - Typically 1-2 words
    - Extract as class_type field (JSON field name: "class_type")
    - Examples: "CABERNET SAUVIGNON" = VARIETAL → Extract as class_type
  * CLASS/TYPE: Generic wine category - examples: "White Wine", "Red Wine", "Dry Wine", "White Dry Wine"
    - Only extract if NO varietal is present
  * APPELLATION (appellation_of_origin field): Geographic origin designation - examples: "Napa Valley", "Sonoma Coast", "MOON MOUNTAIN DISTRICT SONOMA COUNTY", "Willamette Valley", "California", "Virginia"
    - These are GEOGRAPHIC LOCATIONS (where grapes are from)
    - Can be multi-word (e.g., "MOON MOUNTAIN DISTRICT SONOMA COUNTY")
    - Extract as appellation_of_origin field (JSON field name: "appellation_of_origin")
    - Examples: "MOON MOUNTAIN DISTRICT SONOMA COUNTY" = APPELLATION → Extract as appellation_of_origin
- CRITICAL: DO NOT confuse VARIETAL with APPELLATION:
  * "CABERNET SAUVIGNON" = VARIETAL (grape name) → Extract as class_type
  * "MOON MOUNTAIN DISTRICT SONOMA COUNTY" = APPELLATION (geographic location) → Extract as appellation_of_origin
  * "Chardonnay" = VARIETAL (grape name) → Extract as class_type
  * "Napa Valley" = APPELLATION (geographic location) → Extract as appellation_of_origin
- CRITICAL PRIORITY RULE FOR class_type FIELD: If BOTH a varietal (grape name) AND a class/type (e.g., "White Wine", "Red Wine", "White Dry Wine") appear on the label, you MUST extract the VARIETAL, NOT the class/type. Varietals ALWAYS take precedence over generic class/type designations.
- CRITICAL EXAMPLES:
  * If label shows "Khikhvi" and "White Dry Wine", extract "Khikhvi" as class_type (NOT "White Dry Wine")
  * If label shows "Chardonnay" and "White Wine", extract "Chardonnay" as class_type (NOT "White Wine")
  * If label shows "Cabernet Sauvignon" and "Red Wine", extract "Cabernet Sauvignon" as class_type (NOT "Red Wine")
  * If label shows "CABERNET SAUVIGNON" and "MOON MOUNTAIN DISTRICT SONOMA COUNTY":
    - Extract "CABERNET SAUVIGNON" as class_type (varietal/grape name)
    - Extract "MOON MOUNTAIN DISTRICT SONOMA COUNTY" as appellation_of_origin (geographic location)
- DO NOT SWAP THESE - grape names belong in class_type, geographic locations belong in appellation_of_origin
- Only extract the class/type if NO varietal is present on the label.
- This is a CRITICAL requirement - failure to follow this rule will cause validation errors.

- APPELLATION OF ORIGIN (appellation_of_origin field): CRITICAL - Extract geographic origin designation
  * US appellations can be: AVA names (e.g., "Napa Valley", "Sonoma Coast", "Willamette Valley", "Finger Lakes"), state names (e.g., "Virginia", "California", "Oregon", "New York"), or regions
  * State names like "VIRGINIA", "CALIFORNIA", "OREGON", "NEW YORK" are valid appellations when listed prominently and separately on the label (not just in the producer address)
  * Look for geographic designations that appear prominently and separately from other text, often on the front label near the varietal/brand
  * Include qualifiers: "DOCG", "AOC", "AVA" if shown
  * Preserve exact capitalization as shown on label (e.g., if label shows "VIRGINIA" in all caps, extract as "VIRGINIA")
  * CRITICAL: If a state name appears prominently on the label (separate from producer address), extract it as the appellation
  * Examples: "Napa Valley", "Sonoma Coast", "MOON MOUNTAIN DISTRICT SONOMA COUNTY", "Virginia", "California", "Bordeaux AOC", "Chianti Classico DOCG"
  * DO NOT confuse with varietals - geographic locations belong in appellation_of_origin field, grape names belong in class_type field

- ALCOHOL CONTENT: Wines typically 5.5-24% depending on type
  * Table wine: 11-14.5%
  * High alcohol: 14.5-16%
  * Fortified (Port, Sherry): 17-24%
  * Read carefully - 13.5 vs 14.5 matters

- SULFITE DECLARATION: Required on most wines - look carefully on back label or bottom of front label`;

    case 'beer':
      return `

CRITICAL BEER-SPECIFIC RULES:
- BRAND NAME: CRITICAL - Extract COMPLETE brand name as shown
  * Brand names often include words like "BREWERY", "BREWING COMPANY", "BREWING CO", "BREWING", etc.
  * These words may appear directly below or on a separate line from the main brand name text
  * Extract the ENTIRE brand name including all parts, even if they span multiple lines
  * Examples:
    - If label shows "FONTA FLORA" on one line and "BREWERY" directly below → Extract as "FONTA FLORA BREWERY" (complete)
    - If label shows "ABC BREWING COMPANY" → Extract as "ABC BREWING COMPANY" (complete, not just "ABC")
  * DO NOT truncate brand names - extract exactly as shown, including all words that are part of the brand name
  * Preserve exact capitalization as shown on label

- ALCOHOL CONTENT: Look carefully at small text. Common formats:
  * "X.X% ALC/VOL" or "X.X% ALC./VOL."
  * "ALC. X.X% BY VOL." or "ALCOHOL X.X% BY VOLUME"
  * "ABV X.X%" or "X.X% ABV"
  * Read the number carefully - distinguish 5 from 6, 4 from 9, etc.

- NET CONTENTS: Usually formatted as:
  * "12 FL OZ" or "12 fl oz" or "12 FL. OZ."
  * "355 mL" or "355ml"

- FANCIFUL NAME: Optional - many beers don't have one. Only extract if present.`;

    case 'spirits':
      return `

CRITICAL SPIRITS-SPECIFIC RULES:
- BRAND NAME: CRITICAL - Extract COMPLETE brand name as shown
  * Brand names can include spirit type words (GIN, VODKA, WHISKEY, RUM, TEQUILA, etc.)
  * Extract the ENTIRE brand name exactly as shown on the label - DO NOT truncate
  * Examples:
    - If label shows "BLACK ROSE GIN" → Extract as "BLACK ROSE GIN" (NOT "BLACK ROSE")
    - If label shows "GREY GOOSE VODKA" → Extract as "GREY GOOSE VODKA" (NOT "GREY GOOSE")
    - If label shows "JACK DANIEL'S" → Extract as "JACK DANIEL'S" (complete as shown)
  * The class/type field is SEPARATE and contains the full spirit designation (e.g., "Gin", "London Dry Gin", "Vodka")
  * DO NOT remove spirit type words from brand names - extract exactly as shown
- FANCIFUL NAME: Optional secondary/stylized name, often near brand name
  * CRITICAL: Fanciful names can include spirit type words (GIN, VODKA, WHISKEY, RUM, TEQUILA, etc.)
  * Extract the COMPLETE fanciful name exactly as shown on the label - DO NOT truncate
  * Examples:
    - If label shows "PEANUT BUTTER WHISKEY" → Extract as "PEANUT BUTTER WHISKEY" (NOT "PEANUT BUTTER")
    - If label shows "CHOCOLATE VODKA" → Extract as "CHOCOLATE VODKA" (NOT "CHOCOLATE")
    - If label shows "CARAMEL RUM" → Extract as "CARAMEL RUM" (complete as shown)
  * Common examples: "REPOSADO", "SINGLE BARREL SELECT", "AÑEJO", "BLANCO", "SILVER", "GOLD", "PEANUT BUTTER WHISKEY"
  * Extract exactly as shown on label, preserving ALL CAPS if shown in caps
  * Use null if not present - not all spirits have a fanciful name
  * The class/type field is SEPARATE and contains the full spirit designation

- ALCOHOL CONTENT: Spirits are typically 35-50% ABV (70-100 proof)
  * May show % only, proof only, or both
  * Read numbers carefully: distinguish 40 vs 45, 80 vs 86, 90 vs 96
  * Common misreads: 40↔45, 80↔86, 90↔96

- CLASS/TYPE: Be specific - include full designation as shown
  * "Bourbon" → extract as "Kentucky Straight Bourbon Whiskey" if that's what's shown
  * "Scotch" → extract as "Single Malt Scotch Whisky" if that's what's shown

- AGE STATEMENT: Only extract if explicitly stated with a specific age/duration
  * "Aged 12 Years" ✓
  * "Aged in Oak Barrels" ✗ (no age = null)

- BRAND NAME is NOT the same as PRODUCER NAME (they are different fields)`;

    default:
      return '';
  }
}

/**
 * Get beverage-specific field description for class_type field
 */
export function getClassTypeFieldDescription(beverageType: 'spirits' | 'wine' | 'beer'): string {
  switch (beverageType) {
    case 'wine':
      return 'Varietal (grape name like "CABERNET SAUVIGNON", "Khikhvi", "Chardonnay", "Pinot Noir") OR class/type (like "White Wine") - CRITICAL: Extract GRAPE VARIETY NAMES here. These are GRAPE NAMES, NOT geographic locations. If both varietal (grape name) and class/type appear, extract the VARIETAL, not the class/type. DO NOT confuse with appellation_of_origin - grape names go here, geographic locations go in appellation_of_origin field. Examples: "CABERNET SAUVIGNON" = varietal → extract as class_type, "MOON MOUNTAIN DISTRICT SONOMA COUNTY" = appellation → extract as appellation_of_origin';
    case 'beer':
      return 'Beer style (e.g., "Ale", "Lager", "India Pale Ale", "Stout")';
    case 'spirits':
      return 'Spirit type designation (e.g., "Kentucky Straight Bourbon Whiskey", "Vodka", "Gin")';
    default:
      return 'Class/type designation';
  }
}
