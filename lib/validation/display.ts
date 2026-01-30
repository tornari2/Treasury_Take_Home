// ============================================================
// Display Helpers and Constants
// ============================================================

import { MatchStatus, BeverageType } from './types';

export const FIELD_LABELS: Record<string, string> = {
  brandName: 'Brand Name',
  fancifulName: 'Fanciful Name',
  classType: 'Class/Type',
  alcoholContent: 'Alcohol Content',
  netContents: 'Net Contents',
  producerNameAddress: 'Producer Name & Address',
  healthWarning: 'Health Warning Statement',
  countryOfOrigin: 'Country of Origin',
  appellation: 'Appellation of Origin',
  vintageDate: 'Vintage Date',
  sulfiteDeclaration: 'Sulfite Declaration',
  ageStatement: 'Age Statement',
  commodityStatement: 'Commodity Statement',
  colorAdditiveDisclosure: 'Color Additive Disclosure',
  colorIngredientDisclosure: 'Color Ingredient Disclosure',
  aspartameDeclaration: 'Aspartame Declaration',
  foreignWinePercentage: 'Foreign Wine Percentage',
};

/**
 * Get field label with beverage type-specific overrides
 */
export function getFieldLabel(fieldName: string, beverageType?: string | BeverageType): string {
  // Wine-specific label override for classType
  if (fieldName === 'classType' || fieldName === 'class_type') {
    if (beverageType === BeverageType.WINE || beverageType === 'wine') {
      return 'Varietal (or Class/Type)';
    }
  }

  // Convert snake_case to camelCase if needed
  const camelCaseField = fieldName.includes('_')
    ? fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    : fieldName;

  // Handle special field name mappings
  if (fieldName === 'appellation_of_origin' || camelCaseField === 'appellationOfOrigin') {
    return FIELD_LABELS['appellation'] || 'Appellation of Origin';
  }

  // If found in FIELD_LABELS, return it
  if (FIELD_LABELS[camelCaseField]) {
    return FIELD_LABELS[camelCaseField];
  }

  // Fallback: convert snake_case to title case
  return fieldName.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export const STATUS_DISPLAY: Record<MatchStatus, { label: string; color: string; icon: string }> = {
  [MatchStatus.MATCH]: { label: 'Match', color: 'green', icon: '✅' },
  [MatchStatus.SOFT_MISMATCH]: { label: 'Review Required', color: 'yellow', icon: '⚠️' },
  [MatchStatus.HARD_MISMATCH]: { label: 'Mismatch', color: 'red', icon: '❌' },
  [MatchStatus.NOT_FOUND]: { label: 'Not Found', color: 'red', icon: '❌' },
  [MatchStatus.NOT_APPLICABLE]: { label: 'N/A', color: 'gray', icon: '—' },
  [MatchStatus.SURFACED]: { label: 'Info Only', color: 'blue', icon: 'ℹ️' },
};

/**
 * Required fields by beverage type (for reference)
 */
export const REQUIRED_FIELDS = {
  [BeverageType.BEER]: {
    validated: [
      'brandName',
      'fancifulName', // Cross-check only if present
      'classType',
      'netContents',
      'producerNameAddress',
      'healthWarning',
      'countryOfOrigin', // Required if imported
      'alcoholContent', // REQUIRED
    ],
    surfaced: ['colorAdditiveDisclosure', 'sulfiteDeclaration', 'aspartameDeclaration'],
  },
  [BeverageType.SPIRITS]: {
    validated: [
      'brandName',
      'fancifulName', // Cross-check only if present
      'classType',
      'alcoholContent', // REQUIRED
      'netContents',
      'producerNameAddress',
      'healthWarning',
      'countryOfOrigin', // Required if imported
      'ageStatement', // Conditionally required: mandatory for whisky <4 years, grape lees/pomace/marc brandy <2 years, or if distillation date/miscellaneous age references present
    ],
    surfaced: ['colorIngredientDisclosure', 'commodityStatement'],
  },
  [BeverageType.WINE]: {
    validated: [
      'brandName',
      'classType', // Cross-check varietal if present
      'alcoholContent', // REQUIRED
      'netContents',
      'producerNameAddress',
      'healthWarning',
      'countryOfOrigin', // Required if imported
      'appellation', // Required if varietal or estate bottled
      'sulfiteDeclaration', // REQUIRED
      'foreignWinePercentage', // Required if label references foreign wine in a blend
    ],
    surfaced: ['colorIngredientDisclosure'],
  },
};
