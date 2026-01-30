# Treasury Take Home

A Next.js application for managing and verifying beverage label applications using AI-powered extraction and validation.

## Overview

This application provides a dashboard for reviewing beverage label applications (spirits, wine, and beer) with automated data extraction and verification using OpenAI's vision models.

## Features

- 📋 **Application Management**: Submit and review beverage label applications
- 🤖 **AI-Powered Extraction**: Automatically extract label data from images using OpenAI GPT-4o Vision
- ✅ **Validation**: Comprehensive validation rules for spirits, wine, and beer labels
- 📊 **Dashboard**: View and manage applications with filtering and status tracking
- 🔍 **Review Interface**: Detailed review page with extracted data and verification results
- 📦 **Batch Processing**: Process multiple applications efficiently

## Prerequisites

- **Node.js**: 18.0.0 or higher (but less than 22.0.0)
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

- `users` - User accounts and authentication
- `applications` - Beverage label applications
- `label_images` - Uploaded label images with extracted data
- `audit_logs` - Activity tracking

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

## Project Structure

```
Treasury_Take_Home/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # API endpoints
│   ├── dashboard/          # Dashboard page
│   └── review/             # Review page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── application-form.tsx
├── lib/                    # Core libraries
│   ├── db.ts              # Database connection
│   ├── migrations.ts      # Database migrations
│   ├── openai-service.ts  # OpenAI integration
│   ├── validation/        # Validation rules and logic
│   └── ...
├── scripts/               # Utility scripts
│   ├── create-test-user-quick.ts
│   ├── create-users.ts
│   └── ...
├── public/                # Static assets
└── types/                 # TypeScript type definitions
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

- **users**: User accounts and roles
- **applications**: Beverage label applications with status tracking
- **label_images**: Uploaded images with extracted data and verification results
- **audit_logs**: Activity and action logging

Migrations run automatically when the database is first accessed. The database file is created in the `data/` directory (or your custom `DATABASE_PATH`).

## API Endpoints

- `POST /api/applications` - Create a new application
- `GET /api/applications` - List applications (with filtering)
- `GET /api/applications/[id]` - Get application details
- `POST /api/applications/[id]/verify` - Verify application labels
- `POST /api/applications/[id]/review` - Submit review decision
- `GET /api/health` - Health check endpoint

## Deployment

### Railway Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed Railway deployment instructions.

**Quick Railway Setup:**

1. Connect your GitHub repository to Railway
2. Set environment variables:
   - `OPENAI_API_KEY`
   - `DATABASE_PATH=/app/data/database.db`
   - `NODE_ENV=production`
3. Add persistent volume at `/app/data`
4. Deploy!

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
- See [RAILWAY_ENV_TROUBLESHOOTING.md](./RAILWAY_ENV_TROUBLESHOOTING.md) for deployment-specific issues

### Build Errors

- Run `npm run type-check` to identify TypeScript errors
- Run `npm run lint` to check for linting issues
- Ensure all dependencies are installed: `npm install`

## Development Notes

- **Authentication**: Currently disabled for easier testing (see [USER_ACCESS_GUIDE.md](./USER_ACCESS_GUIDE.md))
- **Database Migrations**: Run automatically on first database access
- **Image Processing**: Uses OpenAI GPT-4o Vision for label data extraction
- **Validation**: Comprehensive rules for TTB label requirements

## Additional Documentation

- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Railway deployment guide with checklist
- [USER_ACCESS_GUIDE.md](./USER_ACCESS_GUIDE.md) - User creation and access guide
- [RAILWAY_ENV_TROUBLESHOOTING.md](./RAILWAY_ENV_TROUBLESHOOTING.md) - Environment variable troubleshooting
- [SYNC_DATABASE_TO_RAILWAY.md](./SYNC_DATABASE_TO_RAILWAY.md) - Database sync guide
- [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) - Security best practices

## License

Private project - All rights reserved

## Support

For issues or questions, please check the troubleshooting section or review the additional documentation files in the repository root.
