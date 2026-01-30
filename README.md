# Treasury Take Home

A Next.js application for managing and verifying beverage label applications using AI-powered extraction and validation.

## Overview

This application provides a dashboard for reviewing beverage label applications (spirits, wine, and beer) with automated data extraction and verification using OpenAI's vision models.

## Features

- 📋 **Application Management**: Create, view, edit, and delete beverage label applications with a comprehensive form interface
- 🤖 **AI-Powered Extraction**: Automatically extract label data from images using OpenAI GPT-4o Vision (processes all images together)
- ✅ **Comprehensive Validation**: TTB-compliant validation rules for spirits, wine, and beer (malt beverages) with soft/hard mismatch detection
- 📊 **Dashboard**: View and manage applications with status filtering, batch selection, and real-time updates
- 🔍 **Review Interface**: Side-by-side comparison view with extracted data, verification results, and interactive image viewer (zoom/pan)
- 📦 **Batch Processing**: Process up to 500 applications efficiently with background processing
- 🖼️ **Image Management**: Upload multiple label images (front, back, side, neck) with type selection and preview
- 🎨 **Modern UI**: Built with shadcn/ui components, Tailwind CSS, and responsive design

## Prerequisites

- **Node.js**: 20.x (specified in `.nvmrc` - required for Next.js 14 compatibility)
- **npm**: 9.0.0 or higher
- **OpenAI API Key**: Required for label data extraction and verification

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/tornari2/Treasury_Take_Home.git
cd Treasury_Take_Home
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required: OpenAI API key for label verification
OPENAI_API_KEY=sk-proj-your-key-here

# Optional: Custom database path (defaults to ./data/database.db)
DATABASE_PATH=./data/database.db
```

**Note:** The `.env.local` file is gitignored for security. Never commit your API keys.

### 4. Initialize Database

The database is automatically initialized on first run. Migrations will create the necessary tables:

- `users` - User accounts (authentication currently disabled)
- `applications` - Beverage label applications with status tracking
- `label_images` - Uploaded label images with extracted data and verification results
- `audit_logs` - Activity tracking (schema exists but logging is disabled)

The database file will be created at `./data/database.db` (or your custom `DATABASE_PATH`).

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

### Development

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm start            # Start production server
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript type checking
npm run quality      # Run all quality checks (lint, format, type-check, tests)
```

### Testing

```bash
npm test             # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report
npm run test:run     # Run tests once (CI mode)
```

### Database

```bash
npm run db:export    # Export database to JSON
```

## Environment Variables

### Required

- `OPENAI_API_KEY` - Your OpenAI API key (starts with `sk-`)

### Optional

- `DATABASE_PATH` - Path to SQLite database file (default: `./data/database.db`)
- `PORT` - Server port (default: `3000`)
- `NODE_ENV` - Environment mode (`development` or `production`)

## Database

The application uses SQLite with `better-sqlite3` for data persistence. The database is automatically initialized on first access with the following schema:

- **users**: User accounts and roles (authentication currently disabled)
- **applications**: Beverage label applications with status tracking (pending, approved, rejected)
- **label_images**: Uploaded images with extracted data and verification results stored as BLOBs
- **audit_logs**: Activity and action logging (schema exists but logging is currently disabled)

Migrations run automatically when the database is first accessed. The database file is created in the `data/` directory (or your custom `DATABASE_PATH`). The database uses lazy initialization to prevent build-time errors.

## API Endpoints

### Applications

- `GET /api/applications` - List applications (with optional status filtering)
- `POST /api/applications` - Create a new application with form data and images
- `GET /api/applications/[id]` - Get application details with label images
- `PATCH /api/applications/[id]` - Update application status and review notes
- `DELETE /api/applications/[id]` - Delete an application (cascades to label images)
- `POST /api/applications/[id]/verify` - Trigger AI verification for an application

### Batch Processing

- `POST /api/batch/verify` - Process multiple applications for verification (up to 500)

### Authentication (Endpoints exist but authentication is disabled)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and create session
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user information

### System

- `GET /api/health` - Health check endpoint (lightweight, no database access)

## Deployment

### Railway Deployment

The application is configured for Railway deployment using Nixpacks (auto-detected).

**Quick Railway Setup:**

