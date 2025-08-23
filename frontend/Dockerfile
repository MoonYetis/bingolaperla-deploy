# Frontend Dockerfile - Multi-stage build with Nginx
# Stage 1: Build the React application
FROM node:24-alpine AS builder

# Install system dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bingo -u 1001 -G nodejs && \
    chown -R bingo:nodejs /usr/share/nginx/html && \
    chown -R bingo:nodejs /var/cache/nginx && \
    chown -R bingo:nodejs /var/log/nginx && \
    chown -R bingo:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R bingo:nodejs /var/run/nginx.pid

# Switch to non-root user
USER bingo

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]