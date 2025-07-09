#!/usr/bin/env bash

# Docker-based Screenshot Generation Script for NixOS
# This script builds a Docker container with all necessary dependencies
# and generates screenshots by mounting the local filesystem

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="aito-demo-screenshots"
CONTAINER_NAME="aito-screenshots-runner"
APP_DIR="/app"
HOST_SCREENSHOT_DIR="$(pwd)/docs/screenshots"

echo -e "${BLUE}🐳 Aito Demo Screenshot Generator (Docker)${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not available in PATH"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "Dockerfile.screenshots" ]; then
    print_error "Please run this script from the aito-demo root directory"
    exit 1
fi

print_status "Starting Docker-based screenshot generation..."

# Clean up any existing container
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_status "Removing existing container..."
    docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1
fi

# Build Docker image
echo -e "\n${BLUE}📦 Building Docker image...${NC}"
if docker build -f Dockerfile.screenshots -t ${DOCKER_IMAGE} .; then
    print_status "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Ensure screenshots directory exists
mkdir -p ${HOST_SCREENSHOT_DIR}/features
mkdir -p ${HOST_SCREENSHOT_DIR}/marketing
mkdir -p ${HOST_SCREENSHOT_DIR}/tutorials
mkdir -p ${HOST_SCREENSHOT_DIR}/documentation

# Function to run screenshots with Docker
run_screenshots() {
    local command=${1:-"npm run screenshots:all"}
    
    echo -e "\n${BLUE}📸 Running screenshot generation...${NC}"
    echo "Command: ${command}"
    
    # Start the development server in background and run screenshots
    docker run --rm \
        --name ${CONTAINER_NAME} \
        -v "$(pwd)/docs/screenshots:${APP_DIR}/docs/screenshots" \
        -v "$(pwd)/tests:${APP_DIR}/tests" \
        -v "$(pwd)/playwright.config.js:${APP_DIR}/playwright.config.js" \
        -p 3001:3000 \
        ${DOCKER_IMAGE} \
        bash -c "
            echo 'Starting development server...'
            npm start > /dev/null 2>&1 &
            
            echo 'Waiting for server to start...'
            for i in {1..30}; do
                if curl -s http://localhost:3000 > /dev/null 2>&1; then
                    echo 'Server is ready!'
                    break
                fi
                if [ \$i -eq 30 ]; then
                    echo 'Server failed to start'
                    exit 1
                fi
                sleep 2
            done
            
            echo 'Generating screenshots with Playwright...'
            if [ \"\${command}\" = \"npm run screenshots:all\" ]; then
                npx playwright test tests/screenshots.spec.js --project=chromium
            elif [ \"\${command}\" = \"npm run screenshots:specific\" ]; then
                npx playwright test tests/screenshots.spec.js --project=chromium --grep 'Specific Feature Screenshots'
            else
                npx playwright test tests/screenshots.spec.js --project=chromium
            fi
            
            echo 'Generated files:'
            find docs/screenshots -name '*.png' -type f -exec ls -la {} \; 2>/dev/null || echo 'No PNG files generated'
            
            echo 'Screenshots generated!'
            echo 'Stopping development server...'
            pkill -f 'react-scripts start' || true
        "
}

# Parse command line arguments
case "${1:-all}" in
    "all")
        run_screenshots "npm run screenshots:all"
        ;;
    "marketing")
        run_screenshots "npm run screenshots:marketing"
        ;;
    "tutorials")
        run_screenshots "npm run screenshots:tutorials"
        ;;
    "docs")
        run_screenshots "npm run screenshots:docs"
        ;;
    "specific")
        run_screenshots "npm run screenshots:specific"
        ;;
    "placeholders")
        run_screenshots "npm run screenshots:placeholders"
        ;;
    "test")
        run_screenshots "npx playwright test tests/screenshots.spec.js"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  all          Generate all screenshots (default)"
        echo "  marketing    Generate marketing screenshots only"
        echo "  tutorials    Generate tutorial screenshots only"  
        echo "  docs         Generate documentation screenshots only"
        echo "  specific     Generate specific feature screenshots with custom content"
        echo "  placeholders Generate placeholder screenshots only"
        echo "  test         Run Playwright screenshot tests"
        echo "  help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Generate all screenshots"
        echo "  $0 marketing          # Marketing screenshots only"
        echo "  $0 placeholders       # Generate placeholders"
        exit 0
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    print_status "Screenshot generation completed successfully!"
    echo ""
    echo "📁 Screenshots location: ${HOST_SCREENSHOT_DIR}"
    echo "📊 Check the following directories:"
    echo "   • docs/screenshots/features/     - Main functionality screenshots"
    echo "   • docs/screenshots/marketing/    - Marketing materials"
    echo "   • docs/screenshots/tutorials/    - Tutorial images"
    echo ""
    echo "🔄 To regenerate screenshots, run: $0 [COMMAND]"
else
    print_error "Screenshot generation failed"
    exit 1
fi

# Optional: Clean up Docker image
read -p "Do you want to remove the Docker image to save space? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi ${DOCKER_IMAGE}
    print_status "Docker image removed"
fi

echo -e "\n${GREEN}🎉 Screenshot generation complete!${NC}"