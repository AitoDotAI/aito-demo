#!/bin/bash

# Build and push aito-demo backend container to Azure Container Registry

set -e

# Configuration
ACR_NAME="aitodemoacr"
IMAGE_NAME="aito-demo"
TAG="backend-relative-urls"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Building aito-demo backend container...${NC}"

# Build the container
docker build -f Dockerfile.backend -t ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TAG} .

echo -e "${YELLOW}Logging into Azure Container Registry...${NC}"

# Login to ACR
az acr login --name ${ACR_NAME}

echo -e "${YELLOW}Pushing container to registry...${NC}"

# Push the container
docker push ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TAG}

echo -e "${GREEN}Container successfully pushed!${NC}"
echo -e "${GREEN}Image: ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TAG}${NC}"

# Also tag as latest
docker tag ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TAG} ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest
docker push ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest

echo -e "${GREEN}Also tagged and pushed as 'latest'${NC}"