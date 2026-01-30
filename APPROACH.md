# Approach, Tools, and Assumptions

## Overview

This document outlines the technical approach, tools, and assumptions made during the development of the Treasury Take Home application - an AI-powered beverage label verification system for TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance.

---

## Approach

### AI Model Selection: GPT-4o

**Decision:** Used OpenAI's GPT-4o model (not GPT-4o-mini) for label data extraction despite its higher latency and cost.

**Rationale:**

1. **Accuracy Over Speed**: The application prioritizes accuracy in extracting structured data from beverage labels. GPT-4o's superior vision capabilities provide more reliable extraction results, which is critical for regulatory compliance.

2. **Handling Label Variety**: Beverage labels exhibit extreme variability:
   - **Text Orientation**: Labels contain text oriented horizontally, vertically, radially (around bottle curves), and at various angles
   - **Label Styles**: Different design aesthetics, fonts, colors, and layouts across spirits, wine, and beer categories
   - **Multi-panel Labels**: Information is often distributed across front, back, neck, and side labels
   - **Language Variations**: Labels may contain multiple languages or mixed formatting

3. **Robustness to Image Quality Issues**: Real-world label images often have imperfections:
   - **Poor Lighting**: Shadows, uneven illumination, or low-light conditions
   - **Camera Angles**: Non-perpendicular shots, perspective distortion, or skewed angles
   - **Glare and Reflections**: Shiny bottle surfaces causing reflections that obscure text
   - **Image Artifacts**: Compression artifacts, blur, or motion blur
   - **Background Interference**: Cluttered backgrounds or partial occlusion

GPT-4o's advanced vision capabilities handle these challenges more effectively than lighter models, reducing false negatives and extraction errors that could lead to compliance issues.

### Multi-Image Processing Strategy

**Approach:** Process all label images (front, back, neck, side) together in a single API call rather than processing each image separately.

**Benefits:**

- **Context Awareness**: The model can correlate information across multiple label panels
- **Efficiency**: Single API call reduces latency and API overhead
- **Cost Optimization**: More efficient token usage compared to multiple sequential calls
- **Completeness**: Ensures all fields are extracted even when information spans multiple images

### Validation Architecture

**Two-Stage Verification Process:**

1. **Extraction Stage**: GPT-4o extracts structured data from label images
   - Returns JSON with all relevant fields (brand name, alcohol content, producer info, health warnings, etc.)
   - Preserves exact capitalization and formatting as shown on labels
   - Handles beverage-specific fields (e.g., appellation for wine, age statement for spirits)

2. **Validation Stage**: Extracted data is validated against:
   - **Application Data**: Cross-check extracted values against submitted application fields
   - **TTB Rules**: Validate presence, format, and content requirements per beverage type
   - **Soft vs. Hard Mismatches**: Distinguish between minor discrepancies (soft) and critical errors (hard)

**Validation Types:**

- **CROSS-CHECK**: Compare label value against application data
- **PRESENCE**: Verify required field exists on label
- **FORMAT**: Verify field follows specific formatting rules (e.g., health warning capitalization)
- **SURFACED**: Display extracted field but don't validate (informational only)

### Error Handling and Resilience

**Retry Logic:**

- Exponential backoff retry mechanism (max 2 retries)
- Separate handling for network errors, timeouts, and API errors
- Custom error types for better error categorization and user feedback

**Timeout Management:**

- 60 seconds per image (scales with number of images)
- Maximum 5 minutes total timeout for multi-image processing
- Prevents hanging requests while allowing sufficient processing time

**Safety Checks:**

- Automatic detection and correction of common extraction errors (e.g., swapped varietal/appellation for wine labels)
- Validation of JSON response structure before processing
- Graceful degradation with informative error messages

---

## Tools Used

### Core Framework & Runtime

- **Next.js 14.2.5** (App Router)
  - Server-side rendering and API routes
  - File-based routing
  - Built-in optimization and performance features

- **Node.js 20.x**
  - Required for Next.js 14 compatibility
  - Version enforced via `.nvmrc` and pre-build checks

- **TypeScript** (Strict Mode)
  - Type safety throughout the application
  - Enhanced developer experience and error prevention

### AI & Machine Learning

- **OpenAI GPT-4o Vision API**
  - Primary model for label data extraction
  - Vision capabilities for image analysis
  - JSON mode for structured output

- **OpenAI SDK** (`openai` v6.16.0)
  - Official TypeScript SDK
  - Built-in retry and error handling

### Database & Storage

- **SQLite** with `better-sqlite3`
  - Lightweight, file-based database
  - No external database server required
  - Suitable for single-instance deployments
  - Stores applications, label images (as BLOBs), and verification results

### UI & Styling

- **React 18.3.1**
  - Component-based UI architecture
  - Server components for optimal performance

- **Tailwind CSS**
  - Utility-first CSS framework
  - Responsive design system

- **shadcn/ui**
  - High-quality React component library
  - Built on Radix UI primitives
  - Accessible and customizable components

### Testing & Quality Assurance

- **Vitest**
  - Fast unit and integration testing framework
  - 29 passing tests covering verification logic, validation, and API endpoints

- **ESLint + Prettier**
  - Code linting and formatting
  - Consistent code style across the project

- **Husky + lint-staged**
  - Pre-commit hooks for code quality
  - Ensures tests pass before commits

### Development Tools

- **TypeScript Compiler** (`tsc`)
  - Type checking without emitting files
  - Integrated into quality checks

- **Nixpacks** (Railway)
  - Automatic build detection for deployment
  - Handles Node.js version and dependencies