1. Connect your GitHub repository to Railway
2. Set environment variables:
   - `OPENAI_API_KEY` (required)
   - `DATABASE_PATH=/app/data/database.db` (optional, defaults to `./data/database.db`)
   - `NODE_ENV=production` (optional)
3. Add persistent volume at `/app/data` for database storage
4. Deploy! Railway will auto-detect Next.js and build accordingly

**Note:** The application uses Node.js 20 (specified in `.nvmrc`). Railway will automatically use this version.

### Production Build

```bash
npm run build
npm start
```

## Troubleshooting

### Database Issues

If you encounter database errors:

1. Ensure the `data/` directory exists and is writable
2. Check that `DATABASE_PATH` is set correctly
3. Verify file permissions on the database file

### OpenAI API Issues

- Verify your `OPENAI_API_KEY` is set correctly in `.env.local`
- Check that the API key starts with `sk-`
- Ensure you have sufficient API credits/quota
- The application uses GPT-4o model (not GPT-4o-mini) for better accuracy
- Verification timeout is set to 60 seconds per image (max 5 minutes for multiple images)

### Build Errors

- Run `npm run type-check` to identify TypeScript errors
- Run `npm run lint` to check for linting issues
- Ensure all dependencies are installed: `npm install`

## Development Notes

- **Authentication**: Currently disabled - all API endpoints are publicly accessible. Auth endpoints exist but middleware allows all requests through.
- **Database Migrations**: Run automatically on first database access. Database is lazily initialized to prevent build-time errors.
- **Image Processing**: Uses OpenAI GPT-4o Vision for label data extraction. All images for an application are processed together in a single API call.
- **Validation**: Comprehensive validation rules for TTB label requirements across spirits, wine, and beer (malt beverages).
- **Node.js Version**: Requires Node.js 20.x (specified in `.nvmrc`). Node.js 22+ is incompatible with Next.js 14.2.5.
- **Build System**: Pre-build hook checks Node.js version and prevents builds with incompatible versions.

## Current Status

### Implementation Status

✅ **Core Features Complete:**

- Application management (create, read, update, delete)
- AI-powered label verification using GPT-4o
- Dashboard with filtering and batch operations
- Review interface with side-by-side comparison
- Image upload and management
- Batch processing (up to 500 applications)
- Comprehensive validation rules for all beverage types

✅ **Testing:**

- 29 passing tests (Vitest framework)
- Test coverage for verification logic, validation, and API endpoints

✅ **Code Quality:**

- TypeScript strict mode enabled
- ESLint + Prettier configured
- Pre-commit hooks with Husky
- All quality checks passing

✅ **Deployment:**

- Railway deployment configured
- Production-ready build system
- Health check endpoint for monitoring

### Known Limitations

- **Authentication**: Disabled - all endpoints are publicly accessible
- **Audit Logging**: Schema exists but logging is disabled
- **Rate Limiting**: Not implemented
- **Error Handling**: Basic error handling in place, could be enhanced

### Next Steps

- Enable authentication middleware when needed
- Add rate limiting for production use
- Implement audit logging if required
- Performance optimization for large batches

## License

Private project - All rights reserved

## Project Structure

### Key Directories

- `app/` - Next.js App Router pages and API routes
  - `api/` - REST API endpoints (applications, auth, batch, health)
  - `dashboard/` - Main application queue interface
  - `review/[id]/` - Application review page with verification results
- `components/` - React components
  - `application-form/` - Modular form sections for application creation/editing
  - `ui/` - shadcn/ui component library components
- `lib/` - Core business logic
  - `validation/` - TTB validation rules and logic (spirits, wine, beer)
  - `verification.ts` - AI verification orchestration
  - `openai-service.ts` - OpenAI API integration
  - `db-helpers.ts` - Database operations
  - `batch-processor.ts` - Batch processing logic
- `scripts/` - Utility scripts for database management and testing
- `public/test_labels/` - Sample label images for testing (organized by beverage type)
- `types/` - TypeScript type definitions for database schemas
- `memory-bank/` - Project documentation and context

### Technology Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite with better-sqlite3
- **AI**: OpenAI GPT-4o Vision API
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier, Husky

## Support

For issues or questions, please check the troubleshooting section above or review the codebase documentation in the `memory-bank/` directory.
