#!/bin/bash

# Docker build script for TapTap
# Usage: ./docker-build.sh [tag]
# Builds two targets: taptap-migrations, taptap (production)

set -e

# Default values
DEFAULT_TAG="latest"
TAG="${1:-$DEFAULT_TAG}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get git commit hash for labeling
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

BUILD_ARGS="--build-arg GIT_COMMIT=${GIT_COMMIT} --build-arg BUILD_DATE=${BUILD_DATE}"
LABELS="--label git.commit=${GIT_COMMIT} --label build.date=${BUILD_DATE}"

echo -e "${GREEN}Building TapTap Docker images...${NC}"

# Build migrations image
echo -e "${YELLOW}Building taptap-migrations:${TAG}...${NC}"
docker build \
  ${BUILD_ARGS} ${LABELS} \
  --target migrations \
  -t "taptap-migrations:${TAG}" \
  -t "taptap-migrations:${GIT_COMMIT}" \
  .

echo -e "${GREEN}Successfully built taptap-migrations:${TAG}${NC}"

# Build production server image
echo -e "${YELLOW}Building taptap:${TAG}...${NC}"
docker build \
  ${BUILD_ARGS} ${LABELS} \
  --target production \
  -t "taptap:${TAG}" \
  -t "taptap:${GIT_COMMIT}" \
  .

echo -e "${GREEN}Successfully built taptap:${TAG}${NC}"

# Show image info
echo -e "\n${YELLOW}Image details:${NC}"
docker images "taptap*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -5
