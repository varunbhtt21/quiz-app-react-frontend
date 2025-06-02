# Frontend Dockerfile for QuizMaster React App
# Multi-stage build for optimized production image

# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Declare build arguments
ARG VITE_API_BASE_URL
ARG VITE_OTPLESS_APP_ID
ARG VITE_NODE_ENV

# Set environment variables from build args
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OTPLESS_APP_ID=$VITE_OTPLESS_APP_ID
ENV VITE_NODE_ENV=$VITE_NODE_ENV

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application (env vars are now available)
RUN npm run build

# Stage 2: Production Stage with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 