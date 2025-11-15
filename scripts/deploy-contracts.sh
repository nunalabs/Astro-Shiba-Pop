#!/bin/bash

# Deploy all smart contracts to Stellar testnet
# This script deploys and initializes all contracts

set -e

echo "🚀 Deploying Smart Contracts to Stellar Testnet..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Copy .env.example to .env and configure it"
    exit 1
fi

# Check required environment variables
NETWORK=${STELLAR_NETWORK:-testnet}
SOURCE_ACCOUNT=${DEPLOYER_SECRET_KEY:-""}

if [ -z "$SOURCE_ACCOUNT" ]; then
    echo -e "${YELLOW}Warning: DEPLOYER_SECRET_KEY not set${NC}"
    echo "Using 'dev' identity from Soroban CLI"
    SOURCE_ACCOUNT="dev"
fi

echo -e "${BLUE}Network: $NETWORK${NC}"
echo -e "${BLUE}Source Account: $SOURCE_ACCOUNT${NC}"

# Deploy Token Factory
echo -e "${BLUE}Deploying Token Factory...${NC}"

TOKEN_FACTORY_WASM="contracts/token-factory/target/wasm32-unknown-unknown/release/token_factory.optimized.wasm"

if [ ! -f "$TOKEN_FACTORY_WASM" ]; then
    echo -e "${RED}Error: Token Factory WASM not found${NC}"
    echo "Run ./scripts/build-contracts.sh first"
    exit 1
fi

TOKEN_FACTORY_ID=$(soroban contract deploy \
    --wasm "$TOKEN_FACTORY_WASM" \
    --source "$SOURCE_ACCOUNT" \
    --network "$NETWORK")

echo -e "${GREEN}✓ Token Factory deployed: $TOKEN_FACTORY_ID${NC}"

# Initialize Token Factory
echo -e "${BLUE}Initializing Token Factory...${NC}"

ADMIN_ADDRESS=$(soroban keys address "$SOURCE_ACCOUNT")
TREASURY_ADDRESS=$ADMIN_ADDRESS  # Using same address for MVP

soroban contract invoke \
    --id "$TOKEN_FACTORY_ID" \
    --source "$SOURCE_ACCOUNT" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --treasury "$TREASURY_ADDRESS"

echo -e "${GREEN}✓ Token Factory initialized${NC}"

# Deploy AMM Pair (if exists)
if [ -f "contracts/amm-pair/target/wasm32-unknown-unknown/release/amm_pair.optimized.wasm" ]; then
    echo -e "${BLUE}Deploying AMM Pair Factory...${NC}"

    AMM_PAIR_WASM="contracts/amm-pair/target/wasm32-unknown-unknown/release/amm_pair.optimized.wasm"

    AMM_FACTORY_ID=$(soroban contract deploy \
        --wasm "$AMM_PAIR_WASM" \
        --source "$SOURCE_ACCOUNT" \
        --network "$NETWORK")

    echo -e "${GREEN}✓ AMM Pair Factory deployed: $AMM_FACTORY_ID${NC}"

    # Initialize AMM Factory
    soroban contract invoke \
        --id "$AMM_FACTORY_ID" \
        --source "$SOURCE_ACCOUNT" \
        --network "$NETWORK" \
        -- \
        initialize \
        --admin "$ADMIN_ADDRESS" \
        --fee_to "$TREASURY_ADDRESS"

    echo -e "${GREEN}✓ AMM Factory initialized${NC}"
fi

# Save contract addresses to .env
echo ""
echo -e "${BLUE}Updating .env with contract addresses...${NC}"

# Create or update .env
if [ -f .env ]; then
    # Remove old contract IDs
    sed -i.bak '/^TOKEN_FACTORY_CONTRACT_ID=/d' .env
    sed -i.bak '/^AMM_FACTORY_CONTRACT_ID=/d' .env
    rm .env.bak
fi

# Append new contract IDs
echo "TOKEN_FACTORY_CONTRACT_ID=$TOKEN_FACTORY_ID" >> .env
if [ ! -z "$AMM_FACTORY_ID" ]; then
    echo "AMM_FACTORY_CONTRACT_ID=$AMM_FACTORY_ID" >> .env
fi

echo -e "${GREEN}✓ Contract addresses saved to .env${NC}"

# Display summary
echo ""
echo "========================================="
echo -e "${GREEN}Deployment Summary${NC}"
echo "========================================="
echo -e "Network: ${BLUE}$NETWORK${NC}"
echo -e "Token Factory: ${BLUE}$TOKEN_FACTORY_ID${NC}"
if [ ! -z "$AMM_FACTORY_ID" ]; then
    echo -e "AMM Factory: ${BLUE}$AMM_FACTORY_ID${NC}"
fi
echo -e "Admin: ${BLUE}$ADMIN_ADDRESS${NC}"
echo "========================================="
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "You can now use these contracts in your application."
