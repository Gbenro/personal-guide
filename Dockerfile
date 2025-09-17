# Railway-optimized Dockerfile for Personal Guide
FROM node:20-alpine

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/web/package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy app source
COPY apps/web/ ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]