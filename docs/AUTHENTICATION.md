# Authentication System Documentation

## Overview

The authentication system uses session-based authentication with secure HTTP-only cookies. Passwords are hashed using bcrypt before storage.

## API Endpoints

### POST /api/auth/login

Authenticate a user and create a session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "agent"
  }
}
```

**Error Response (401):**

```json
{
  "error": "Invalid email or password"
}
```

### POST /api/auth/logout

End the current user session.

**Success Response (200):**

```json
{
  "success": true
}
```

### GET /api/auth/me

Get the current authenticated user's profile.

**Success Response (200):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "role": "agent"
  }
}
```

**Error Response (401):**

```json
{
  "error": "Not authenticated"
}
```

## Session Management

- Sessions are stored in memory (in production, use Redis or database)
- Session duration: 24 hours
- Sessions are stored in secure, HTTP-only cookies
- Cookies are set with `SameSite=lax` for CSRF protection
- In production, cookies use the `secure` flag for HTTPS-only transmission

## Password Security

- Passwords are hashed using bcrypt with 10 rounds
- Passwords are never stored in plain text
- Password verification uses constant-time comparison

## Usage Example

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// Get current user
const userResponse = await fetch('/api/auth/me');

// Logout
await fetch('/api/auth/logout', { method: 'POST' });
```

## Test User

A test user is created by default:

- Email: `test@example.com`
- Password: `password123`
- Role: `agent`
