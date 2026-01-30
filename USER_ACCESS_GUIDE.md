# User Access Guide

This guide explains how to create users and access the deployed application.

## Quick Start

### Create a Test User (Fastest Method)

```bash
# Via Railway Shell (recommended)
railway login
railway link
railway shell
npx tsx scripts/create-test-user-quick.ts
```

This creates:
- **Email:** `test@example.com`
- **Password:** `test123`
- **Role:** `agent`

### Alternative: Use the Registration API

```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }'
```

---

## Current Situation

Your app has **authentication endpoints** (login/logout/register), but users must typically be created manually for controlled access.

## Option 1: Manual User Creation (Recommended for Small Teams)

Create users manually using scripts. Best for:

- Small teams (5-20 users)
- Internal/private applications
- When you want to control who has access

### Steps:

1. **Edit the user list** in `scripts/create-users.ts`:

   ```typescript
   const usersToCreate: UserInput[] = [
     {
       email: 'user1@example.com',
       password: 'secure-password-here',
       name: 'User One',
       role: 'agent',
     },
     // Add more users...
   ];
   ```

2. **Deploy the updated script** to Railway

3. **Run the script** via Railway CLI:

   ```bash
   railway run npx tsx scripts/create-users.ts
   ```

4. **Share credentials** with your team members securely

### Pros:

- ✅ Full control over who can access
- ✅ No public registration endpoint needed
- ✅ Simple and secure

### Cons:

- ❌ Requires manual user creation
- ❌ You need to update the script for new users

---

## Option 2: Public Registration (Recommended for Larger Teams/Public Access)

I've created a registration endpoint (`/api/auth/register`) that allows users to sign up themselves.

### Steps to Enable:

1. **The registration endpoint is already created** at `app/api/auth/register/route.ts`

2. **Create a registration page** (or add registration to your login page):
   - Users can POST to `/api/auth/register` with:
     ```json
     {
       "email": "user@example.com",
       "password": "password123",
       "name": "User Name"
     }
     ```

3. **Deploy the changes** to Railway

4. **Share your app URL** - users can now register themselves!

### Registration Endpoint Details:

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Success Response (201):**

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

**Error Responses:**

- `400`: Missing required fields or invalid email format
- `409`: User already exists
- `500`: Server error

### Pros:

- ✅ Users can sign up themselves
- ✅ No manual user creation needed
- ✅ Scalable for many users

### Cons:

- ❌ Anyone with the URL can register
- ❌ May need email verification for production
- ❌ Requires a registration UI

---

## Option 3: Admin User Management Interface

Create an admin panel where admins can create users. This is the most professional solution but requires more development.

### Features to Build:

- Admin-only user creation form
- User list view
- User role management
- User deletion/deactivation

---

## Recommended Approach

**For now (quick solution):**

1. Use **Option 1** (manual user creation script)
2. Edit `scripts/create-users.ts` with your team's emails
3. Run it via Railway CLI
4. Share credentials securely

**For production (better UX):**

1. Add a registration page/component
2. Use **Option 2** (public registration)
3. Consider adding email verification
4. Optionally restrict registration (invite-only, domain whitelist, etc.)

---

## Security Considerations

### Current Setup:

- ✅ Passwords are hashed with bcrypt
- ✅ Sessions use HTTP-only cookies
- ✅ HTTPS enforced in production

### Recommendations for Production:

- Add email verification for new registrations
- Implement password strength requirements (already done - min 6 chars)
- Add rate limiting to registration endpoint
- Consider invite codes or domain whitelisting
- Add 2FA for admin accounts
- Regular security audits

---

## Quick Start: Create Users Now

1. **Edit** `scripts/create-users.ts` with your team's information

2. **Run via Railway CLI:**

   ```bash
   railway login
   railway link
   railway run npx tsx scripts/create-users.ts
   ```

3. **Share the app URL** and credentials with your team

4. **Users log in** at: `https://your-app.railway.app`

---

## Testing Registration Endpoint

If you want to test the registration endpoint:

```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

This will create a new user and automatically log them in (returns session cookie).

---

## Railway User Creation Troubleshooting

### The Problem

When running `railway run` locally, it uses Railway's environment variables (including `DATABASE_PATH=/app/data/database.db`), but `/app` doesn't exist on your local machine.

### Solution 1: Override DATABASE_PATH

When running scripts locally via `railway run`, override the DATABASE_PATH:

```bash
DATABASE_PATH=./data/database.db railway run npx tsx scripts/create-test-user-quick.ts
```

### Solution 2: Use Railway Shell (Recommended)

Run directly in the Railway environment:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Deployments** → Click the three dots on latest deployment → **Shell**
4. Run:
   ```bash
   npx tsx scripts/create-test-user-quick.ts
   ```

### Solution 3: Use Railway CLI Shell

```bash
railway shell
npx tsx scripts/create-test-user-quick.ts
```

This runs directly in the Railway environment where `/app/data` exists.
