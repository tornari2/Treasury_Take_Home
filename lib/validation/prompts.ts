// ============================================================
// TTB AI Extraction Prompts
// ============================================================

import { BeverageType } from './types';

/**
 * AI extraction prompt for BEER / MALT BEVERAGES
 */
export const BEER_EXTRACTION_PROMPT = `
You are analyzing a BEER / MALT BEVERAGE label image. Extract all visible text for the following fields.

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact text or null if not found",
    "fancifulName": "exact text of any fanciful/distinctive name, or null if not present",
    "classType": "exact text (e.g., 'Ale', 'Lager', 'India Pale Ale', 'Stout') or null",
    "netContents": "exact text (e.g., '12 fl oz', '16 fl oz') or null",
    "producerName": "exact text of brewer/bottler name or null",
    "producerAddress": "exact text (city, state) or null",
    "healthWarningText": "exact full text of health warning, preserve ALL caps and punctuation exactly as shown, or null",
    "countryOfOrigin": "exact text (e.g., 'Product of Mexico', 'Imported from Germany') or null if not present",
    "alcoholContent": "exact text (e.g., '5% Alc/Vol') or null if not present",
    "colorAdditiveDisclosure": "exact text (e.g., 'Contains FD&C Yellow #5') or null",
    "sulfiteDeclaration": "exact text (e.g., 'Contains Sulfites') or null",
    "aspartameDeclaration": "exact text (e.g., 'PHENYLKETONURICS: CONTAINS PHENYLALANINE') or null"
  },
  "formatChecks": {
    "governmentWarningAllCaps": true/false/null (is "GOVERNMENT WARNING" in all capital letters?),
    "governmentWarningBold": true/false/null (does "GOVERNMENT WARNING" appear in bold/heavier weight than surrounding text?),
    "surgeonCapitalized": true/false/null (is the "S" in "Surgeon" capitalized?),
    "generalCapitalized": true/false/null (is the "G" in "General" capitalized?)
  },
  "confidenceNotes": "any uncertainties, glare, obscured text, etc."
}

CRITICAL for healthWarningText:
- Copy the ENTIRE health warning text EXACTLY as it appears
- Preserve ALL capitalization exactly (GOVERNMENT WARNING must be extracted in caps if shown in caps)
- Preserve ALL punctuation exactly including colons, periods, and parentheses
- Include the complete text from "GOVERNMENT WARNING:" through "...may cause health problems."
`;

/**
 * AI extraction prompt for DISTILLED SPIRITS
 */
export const SPIRITS_EXTRACTION_PROMPT = `
You are analyzing a DISTILLED SPIRITS label image. Extract all visible text for the following fields.

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact text or null if not found",
    "fancifulName": "exact text of any fanciful/distinctive name, or null if not present",
    "classType": "exact text (e.g., 'Kentucky Straight Bourbon Whiskey', 'Vodka', 'London Dry Gin', 'Blanco Tequila') or null",
    "alcoholContent": "exact text (e.g., '40% Alc/Vol', '80 Proof') or null",
    "netContents": "exact text (e.g., '750 mL', '1 L') or null",
    "producerName": "exact text of distiller/bottler name or null",
    "producerAddress": "exact text (city, state) or null",
    "healthWarningText": "exact full text of health warning, preserve ALL caps and punctuation exactly as shown, or null",
    "countryOfOrigin": "exact text (e.g., 'Product of Scotland', 'Imported from Ireland') or null if not present",
    "ageStatement": "exact text (e.g., 'Aged 12 Years', '4 Years Old') or null",
    "colorIngredientDisclosure": "exact text (e.g., 'Colored with Caramel', 'Artificially Colored') or null",
    "commodityStatement": "exact text (e.g., 'Distilled from Grain', '100% Agave') or null"
  },
  "formatChecks": {
    "governmentWarningAllCaps": true/false/null (is "GOVERNMENT WARNING" in all capital letters?),
    "governmentWarningBold": true/false/null (does "GOVERNMENT WARNING" appear in bold/heavier weight than surrounding text?),
    "surgeonCapitalized": true/false/null (is the "S" in "Surgeon" capitalized?),
    "generalCapitalized": true/false/null (is the "G" in "General" capitalized?)
  },
  "confidenceNotes": "any uncertainties, glare, obscured text, etc."
}

CRITICAL for healthWarningText:
- Copy the ENTIRE health warning text EXACTLY as it appears
- Preserve ALL capitalization exactly (GOVERNMENT WARNING must be extracted in caps if shown in caps)
- Preserve ALL punctuation exactly including colons, periods, and parentheses
- Include the complete text from "GOVERNMENT WARNING:" through "...may cause health problems."
`;

