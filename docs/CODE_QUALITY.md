# Code Quality & Testing Guide

This document outlines the code quality tools, testing strategies, and best practices for the Treasury Take Home project.

## Testing Framework

### Vitest

We use **Vitest** as our testing framework, which provides:

- Fast test execution with Vite
- Jest-compatible API
- Built-in TypeScript support
- Coverage reporting
- Watch mode for development

### Test Structure

```
__tests__/
├── api/              # API endpoint tests
├── lib/              # Utility function tests
└── components/       # React component tests (future)
```

### Running Tests

```bash
# Watch mode (development)
npm run test

# Run once (CI mode)
npm run test:run

# With UI
npm run test:ui

# With coverage report
npm run test:coverage
```

### Test Coverage

Current coverage includes:

- ✅ Verification logic (20 tests)
- ✅ Authentication utilities (7 tests)
- ✅ API validation (2 tests)

**Coverage Goals:**

- Aim for 80%+ code coverage
- Focus on critical business logic
- Test edge cases and error handling

## Linting

### ESLint Configuration

We use **ESLint** with:

- Next.js recommended rules
- Prettier integration
- Custom rules for code quality

**Key Rules:**

- `no-console`: Warns on console.log (allows console.warn/error)
- `no-unused-vars`: Warns on unused variables
- `react-hooks/exhaustive-deps`: Ensures proper hook dependencies
- `react/no-unescaped-entities`: Prevents unescaped characters

### Running Linters

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Code Formatting

### Prettier

**Prettier** ensures consistent code formatting across the project.

**Configuration:**

- Single quotes
- 2-space indentation
- 100 character line width
- Semicolons enabled
- Trailing commas (ES5)

### Running Prettier

```bash
# Format all files
npm run format

# Check formatting (CI)
npm run format:check
```

## Type Safety

### TypeScript

- **Strict mode** enabled
- Full type coverage
- Path aliases configured (`@/*`)

### Type Checking

```bash
# Check types without emitting
npm run type-check
```

## Pre-commit Hooks

### Husky + lint-staged

Automatically runs quality checks before commits:

1. **ESLint** on staged `.ts`/`.tsx` files
2. **Prettier** on all staged files
3. Prevents commits with linting errors

**Files checked:**

- `*.{ts,tsx}` - ESLint + Prettier
- `*.{json,md,yml,yaml}` - Prettier only

## Quality Workflow

### Development Workflow

1. Write code
2. Run `npm run quality` before committing
3. Pre-commit hooks run automatically
4. Fix any issues
5. Commit

### CI/CD Integration

The `quality` script runs all checks:

```bash
npm run quality
```

This runs:

1. ESLint
2. Prettier check
3. TypeScript type checking
4. Test suite

## Best Practices

### Writing Tests

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Test edge cases and error conditions**
4. **Keep tests isolated and independent**

### Code Style

1. **Follow Prettier formatting**
2. **Use TypeScript types everywhere**
3. **Avoid `any` types**
4. **Use meaningful variable names**
5. **Add JSDoc comments for complex functions**

### Example Test

```typescript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Continuous Improvement

### Adding New Rules

1. Discuss with team
2. Add to ESLint/Prettier config
3. Update documentation
4. Run `npm run format` to apply

### Coverage Goals

- **Critical paths**: 100% coverage
- **Business logic**: 90%+ coverage
- **Utilities**: 80%+ coverage
- **Overall**: 80%+ coverage

## Troubleshooting

### Tests Failing

1. Check error messages
2. Run tests in watch mode: `npm run test`
3. Check test setup files
4. Verify dependencies

### Linting Errors

1. Run `npm run lint:fix`
2. Check ESLint config
3. Review rule documentation

### Formatting Issues

1. Run `npm run format`
2. Check `.prettierrc` config
3. Verify editor integration

## Editor Integration

### VS Code

Recommended extensions:

- ESLint
- Prettier
- TypeScript and JavaScript Language Features

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Summary

This project maintains high code quality through:

- ✅ Comprehensive testing with Vitest
- ✅ Strict linting with ESLint
- ✅ Consistent formatting with Prettier
- ✅ Type safety with TypeScript
- ✅ Automated quality checks via pre-commit hooks
- ✅ Clear documentation and best practices
