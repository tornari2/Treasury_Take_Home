# Railway Empty Logs - Step-by-Step Fix

If your Railway logs are empty, follow these steps **in order**:

## Step 1: Verify Files Are Committed and Pushed

```bash
# Make sure all Railway config files are committed
git add next.config.js app/api/health/route.ts
git commit -m "Add Railway deployment configuration"
git push origin main  # or master, depending on your branch
```

## Step 2: Check Railway Service Configuration

In Railway Dashboard:

1. **Go to your Service** → Click on the service name
2. **Settings Tab** → Check:
   - ✅ **Root Directory:** Should be `/` (empty or root)
   - ✅ **Build Command:** Should be `npm install && npm run build` OR leave as "Auto"
   - ✅ **Start Command:** Should be `npm start` OR leave as "Auto"
   - ✅ **Builder:** Should be "Railpack" (auto-detects Next.js)

## Step 3: Verify GitHub Connection

1. **Settings** → **Source**
   - ✅ GitHub repo is connected
   - ✅ Correct branch selected (`main` or `master`)
   - ✅ Auto-deploy is enabled

## Step 4: Manually Trigger Deployment

1. **Deployments Tab** → Click **"Redeploy"** or **"Deploy"**
2. Select the latest commit
3. Watch for build logs to appear

## Step 5: Check Environment Variables

**Variables Tab** - Ensure these are set:

```bash
OPENAI_API_KEY=sk-proj-your-actual-key
DATABASE_PATH=/app/data/database.db
NODE_ENV=production
```

## Step 6: Verify Persistent Volume

**Settings** → **Volumes**:

- ✅ Volume exists
- ✅ Mount path: `/app/data`
- ✅ Volume is attached to this service

## Step 7: Use Railway CLI to Debug

If logs are still empty, use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View logs (this will show real-time logs)
railway logs

# Or view logs for a specific deployment
railway logs --deployment <deployment-id>
```

## Step 8: Check Railway Status

- Go to Railway Dashboard → Your Project
- Check if service shows as "Building", "Deploying", or "Failed"
- If "Failed", click on it to see error details

## Step 9: Verify Project Structure

Railway needs these files in the root:

- ✅ `package.json` (exists)
- ✅ `next.config.js` (exists)
- ✅ `app/` directory (exists)

## Step 10: Try Creating a New Service

If nothing works:

1. **Delete the current service** (or create a new project)
2. **Create New Service** → **GitHub Repo**
3. Select your repo
4. Railway should auto-detect Next.js
5. Configure environment variables
6. Add persistent volume
7. Deploy

## Common Causes of Empty Logs

1. **Service not connected to GitHub** - Check Settings → Source
2. **Wrong branch selected** - Should be `main` or `master`
3. **Build not triggered** - Manually trigger deployment
4. **Service paused** - Check service status
5. **Billing issue** - Check Railway account status
6. **Root directory wrong** - Should be `/` not `/app` or other

## Still Not Working?

If logs are still empty after trying all steps:

1. **Check Railway Status Page:** https://status.railway.app
2. **Contact Railway Support:** support@railway.app
3. **Try Railway Discord:** https://discord.gg/railway

## Quick Test: Force a Deployment

```bash
# Make a small change to trigger deployment
echo "# Railway test" >> README.md
git add README.md
git commit -m "Trigger Railway deployment"
git push
```

Then watch Railway dashboard for the new deployment.
