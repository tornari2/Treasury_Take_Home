# Treasury Take Home - AI-Powered Label Verification System

A Next.js application for automating alcohol beverage label compliance review using AI.

## Features

- 🔐 User authentication with session management
- 📊 Application management dashboard
- 🤖 AI-powered label verification using OpenAI GPT-4o-mini
- 📦 Batch processing (up to 500 applications, 10 concurrent workers)
- 🔍 Side-by-side comparison review interface
- 📝 Comprehensive audit logging

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example.local .env.local
```

Edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=your_key_here
DATABASE_PATH=./data/database.db
SESSION_SECRET=your_secret_here
```

4. Initialize the database:

```bash
npm run db:init
```

5. Create a test user:

```bash
npx tsx scripts/create-test-user.ts
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run quality` - Run all quality checks (lint, format, type-check, test)

### Testing

- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:run` - Run tests once (CI mode)

## Code Quality

This project maintains high code quality through:

### Linting

- **ESLint** with Next.js and Prettier configurations
- Custom rules for React hooks, TypeScript, and code style
- Automatic fixing on commit via lint-staged

### Formatting

- **Prettier** for consistent code formatting
- Integrated with ESLint to avoid conflicts
- Auto-format on save (if configured in your editor)

### Type Safety

- **TypeScript** with strict mode enabled
- Full type coverage for all modules
- Type checking in CI/CD pipeline

### Testing

- **Vitest** for unit and integration tests
- Testing Library for React component tests
- Coverage reporting with v8 provider

### Pre-commit Hooks

- **Husky** for Git hooks
- **lint-staged** to run linters/formatters on staged files
- Prevents committing code that doesn't pass quality checks

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   └── review/            # Review interface
├── lib/                    # Utility libraries
│   ├── auth.ts            # Authentication utilities
│   ├── db.ts              # Database connection
│   ├── verification.ts    # Verification logic
│   └── openai-service.ts # OpenAI integration
├── types/                  # TypeScript type definitions
├── __tests__/             # Test files
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## Testing

Tests are located in the `__tests__` directory. Run tests with:

```bash
npm run test
```

View test coverage:

```bash
npm run test:coverage
```

## Contributing

1. Make your changes
2. Run quality checks: `npm run quality`
3. Ensure all tests pass: `npm run test:run`
4. Commit your changes (pre-commit hooks will run automatically)

## License

Private project for Treasury Take Home assignment.
