# Quick User Setup Guide

## Current Status

**Authentication is currently DISABLED** - You can access the app without logging in.

## Option 1: Create Users via Railway CLI (Recommended)

### Quick Test User

```bash
# Make sure you're logged into Railway
railway login
railway link

# Create a single test user
railway run npx tsx scripts/create-test-user-quick.ts
```

This creates:
- **Email:** `test@example.com`
- **Password:** `test123`
- **Role:** `agent`

### Multiple Users

Edit `scripts/create-users.ts` with your team's info, then:

```bash
railway run npx tsx scripts/create-users.ts
```

## Option 2: Create Users via Railway Web Shell

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Deployments** → Click the three dots on latest deployment → **Shell**
4. Run:
   ```bash
   npx tsx scripts/create-test-user-quick.ts
   ```

## Option 3: Use Registration API (No UI Required)

You can create users directly via the API:

```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }'
```

This automatically logs them in and returns a session cookie.

## Testing Authentication

Even though auth is disabled, you can test the login endpoint:

```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## Enabling Authentication

If you want to require login to access the app, authentication needs to be re-enabled in the API routes and dashboard. Currently it's disabled for easier testing.
