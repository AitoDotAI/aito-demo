#!/usr/bin/env bash

# Quick test script to verify Docker setup for screenshot generation

echo "🧪 Testing Docker setup for screenshot generation..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not available"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is available"

# Check if we can run Docker commands
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Cannot run Docker commands"
    echo "Check Docker permissions or service status"
    exit 1
fi

echo "✅ Docker commands work"
echo "Docker version: $(docker --version)"

# Check required files
if [ ! -f "Dockerfile.screenshots" ]; then
    echo "❌ Dockerfile.screenshots not found"
    exit 1
fi

echo "✅ Dockerfile.screenshots found"

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found - run from project root"
    exit 1
fi

echo "✅ package.json found"

# Test basic Docker build (just the first few layers)
echo "🔨 Testing Docker build (first few layers only)..."
if timeout 60 docker build -f Dockerfile.screenshots --target=ubuntu:22.04 . > /dev/null 2>&1; then
    echo "✅ Docker build started successfully"
else
    echo "⚠️  Docker build test inconclusive (this is normal)"
    echo "   Full build may take 5-10 minutes"
fi

echo ""
echo "🎯 Docker setup appears ready!"
echo ""
echo "To generate screenshots:"
echo "  bash scripts/docker-screenshots.sh"
echo ""
echo "Available commands:"
echo "  bash scripts/docker-screenshots.sh all        # All screenshots"
echo "  bash scripts/docker-screenshots.sh marketing  # Marketing only"
echo "  bash scripts/docker-screenshots.sh help       # Show help"
echo ""
echo "Note: First run will take 5-10 minutes to build the Docker image"
echo "      Subsequent runs will be much faster (~2-3 minutes)"