# Railway Build Fix - Nixpacks Error

## The Problem

Railway is generating a Nix configuration that incorrectly references `make` as a variable instead of using the proper Nix package name `gnumake`.

## Solution Options

### Option 1: Use Railway Environment Variables (Recommended)

In Railway Dashboard → Your Service → Variables, add:

```
NIXPACKS_PKGS=nodejs-20_x python3 gcc gnumake
```

Then remove `nixpacks.toml` and let Railway auto-detect.

### Option 2: Use Minimal nixpacks.toml

Keep the `nixpacks.toml` file with `gnumake` instead of `make`.

### Option 3: Clear Railway Build Cache

1. Railway Dashboard → Settings → Advanced
2. Clear build cache
3. Redeploy

### Option 4: Switch to Dockerfile (If Nixpacks continues to fail)

Create a `Dockerfile`:

```dockerfile
FROM node:20

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Then in Railway → Settings → Build → Change builder to "Dockerfile"
