#!/bin/bash

echo "🚀 Starting Production Frontend Deployment..."

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
print_status "Building and starting frontend container..."
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

# Verify deployment
print_status "Verifying deployment..."
if curl -s http://localhost:8081/health > /dev/null; then
    print_status "HTTP health check passed!"
else
    print_error "HTTP health check failed!"
    exit 1
fi

# Show status
print_status "Production frontend deployment completed!"
echo ""
echo "🌐 Frontend URL: http://13.234.111.169:8081"
echo "🏥 Health Check: http://localhost:8081/health"
echo "🔗 Backend URL: ${VITE_API_BASE_URL}"
echo ""
echo "📋 Management commands:"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose down            # Stop frontend"
echo "  docker-compose restart         # Restart frontend"
echo "  docker-compose ps              # Check status"
echo "  docker stats quiz-app-frontend-prod  # Monitor resources"
echo ""
print_status "✅ Frontend is now running in production mode!"
print_status "🎯 IMPORTANT: Add http://13.234.111.169:8081 to your OTPLESS dashboard allowed domains"
print_status "Students can access it at: http://13.234.111.169:8081" 