/**
 * AI extraction prompt for WINE
 */
export const WINE_EXTRACTION_PROMPT = `
You are analyzing a WINE label image. Extract all visible text for the following fields.

Return a JSON object with this exact structure:

{
  "extraction": {
    "brandName": "exact text or null if not found",
    "fancifulName": "exact text of any fanciful/distinctive name, or null if not present",
    "classType": "exact text of the varietal or wine type (e.g., 'Chardonnay', 'Cabernet Sauvignon', 'Red Wine', 'Sparkling Wine', 'Rosé', 'Pinot Noir') or null",
    "alcoholContent": "exact text (e.g., '13.5% Alc/Vol') or null",
    "netContents": "exact text (e.g., '750 mL', '1.5 L') or null",
    "producerName": "exact text of winery/bottler name or null",
    "producerAddress": "exact text (city, state) or null",
    "healthWarningText": "exact full text of health warning, preserve ALL caps and punctuation exactly as shown, or null",
    "countryOfOrigin": "exact text (e.g., 'Product of France', 'Product of Italy') or null if not present",
    "appellation": "exact text of geographic origin (e.g., 'Napa Valley', 'Sonoma Coast', 'Chianti Classico DOCG', 'Bordeaux', 'Willamette Valley') or null",
    "vintageDate": "exact text of the vintage year (e.g., '2019', '2021', 'NV' for non-vintage) or null if not present",
    "sulfiteDeclaration": "exact text (e.g., 'Contains Sulfites') or null",
    "colorIngredientDisclosure": "exact text or null",
    "foreignWinePercentage": "exact text of any statement about percentage and origin of foreign wine in a blend (e.g., '30% Grape Wine from Italy', '25% French Wine') or null if not present",
    "isEstateBottled": true/false/null (true if the label contains 'Estate Bottled' or similar estate designation)
  },
  "formatChecks": {
    "governmentWarningAllCaps": true/false/null (is "GOVERNMENT WARNING" in all capital letters?),
    "governmentWarningBold": true/false/null (does "GOVERNMENT WARNING" appear in bold/heavier weight than surrounding text?),
    "surgeonCapitalized": true/false/null (is the "S" in "Surgeon" capitalized?),
    "generalCapitalized": true/false/null (is the "G" in "General" capitalized?)
  },
  "confidenceNotes": "any uncertainties, glare, obscured text, etc."
}

CRITICAL for healthWarningText:
- Copy the ENTIRE health warning text EXACTLY as it appears
- Preserve ALL capitalization exactly (GOVERNMENT WARNING must be extracted in caps if shown in caps)
- Preserve ALL punctuation exactly including colons, periods, and parentheses
- Include the complete text from "GOVERNMENT WARNING:" through "...may cause health problems."

NOTE on classType (Varietal):
- This is the grape variety or wine type designation
- Examples: "Chardonnay", "Cabernet Sauvignon", "Merlot", "Pinot Grigio", "Red Wine", "White Wine"
- Extract exactly as it appears on the label

NOTE on foreignWinePercentage:
- This is required on blends of American and foreign wines if the label makes any reference to foreign wine
- Look for statements like "30% Grape Wine from Italy" or "Contains 25% French Wine"
- If the wine is entirely from one country (fully imported or fully domestic), this field may not be present

NOTE on isEstateBottled:
- Look for phrases like "Estate Bottled", "Estate Grown", "Estate Wine"
- This affects whether appellation is required
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
