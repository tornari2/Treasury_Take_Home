// ============================================================
// TTB Label Validation Module
// ============================================================
// This module contains all validation logic for TTB alcohol label verification.
// It validates AI-extracted label data against application data and TTB rules.
//
// Validation Types:
// - CROSS-CHECK: Compare label value against application data
// - PRESENCE: Verify required field exists on label
// - FORMAT: Verify field follows specific formatting rules
// - SURFACED: Field is extracted and displayed but not validated
// ============================================================

// Types and Enums
export * from './types';

// Constants
export * from './constants';

// Prompts
export * from './prompts';

// Utilities
export * from './utils';

// Validators
export * from './validators/common';
export * from './validators/spirits';
export * from './validators/wine';

// Surfaced Fields
export * from './surfaced';

// Main Validation Functions
export * from './validation';

// Display Helpers
export * from './display';
