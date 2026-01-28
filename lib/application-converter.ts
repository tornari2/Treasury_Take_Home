// ============================================================
// Application Data Converter
// Converts between database Application format and ApplicationData format
// ============================================================

import { ApplicationData, BeverageType } from './validation';
import type { Application } from '@/types/database';

/**
 * Convert database Application to ApplicationData format
 */
export function convertApplicationToApplicationData(
  application: Application,
  labelImageIds: number[] = []
): ApplicationData {
  // Parse application_data (new format) or expected_label_data (legacy format)
  let appData: any;
  try {
    appData = JSON.parse(
      (application as any).application_data || (application as any).expected_label_data || '{}'
    );
  } catch {
    appData = {};
  }

  // Handle legacy format conversion
  if ((application as any).expected_label_data && !(application as any).application_data) {
    // Convert from legacy ExpectedLabelData format
    const legacyData = appData;

    // Parse producer address if it's a string
    let producerCity = '';
    let producerState = '';

    if (legacyData.producer_address) {
      const addressParts = legacyData.producer_address.split(',').map((s: string) => s.trim());
      if (addressParts.length >= 2) {
        producerCity = addressParts[addressParts.length - 2] || '';
        producerState = addressParts[addressParts.length - 1] || '';
      } else if (addressParts.length === 1) {
        producerCity = addressParts[0];
      }
    }

    return {
      id: String(application.id),
      beverageType: application.beverage_type as BeverageType,
      originCode:
        legacyData.origin_code || inferOriginCodeFromCountry(legacyData.country_of_origin || ''),
      brandName: legacyData.brand_name || '',
      fancifulName: legacyData.fanciful_name || null,
      producerName: legacyData.producer_name || '',
      producerAddress: {
        city: producerCity,
        state: producerState,
      },
      appellation: legacyData.appellation_of_origin || null,
      varietal: legacyData.varietal || legacyData.class_type || null,
      vintageDate: legacyData.vintage_date || null,
      labelImages: labelImageIds.map((id) => String(id)),
    };
  }

  // New format - ApplicationData stored directly
  return {
    id: String(application.id),
    beverageType: (appData.beverageType || application.beverage_type) as BeverageType,
    originCode: appData.originCode || '00',
    brandName: appData.brandName || '',
    fancifulName: appData.fancifulName || null,
    producerName: appData.producerName || '',
    producerAddress: appData.producerAddress || { city: '', state: '' },
    appellation: appData.appellation || null,
    varietal: appData.varietal || null,
    vintageDate: appData.vintageDate || null,
    labelImages: appData.labelImages || labelImageIds.map((id) => String(id)),
  };
}

/**
 * Infer origin code from country name (simple heuristic)
 * Returns '00' (US) if not found or if it's a US state/city
 */
function inferOriginCodeFromCountry(countryName: string): string {
  if (!countryName) return '00';

  const normalized = countryName.toLowerCase().trim();

  // Check if it's a US state or city (default to US)
  const usIndicators = ['united states', 'usa', 'us', 'america', 'american'];
  if (usIndicators.some((indicator) => normalized.includes(indicator))) {
    return '00';
  }

  // Try to find matching origin code by country name
  // Import origin codes dynamically to avoid circular dependency
  const { ORIGIN_CODES } = require('./validation/origin-codes');
  for (const [code, country] of Object.entries(ORIGIN_CODES)) {
    const countryStr = String(country);
    if (
      normalized.includes(countryStr.toLowerCase()) ||
      countryStr.toLowerCase().includes(normalized)
    ) {
      return code;
    }
  }

  // Default to US if not found
  return '00';
}
