# Backend Dockerfile - Multi-stage build optimized for production
# Stage 1: Build dependencies and compile TypeScript
FROM node:24-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --only=production=false --silent

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce size
RUN npm prune --omit=dev

# Stage 2: Runtime environment
FROM node:24-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bingo -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=bingo:nodejs /app/dist ./dist
COPY --from=builder --chown=bingo:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bingo:nodejs /app/package*.json ./
COPY --from=builder --chown=bingo:nodejs /app/prisma ./prisma

# Create logs directory
RUN mkdir -p /app/logs && chown bingo:nodejs /app/logs

# Switch to non-root user
USER bingo

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]