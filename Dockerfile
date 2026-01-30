FROM node:20-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set build-time environment variables to prevent database initialization
ENV NEXT_PHASE=phase-production-build
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application
# Database initialization is skipped during build via NEXT_PHASE check
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
