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

# Set build arguments that Railway will override with real values
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key
ARG SUPABASE_SERVICE_ROLE_KEY=placeholder_service_key
ARG ANTHROPIC_API_KEY=placeholder_anthropic_key
ARG OPENAI_API_KEY=placeholder_openai_key

# Export as environment variables for the build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]