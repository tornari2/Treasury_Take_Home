# Railway Environment Variable Troubleshooting

## Issue: OpenAI API Key Not Detected

If you're seeing "OpenAI API key is not configured" error even though you've set it in Railway:

## Step 1: Verify Railway Environment Variable

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Verify:
   - Variable name is exactly: `OPENAI_API_KEY` (case-sensitive, no spaces)
   - Value starts with `sk-` (e.g., `sk-proj-...`)
   - No extra quotes or spaces around the value
   - Variable is set for the correct service/environment

## Step 2: Redeploy After Setting Variables

**IMPORTANT:** Railway requires a redeploy for environment variables to take effect!

After adding/changing environment variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** or trigger a new deployment
3. Wait for deployment to complete

## Step 3: Check Railway Logs

1. Go to **Deployments** → Latest deployment → **View Logs**
2. Look for any errors related to environment variables
3. Check if the app started successfully

## Step 4: Test Environment Variable Access

I've created a debug endpoint to check if the variable is accessible:

1. **Enable debug mode** (temporarily):
   - In Railway Variables, add: `ENABLE_ENV_DEBUG=true`
   - Redeploy

2. **Check the debug endpoint**:
   ```
   https://your-app.railway.app/api/debug/env
   ```

3. **This will show**:
   - Whether OPENAI_API_KEY exists
   - Its length and prefix/suffix (not the full key)
   - Other environment variables

4. **Disable debug mode** after checking:
   - Remove `ENABLE_ENV_DEBUG` variable
   - Redeploy

## Common Issues

### Issue 1: Variable Not Set Correctly
- **Symptom:** Variable doesn't exist
- **Fix:** Double-check variable name is exactly `OPENAI_API_KEY` (case-sensitive)

### Issue 2: Wrong Service/Environment
- **Symptom:** Variable exists but app doesn't see it
- **Fix:** Make sure variable is set for the service that's running, not a different service

### Issue 3: Not Redeployed
- **Symptom:** Variable set but app still shows error
- **Fix:** **Redeploy after setting variables!** Railway doesn't inject new env vars into running containers.

### Issue 4: Value Has Extra Characters
- **Symptom:** Key exists but validation fails
- **Fix:** Check for extra quotes, spaces, or newlines in the value

### Issue 5: Next.js Build-Time vs Runtime
- **Symptom:** Variable works locally but not on Railway
- **Fix:** Next.js API routes should have access to `process.env` at runtime. If not, check Railway logs.

## Quick Test

Run this in Railway shell to verify:

```bash
# SSH into Railway
railway shell

# Check if variable exists
echo $OPENAI_API_KEY

# Should show your key (starts with sk-)
```

## Still Not Working?

1. Check Railway logs for errors
2. Verify variable name spelling
3. Try removing and re-adding the variable
4. Redeploy after any changes
5. Check if there are multiple services (variable might be on wrong one)

## Security Note

The debug endpoint only works when `ENABLE_ENV_DEBUG=true` is set. Remove it after debugging!
