// ============================================================
// Surfaced Fields Extraction
// ============================================================

import {
  SurfacedField,
  BeerExtractionResult,
  SpiritsExtractionResult,
  WineExtractionResult,
} from "./types";
import { valueExists } from "./utils";

/**
 * Extract surfaced fields for BEER
 */
export function extractBeerSurfacedFields(
  extraction: BeerExtractionResult["extraction"],
): SurfacedField[] {
  return [
    {
      field: "colorAdditiveDisclosure",
      value: extraction.colorAdditiveDisclosure,
      present: valueExists(extraction.colorAdditiveDisclosure),
    },
    {
      field: "sulfiteDeclaration",
      value: extraction.sulfiteDeclaration,
      present: valueExists(extraction.sulfiteDeclaration),
    },
    {
      field: "aspartameDeclaration",
      value: extraction.aspartameDeclaration,
      present: valueExists(extraction.aspartameDeclaration),
    },
  ];
}

/**
 * Extract surfaced fields for SPIRITS
 */
export function extractSpiritsSurfacedFields(
  extraction: SpiritsExtractionResult["extraction"],
): SurfacedField[] {
  return [
    {
      field: "colorIngredientDisclosure",
      value: extraction.colorIngredientDisclosure,
      present: valueExists(extraction.colorIngredientDisclosure),
    },
    {
      field: "commodityStatement",
      value: extraction.commodityStatement,
      present: valueExists(extraction.commodityStatement),
    },
  ];
}

/**
 * Extract surfaced fields for WINE
 */
export function extractWineSurfacedFields(
  extraction: WineExtractionResult["extraction"],
): SurfacedField[] {
  return [
    {
      field: "colorIngredientDisclosure",
      value: extraction.colorIngredientDisclosure,
      present: valueExists(extraction.colorIngredientDisclosure),
    },
  ];
}
