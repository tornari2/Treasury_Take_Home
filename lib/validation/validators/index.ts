// ============================================================
// Validators Module Index
// ============================================================
// Re-exports all validators for cleaner imports.
//
// Common validators are used across all beverage types:
// - Brand name, fanciful name, class/type
// - Alcohol content, net contents
// - Producer name/address
// - Health warning, country of origin
//
// Beverage-specific validators:
// - Spirits: age statement
// - Wine: appellation, varietal, sulfite declaration, foreign wine percentage
// ============================================================

// Common validators (all beverage types)
export {
  validateBrandName,
  validateFancifulName,
  validateClassType,
  validateAlcoholContent,
  validateNetContents,
  validateProducerNameAddress,
  validateHealthWarning,
  validateCountryOfOrigin,
} from './common';

// Spirits-specific validators
export { validateAgeStatement } from './spirits';

// Wine-specific validators
export {
  validateAppellation,
  validateWineVarietal,
  validateSulfiteDeclaration,
  validateForeignWinePercentage,
} from './wine';