---

## Assumptions

### Infrastructure & Network

1. **OpenAI API Accessibility**
   - **Assumption**: The OpenAI API (api.openai.com) will not be blocked by corporate firewalls or network restrictions
   - **Rationale**: The application requires outbound HTTPS connections to OpenAI's API endpoints
   - **Impact**: If blocked, the application cannot perform label verification
   - **Mitigation**: Consider proxy configuration or alternative API endpoints if firewall restrictions exist

2. **Network Reliability**
   - **Assumption**: Stable internet connectivity for API calls
   - **Rationale**: Label verification requires real-time API communication
   - **Impact**: Network interruptions could cause verification failures
   - **Mitigation**: Retry logic with exponential backoff handles transient failures

### Data & Integration

3. **Database Integration**
   - **Assumption**: In production, the application will be integrated with a database containing:
     - COLA (Certificate of Label Approval) application fields
     - Label images associated with applications
   - **Rationale**: Current implementation uses SQLite for demonstration, but production would connect to a centralized database
   - **Impact**: Database schema and API may need adaptation for production database
   - **Note**: Current schema is designed to be easily adaptable to external databases

4. **Automated Data Entry**
   - **Assumption**: Users will **NOT** manually enter application fields and label images
   - **Rationale**: The application is designed for automated processing workflows
   - **Current State**: Manual entry is supported via the web UI for demonstration/testing purposes
   - **Production Expectation**: Data would be imported via:
     - API integrations with existing COLA systems
     - Batch import from file systems
     - Automated workflows from document management systems
   - **Impact**: Manual entry UI may be disabled or restricted in production

### Business Logic

5. **TTB Regulation Compliance**
   - **Assumption**: TTB validation rules implemented are current and accurate
   - **Rationale**: Validation logic is based on TTB requirements for spirits, wine, and beer
   - **Impact**: Regulations may change over time, requiring updates to validation rules
   - **Note**: Validation rules are modular and can be updated without changing core extraction logic

6. **Label Image Quality**
   - **Assumption**: Label images will be provided in standard formats (JPEG, PNG)
   - **Rationale**: OpenAI Vision API supports common image formats
   - **Impact**: Unsupported formats would require conversion
   - **Current Support**: JPEG, PNG (via MIME type detection)

### Performance & Scale

7. **Batch Processing Limits**
   - **Assumption**: Batch verification operations will process up to 500 applications
   - **Rationale**: Current implementation includes batch processing with this limit
   - **Impact**: Larger batches may require queue system or distributed processing
   - **Note**: Batch processing uses background processing to avoid timeouts

8. **Concurrent Users**
   - **Assumption**: Application can handle moderate concurrent usage
   - **Rationale**: SQLite supports concurrent reads but limited concurrent writes
   - **Impact**: High concurrency may require database migration (PostgreSQL, MySQL)
   - **Note**: Current implementation suitable for small-to-medium teams

### Security & Access

9. **Authentication & Authorization**
   - **Assumption**: Authentication middleware will be enabled in production
   - **Rationale**: Currently disabled for demonstration purposes
   - **Impact**: All endpoints are publicly accessible in current state
   - **Note**: Authentication infrastructure exists but is bypassed by middleware

10. **API Key Security**
    - **Assumption**: OpenAI API keys will be securely managed (environment variables, secrets management)
    - **Rationale**: API keys are sensitive credentials
    - **Impact**: Exposed keys could lead to unauthorized usage and costs
    - **Current Implementation**: Keys stored in `.env.local` (gitignored)

---

## Technical Decisions Summary

| Decision                     | Rationale                                                   | Trade-off                                    |
| ---------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| GPT-4o over GPT-4o-mini      | Higher accuracy for varied label types and imperfect images | Higher latency and cost                      |
| Multi-image single API call  | Context awareness and efficiency                            | Larger token usage per request               |
| SQLite database              | Simplicity and no external dependencies                     | Limited concurrent write capacity            |
| TypeScript strict mode       | Type safety and error prevention                            | More verbose code                            |
| Server-side processing       | Security (API keys not exposed) and reliability             | Higher server load                           |
| Batch processing limit (500) | Prevents timeouts and resource exhaustion                   | May require multiple batches for larger sets |

---

## Future Considerations

### Potential Enhancements

1. **Database Migration**: Consider PostgreSQL or MySQL for production scale
2. **Queue System**: Implement job queue (Bull, BullMQ) for large batch processing
3. **Caching**: Cache extraction results for duplicate label images
4. **Rate Limiting**: Add rate limiting for API endpoints
5. **Audit Logging**: Enable comprehensive audit trail (schema exists but disabled)
6. **Image Preprocessing**: Add image enhancement (contrast, rotation correction) before extraction
7. **Multi-model Fallback**: Implement fallback to GPT-4o-mini for simple cases to reduce costs
8. **Confidence Scoring**: Reintroduce confidence scores for extraction quality assessment

### Scalability Considerations

- **Horizontal Scaling**: Current architecture supports single-instance deployment
- **Database Sharding**: May be needed for very large application volumes
- **CDN Integration**: Consider CDN for label image storage and delivery
- **API Rate Limits**: Monitor OpenAI API rate limits for high-volume usage

---

## Conclusion

This application prioritizes accuracy and robustness in label data extraction, choosing GPT-4o for its superior vision capabilities despite higher latency. The architecture is designed to be production-ready while maintaining flexibility for integration with existing COLA systems and databases. Key assumptions center around network accessibility, database integration, and automated workflows that align with typical TTB compliance processing environments.
