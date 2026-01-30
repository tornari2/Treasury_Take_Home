// ============================================================
// Application Data Converter
// Converts between database Application format and ApplicationData format
// ============================================================

import { ApplicationData, BeverageType, OriginType } from "./validation";
import type { Application } from "@/types/database";

/**
 * Convert database Application to ApplicationData format
 */
export function convertApplicationToApplicationData(
  application: Application,
  labelImageIds: number[] = [],
): ApplicationData {
  // Parse application_data (new format) or expected_label_data (legacy format)
  let appData: any;
  try {
    appData = JSON.parse(
      (application as any).application_data ||
        (application as any).expected_label_data ||
        "{}",
    );
  } catch {
    appData = {};
  }

  // Handle legacy format conversion
  if (
    (application as any).expected_label_data &&
    !(application as any).application_data
  ) {
    // Convert from legacy ExpectedLabelData format
    const legacyData = appData;

    // Parse producer address if it's a string
    let producerCity = "";
    let producerState = "";

    if (legacyData.producer_address) {
      const addressParts = legacyData.producer_address
        .split(",")
        .map((s: string) => s.trim());
      if (addressParts.length >= 2) {
        producerCity = addressParts[addressParts.length - 2] || "";
        producerState = addressParts[addressParts.length - 1] || "";
      } else if (addressParts.length === 1) {
        producerCity = addressParts[0];
      }
    }

    return {
      id: String(application.id),
      beverageType: application.beverage_type as BeverageType,
      originType:
        legacyData.originType ||
        inferOriginTypeFromCountry(legacyData.country_of_origin || ""),
      brandName: legacyData.brand_name || "",
      fancifulName: legacyData.fanciful_name || null,
      producerName: legacyData.producer_name || "",
      producerAddress: {
        city: producerCity,
        state: producerState,
      },
      appellation: legacyData.appellation_of_origin || null,
      varietal: legacyData.varietal || legacyData.class_type || null,
      vintageDate: legacyData.vintage_date || null,
      other: legacyData.other || null,
      labelImages: labelImageIds.map((id) => String(id)),
    };
  }

  // New format - ApplicationData stored directly
  return {
    id: String(application.id),
    ttbId: appData.ttbId || null,
    beverageType: (appData.beverageType ||
      application.beverage_type) as BeverageType,
    originType: (appData.originType || OriginType.DOMESTIC) as OriginType,
    brandName: appData.brandName || "",
    fancifulName: appData.fancifulName || null,
    producerName: appData.producerName || "",
    producerAddress: appData.producerAddress || { city: "", state: "" },
    appellation: appData.appellation || null,
    varietal: appData.varietal || null,
    vintageDate: appData.vintageDate || null,
    other: appData.other || null,
    labelImages: appData.labelImages || labelImageIds.map((id) => String(id)),
  };
}

/**
 * Infer origin type from country name (simple heuristic)
 * Returns 'domestic' for US, 'imported' otherwise
 */
function inferOriginTypeFromCountry(countryName: string): OriginType {
  if (!countryName) return OriginType.DOMESTIC;

  const normalized = countryName.toLowerCase().trim();

  // Check if it's a US state or city (default to domestic)
  const usIndicators = ["united states", "usa", "us", "america", "american"];
  if (usIndicators.some((indicator) => normalized.includes(indicator))) {
    return OriginType.DOMESTIC;
  }

  // Default to imported if not US
  return OriginType.IMPORTED;
}
