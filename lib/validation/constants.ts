// ============================================================
// TTB Validation Constants
// ============================================================

/**
 * Exact required health warning text
 * This ENTIRE text must appear EXACTLY on every label
 */
export const REQUIRED_HEALTH_WARNING =
  'GOVERNMENT WARNING: (1) ACCORDING TO THE SURGEON GENERAL, WOMEN SHOULD NOT DRINK ' +
  'ALCOHOLIC BEVERAGES DURING PREGNANCY BECAUSE OF THE RISK OF BIRTH DEFECTS. ' +
  '(2) CONSUMPTION OF ALCOHOLIC BEVERAGES IMPAIRS YOUR ABILITY TO DRIVE A CAR OR ' +
  'OPERATE MACHINERY, AND MAY CAUSE HEALTH PROBLEMS.';

/**
 * Valid alcohol content format patterns
 */
export const ALCOHOL_CONTENT_PATTERNS: RegExp[] = [
  /^\d+(\.\d+)?%\s*Alc\.?\s*\/?\s*Vol\.?$/i,
  /^Alcohol\s+\d+(\.\d+)?%\s*(by\s+)?Vol(ume)?\.?$/i,
  /^Alc\.?\s+\d+(\.\d+)?%\s*(by\s+)?Vol\.?$/i,
  /^\d+(\.\d+)?%\s*Alcohol\s+(by\s+)?Vol(ume)?\.?$/i,
];

/**
 * Valid net contents format patterns
 * Normalized variations:
 * - mL, ml., ML → treated as metric
 * - L, litre, liter → treated as liters
 * - fl. oz., fluid ounces → U.S. units
 */
export const NET_CONTENTS_PATTERNS = {
  metric: [
    /^\d+(\.\d+)?\s*m[Ll]\.?$/i, // mL, ml, ML, ml., ML. (case-insensitive)
    /^\d+(\.\d+)?\s*[Ll]\.?$/, // L, l, L.
    /^\d+(\.\d+)?\s*[Ll]iter(s)?$/i, // liter, litre, liters, litres
    /^\d+(\.\d+)?\s*[Ll]itre(s)?$/i, // litre, litres (British spelling)
  ],
  usCustomary: [
    /^\d+(\.\d+)?\s*fl\.?\s*oz\.?$/i, // fl oz, fl. oz., fl oz., fl. oz
    /^\d+(\.\d+)?\s*fluid\s+ounce(s)?$/i, // fluid ounce, fluid ounces
    /^\d+(\.\d+)?\s*pint(s)?$/i, // pint, pints
    /^\d+(\.\d+)?\s*quart(s)?$/i, // quart, quarts
    /^\d+(\.\d+)?\s*gallon(s)?$/i, // gallon, gallons
  ],
};

/**
 * Pattern to detect if a value contains a number but might be missing unit
 * Used to flag uncertainty for metric values
 */
export const NUMBER_WITHOUT_UNIT_PATTERN = /^\d+(\.\d+)?\s*$/;

/**
 * Authorized standards of fill for distilled spirits (27 CFR § 5.203)
 * All values in milliliters (mL) for consistent comparison
 */
export const SPIRITS_STANDARDS_OF_FILL_ML: number[] = [
  3750, // 3.75 Liters
  3000, // 3 Liters
  2000, // 2 Liters
  1800, // 1.8 Liters
  1750, // 1.75 Liters
  1500, // 1.5 Liters
  1000, // 1.00 Liter
  945,
  900,
  750,
  720,
  710,
  700,
  570,
  500,
  475,
  375,
  355,
  350,
  331,
  250,
  200,
  187,
  100,
  50,
];

/**
 * Authorized standards of fill for wine (27 CFR § 4.72)
 * All values in milliliters (mL) for consistent comparison
 * Note: Sizes larger than 3 liters (3000 mL) are allowed in even liters (4000, 5000, 6000, etc.)
 */
export const WINE_STANDARDS_OF_FILL_ML: number[] = [
  3000, // 3 liters
  2250, // 2.25 liters
  1800, // 1.8 liters
  1500, // 1.5 liters
  1000, // 1 liter
  750, // 750 milliliters
  720,
  700,
  620,
  600,
  568,
  550,
  500,
  473,
  375,
  360,
  355,
  330,
  300,
  250,
  200,
  187,
  180,
  100,
  50,
];

/**
 * US State name to abbreviation mapping
 * State names and their two-letter abbreviations are EQUIVALENT for verification purposes
 * Example: "ME" = "Maine", "California" = "CA"
 */
export const US_STATE_MAP: Record<string, string> = {
  // Abbreviation -> Full Name
  AL: 'alabama',
  AK: 'alaska',
  AZ: 'arizona',
  AR: 'arkansas',
  CA: 'california',
  CO: 'colorado',
  CT: 'connecticut',
  DE: 'delaware',
  FL: 'florida',
  GA: 'georgia',
  HI: 'hawaii',
  ID: 'idaho',
  IL: 'illinois',
  IN: 'indiana',
  IA: 'iowa',
  KS: 'kansas',
  KY: 'kentucky',
  LA: 'louisiana',
  ME: 'maine',
  MD: 'maryland',
  MA: 'massachusetts',
  MI: 'michigan',
  MN: 'minnesota',
  MS: 'mississippi',
  MO: 'missouri',
  MT: 'montana',
  NE: 'nebraska',
  NV: 'nevada',
  NH: 'new hampshire',
  NJ: 'new jersey',
  NM: 'new mexico',
  NY: 'new york',
  NC: 'north carolina',
  ND: 'north dakota',
  OH: 'ohio',
  OK: 'oklahoma',
  OR: 'oregon',
  PA: 'pennsylvania',
  RI: 'rhode island',
  SC: 'south carolina',
  SD: 'south dakota',
  TN: 'tennessee',
  TX: 'texas',
  UT: 'utah',
  VT: 'vermont',
  VA: 'virginia',
  WA: 'washington',
  WV: 'west virginia',
  WI: 'wisconsin',
  WY: 'wyoming',
  DC: 'district of columbia',
};

/**
 * Reverse mapping: Full name -> Abbreviation
 */
export const US_STATE_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_MAP).map(([abbr, name]) => [name, abbr])
);
