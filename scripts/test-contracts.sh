#!/bin/bash

# Run tests for all Soroban smart contracts

set -e

echo "🧪 Running Smart Contract Tests..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

CONTRACTS=(
    "token-factory"
    "amm-pair"
)

FAILED=0

for CONTRACT in "${CONTRACTS[@]}"; do
    if [ -d "contracts/$CONTRACT" ]; then
        echo -e "${BLUE}Testing $CONTRACT...${NC}"

        cd "contracts/$CONTRACT"

        if cargo test; then
            echo -e "${GREEN}✓ $CONTRACT tests passed${NC}"
        else
            echo -e "${RED}✗ $CONTRACT tests failed${NC}"
            FAILED=1
        fi

        cd ../..
    fi
done

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
