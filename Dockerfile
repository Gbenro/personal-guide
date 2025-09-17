# Railway-optimized Dockerfile for Personal Guide
FROM node:20-alpine

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/web/package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy app source
COPY apps/web/ ./

# Note: NEXT_PUBLIC_ environment variables are injected at build time
# Railway will provide real values during the build process

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]