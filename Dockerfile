# =============================================================================
# Personal Guide - Multi-stage Docker Build
# Optimized for production deployment with security and performance
# =============================================================================

# Build stage - Use Node.js 20 for compatibility
FROM node:20-alpine AS builder

# Install security updates and build dependencies
RUN apk update && apk upgrade && apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages ./packages/

# Install dependencies with optimizations
RUN npm ci --only=production --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# Build the application
WORKDIR /app/apps/web
RUN npm run build

# =============================================================================
# Production stage - Minimal runtime image
# =============================================================================

FROM node:20-alpine AS runner

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    tini \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node /app/healthcheck.js || exit 1

# Create healthcheck script
COPY --chown=nextjs:nodejs <<EOF /app/healthcheck.js
const http = require('http');
const options = {
  host: 'localhost',
  port: 3000,
  path: '/api/health',
  timeout: 2000,
};
const request = http.request(options, (res) => {
  console.log(\`STATUS: \${res.statusCode}\`);
  process.exitCode = (res.statusCode === 200) ? 0 : 1;
  process.exit();
});
request.on('error', function(err) {
  console.log('ERROR', err);
  process.exit(1);
});
request.end();
EOF

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "apps/web/server.js"]