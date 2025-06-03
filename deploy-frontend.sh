#!/bin/bash

echo "🚀 Starting Production Frontend Deployment with HTTPS..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create SSL directories and certificates
print_status "Setting up SSL certificates..."
mkdir -p ssl/certs ssl/private

# Generate self-signed SSL certificate if not exists
if [ ! -f ssl/certs/nginx-selfsigned.crt ] || [ ! -f ssl/private/nginx-selfsigned.key ]; then
    print_status "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/private/nginx-selfsigned.key \
        -out ssl/certs/nginx-selfsigned.crt \
        -subj "/C=IN/ST=State/L=City/O=Silicon Institute/OU=IT Department/CN=13.234.111.169"
    print_status "SSL certificate generated successfully"
else
    print_status "SSL certificate already exists"
fi

# Set proper permissions
chmod 600 ssl/private/nginx-selfsigned.key
chmod 644 ssl/certs/nginx-selfsigned.crt

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_status "Environment variables loaded from .env"
else
    print_error ".env file not found. Please create one with required variables."
    exit 1
fi

# Check if backend is accessible
print_status "Checking backend connectivity..."
if curl -s "${VITE_API_BASE_URL}/health" > /dev/null; then
    print_status "Backend is accessible at ${VITE_API_BASE_URL}"
else
    print_warning "Backend might not be accessible at ${VITE_API_BASE_URL}. Please ensure backend is running."
fi

# Stop existing frontend container if running
print_status "Stopping existing frontend container..."
docker-compose down 2>/dev/null || true

# Clean up old images
print_status "Cleaning up old Docker images..."
docker image prune -f

# Build and start frontend
print_status "Building and starting frontend container with HTTPS support..."
docker-compose up --build -d

# Wait for container to be healthy
print_status "Waiting for frontend to be healthy..."
for i in {1..30}; do
    if docker-compose ps | grep -q "healthy"; then
        print_status "Frontend is healthy!"
        break
    elif [ $i -eq 30 ]; then
        print_error "Frontend failed to become healthy"
        echo "Container logs:"
        docker-compose logs
        exit 1
    else
        echo "Waiting... ($i/30)"
        sleep 2
    fi
done

# Verify deployment - HTTP (should redirect)
print_status "Verifying deployment..."
if curl -s http://localhost:8081/health > /dev/null; then
    print_status "HTTP health check passed!"
else
    print_warning "HTTP health check failed (this is expected if redirect is working)"
fi

# Verify HTTPS deployment
if curl -s -k https://localhost:8443/health > /dev/null; then
    print_status "HTTPS health check passed!"
else
    print_error "HTTPS health check failed!"
    exit 1
fi

# Show status
print_status "Production frontend deployment completed!"
echo ""
echo "🌐 Frontend URLs:"
echo "  HTTP:  http://13.234.111.169:8081  (redirects to HTTPS)"
echo "  HTTPS: https://13.234.111.169:8443 (main access)"
echo ""
echo "🔐 SSL Certificate Info:"
echo "  Type: Self-signed certificate"
echo "  Valid for: 365 days"
echo "  CN: 13.234.111.169"
echo ""
echo "🏥 Health Checks:"
echo "  HTTP:  http://localhost:8081/health"
echo "  HTTPS: https://localhost:8443/health"
echo "🔗 Backend URL: ${VITE_API_BASE_URL}"
echo ""
echo "📋 Management commands:"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose down            # Stop frontend"
echo "  docker-compose restart         # Restart frontend"
echo "  docker-compose ps              # Check status"
echo "  docker stats quiz-app-frontend-prod  # Monitor resources"
echo ""
print_status "✅ Frontend is now running in production mode with HTTPS!"
print_status "🎯 IMPORTANT: Add https://13.234.111.169:8443 to your OTPLESS dashboard allowed domains"
print_status "🔒 Students can access it securely at: https://13.234.111.169:8443" 