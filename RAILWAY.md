# Railway Deployment Guide

## Quick Setup Steps

### 1. Configure Environment Variables

In your Railway project dashboard, go to **Variables** and add:

```bash
# Required - OpenAI API Key
OPENAI_API_KEY=sk-proj-your-key-here

# Required - Database Path (Railway persistent volume)
DATABASE_PATH=/app/data/database.db

# Required - Session Secret (generate a random string)
SESSION_SECRET=your-secure-random-secret-here

# Optional - Node Environment
NODE_ENV=production
```

**To generate SESSION_SECRET:**

```bash
openssl rand -base64 32
```

### 2. Add Persistent Volume

1. In Railway dashboard, go to your service
2. Click **Settings** → **Volumes**
3. Click **+ New Volume**
4. Set mount path: `/app/data`
5. Set size: `10GB` (or as needed)

### 3. Configure Build Settings

Railway should auto-detect Next.js, but verify:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Root Directory:** `/` (default)

### 4. Configure Health Check (Optional but Recommended)

1. Go to **Settings** → **Health Check**
2. Set path: `/api/health`
3. Set interval: `30` seconds
4. Set timeout: `10` seconds

### 5. Deploy

Railway will automatically deploy when you push to your connected GitHub branch.

## Troubleshooting Build Failures

### Issue: Build fails with "better-sqlite3" errors

**Solution:** The `nixpacks.toml` file is already configured with build tools. If issues persist:

- Ensure Railway is using Nixpacks builder (not Dockerfile)
- Check build logs for specific error messages

### Issue: Database not found

**Solution:**

- Verify `DATABASE_PATH=/app/data/database.db` is set
- Ensure persistent volume is mounted at `/app/data`
- The database will be created automatically on first run

### Issue: Husky prepare script fails

**Solution:** Already fixed in `package.json` with `|| true` fallback

### Issue: Health check fails

**Solution:**

- Verify `/api/health` endpoint exists (already created)
- Check that database connection is working
- Review Railway logs for errors

## Verifying Deployment

1. **Check Build Logs:** Railway dashboard → Deployments → View logs
2. **Test Health Endpoint:** `https://your-app.railway.app/api/health`
3. **Test Login:** `https://your-app.railway.app/login`
4. **Check Database:** Verify persistent volume has database file

## Post-Deployment

1. **Create Test User:** You'll need to run the create-test-user script manually or via Railway CLI
2. **Initialize Database:** Database tables are created automatically on first import
3. **Monitor Logs:** Use Railway dashboard to monitor application logs

## Railway CLI (Optional)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Set variables
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set DATABASE_PATH=/app/data/database.db
railway variables set SESSION_SECRET=your-secret

# View logs
railway logs
```
