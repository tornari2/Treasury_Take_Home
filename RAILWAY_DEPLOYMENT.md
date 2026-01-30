# Railway Deployment Guide

This guide will walk you through deploying your Treasury Take Home application to Railway.

## Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. Your GitHub repository connected to Railway
3. An OpenAI API key

## Step 1: Create a New Railway Project

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `Treasury_Take_Home`
5. Railway will automatically detect it's a Next.js project

## Step 2: Configure Environment Variables

In your Railway project dashboard, go to the **Variables** tab and add the following:

### Required Variables

```bash
OPENAI_API_KEY=sk-proj-your-key-here
DATABASE_PATH=/app/data/database.db
NODE_ENV=production
```

### Optional Variables

```bash
# If you need to customize the port (Railway sets PORT automatically)
PORT=3000
```

**Note:** Railway automatically sets `PORT` environment variable, and Next.js will use it. You typically don't need to set this manually.

## Step 3: Add Persistent Volume for SQLite Database

Since SQLite stores data in a file, you need persistent storage:

1. In your Railway service, go to **Settings**
2. Scroll down to **Volumes**
3. Click **"Add Volume"**
4. Configure:
   - **Mount Path:** `/app/data`
   - **Size:** 10GB (or as needed)
5. Click **"Add"**

This ensures your database persists across deployments.

## Step 4: Configure Build Settings

Railway should auto-detect your Next.js app, but verify these settings:

1. Go to **Settings** → **Build**
2. Ensure:
   - **Build Command:** `npm install && npm run build` (or Railway auto-detects)
   - **Start Command:** `npm start`
   - **Root Directory:** `/` (root)

## Step 5: Configure Health Checks (Optional but Recommended)

1. Go to **Settings** → **Health Checks**
2. Configure:
   - **Path:** `/api/health`
   - **Interval:** 30 seconds
   - **Timeout:** 10 seconds

## Step 6: Deploy

Railway will automatically:

1. Build your Docker image (using the provided `Dockerfile`)
2. Run `npm install`
3. Run `npm run build`
4. Start the app with `npm start`
5. Expose it on Railway's domain

## Step 7: Initialize the Database

After the first deployment, you need to initialize the database:

1. Go to your Railway service dashboard
2. Click on **"View Logs"** or use the **CLI**:

```bash
# Install Railway CLI if you haven't
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run database migrations
railway run npx tsx lib/migrations.ts
```

Alternatively, you can add a startup script that runs migrations automatically. Create a file `scripts/init-db.ts`:

```typescript
import { runMigrations } from '../lib/migrations';

runMigrations()
  .then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
```

Then update your `package.json` start script to:

```json
{
  "scripts": {
    "start": "node scripts/init-db.js && next start"
  }
}
```

## Step 8: Create a Test User

After deployment, create a test user:

```bash
railway run npx tsx scripts/create-test-user.ts
```

Or SSH into your Railway service and run it there.

## Step 9: Access Your Application

1. Railway will provide a domain like: `your-app-name.up.railway.app`
2. You can also set a custom domain in **Settings** → **Networking**

## Troubleshooting

### Database Issues

If you see database errors:

- Ensure the volume is mounted at `/app/data`
- Check that `DATABASE_PATH` is set to `/app/data/database.db`
- Verify the volume has write permissions

### Build Failures

- Check build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version matches (18+)

### Port Issues

- Next.js automatically uses Railway's `PORT` environment variable
- Don't hardcode port 3000 in your code
- Railway sets `PORT` automatically - no action needed

### Environment Variables Not Working

- Ensure variables are set in Railway dashboard (not just `.env` files)
- `.env` files are not used in production - use Railway's Variables tab
- Restart the service after adding new variables

## Monitoring

- **Logs:** View real-time logs in Railway dashboard
- **Metrics:** Check CPU, memory, and network usage
- **Health:** Monitor health check endpoint at `/api/health`

## Continuous Deployment

Railway automatically deploys when you push to your connected branch (usually `main` or `master`). To disable auto-deploy:

1. Go to **Settings** → **Source**
2. Toggle **"Auto Deploy"** off

## Backup Strategy

Since you're using SQLite:

1. Download database backups periodically from Railway volume
2. Or set up automated backups using Railway's volume snapshot feature
3. Consider migrating to PostgreSQL for production (Railway offers managed PostgreSQL)

## Cost Optimization

- Railway offers a free tier with $5 credit/month
- Monitor usage in the dashboard
- Consider upgrading if you exceed free tier limits

## Next Steps

1. Set up a custom domain (optional)
2. Configure SSL (automatic with Railway)
3. Set up monitoring and alerts
4. Consider database backups
5. Review and optimize performance

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)

---

## Deployment Checklist

Use this checklist to ensure a smooth deployment.

### Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally (`npm run test:run`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables documented (see `.env.example`)

### Railway Setup

- [ ] Created Railway account
- [ ] Connected GitHub repository to Railway
- [ ] Created new Railway project
- [ ] Railway auto-detected Next.js project

### Configuration

- [ ] Set `OPENAI_API_KEY` in Railway Variables
- [ ] Set `DATABASE_PATH=/app/data/database.db` in Railway Variables
- [ ] Set `NODE_ENV=production` in Railway Variables
- [ ] Added persistent volume at `/app/data` (10GB recommended)
- [ ] Verified build command: `npm install && npm run build`
- [ ] Verified start command: `npm start`
- [ ] Configured health check: `/api/health` (optional but recommended)

### Post-Deployment

- [ ] Verified deployment succeeded (check Railway logs)
- [ ] Database initialized automatically (migrations run on first access)
- [ ] Health check endpoint returns 200: `https://your-app.railway.app/api/health`
- [ ] Created test user (see User Access Guide)
- [ ] Tested login functionality
- [ ] Verified application functionality

### Verification Commands

```bash
# Check health
curl https://your-app.railway.app/api/health

# View logs (via Railway CLI)
railway logs
```

### Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure monitoring/alerts
- [ ] Set up database backups
- [ ] Review Railway usage/billing
