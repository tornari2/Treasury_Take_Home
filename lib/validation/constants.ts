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
 */
export const NET_CONTENTS_PATTERNS = {
  metric: [/^\d+(\.\d+)?\s*m[Ll]$/, /^\d+(\.\d+)?\s*[Ll]$/, /^\d+(\.\d+)?\s*[Ll]iter(s)?$/i],
  usCustomary: [
    /^\d+(\.\d+)?\s*fl\.?\s*oz\.?$/i,
    /^\d+(\.\d+)?\s*pint(s)?$/i,
    /^\d+(\.\d+)?\s*quart(s)?$/i,
    /^\d+(\.\d+)?\s*gallon(s)?$/i,
  ],
};
