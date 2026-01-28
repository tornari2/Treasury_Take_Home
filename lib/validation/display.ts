// ============================================================
// Display Helpers and Constants
// ============================================================

import { MatchStatus, BeverageType } from './types';

export const FIELD_LABELS: Record<string, string> = {
  brandName: 'Brand Name',
  fancifulName: 'Fanciful Name',
  classType: 'Class/Type (Varietal)',
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
      'countryOfOrigin', // Non-US origins only
      'alcoholContent', // NOT_FOUND if missing but doesn't fail validation
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
      'countryOfOrigin', // Non-US origins only
      'ageStatement', // REQUIRED
    ],
    surfaced: ['colorIngredientDisclosure', 'commodityStatement'],
  },
  [BeverageType.WINE]: {
    validated: [
      'brandName',
      'fancifulName', // Cross-check only if present
      'classType', // Cross-check varietal if present
      'alcoholContent', // REQUIRED
      'netContents',
      'producerNameAddress',
      'healthWarning',
      'countryOfOrigin', // Non-US origins only
      'appellation', // Required if varietal, vintage, or estate bottled
      'vintageDate', // Cross-check if present
      'sulfiteDeclaration', // REQUIRED
      'foreignWinePercentage', // Required if label references foreign wine in a blend
    ],
    surfaced: ['colorIngredientDisclosure'],
  },
};
