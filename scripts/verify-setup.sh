#!/bin/bash

# Phantom Darkpool - Setup Verification Script
# This script verifies that all required tools and dependencies are installed

set -e

echo "🔍 Verifying Phantom Darkpool Development Environment Setup..."
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_CHECKS_PASSED=true

# Function to check if a command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2 is installed"
        if [ -n "$3" ]; then
            VERSION=$($3 2>&1)
            echo "  Version: $VERSION"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $2 is NOT installed"
        echo -e "  ${YELLOW}Install: $4${NC}"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

# Check Node.js
echo "Checking Node.js..."
if check_command "node" "Node.js" "node --version" "https://nodejs.org/"; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "  ${YELLOW}⚠${NC} Node.js version should be 20 or higher"
        ALL_CHECKS_PASSED=false
    fi
fi
echo ""

# Check npm
echo "Checking npm..."
check_command "npm" "npm" "npm --version" "Comes with Node.js"
echo ""

# Check Rust (required for Circom)
echo "Checking Rust..."
check_command "rustc" "Rust" "rustc --version" "https://rustup.rs/"
echo ""

# Check Cargo
echo "Checking Cargo..."
check_command "cargo" "Cargo" "cargo --version" "Comes with Rust"
echo ""

# Check Circom
echo "Checking Circom..."
check_command "circom" "Circom" "circom --version" "cargo install circom"
echo ""

# Check Scarb (Cairo toolchain)
echo "Checking Scarb..."
check_command "scarb" "Scarb (Cairo toolchain)" "scarb --version" "curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh"
echo ""

# Check Git
echo "Checking Git..."
check_command "git" "Git" "git --version" "https://git-scm.com/"
echo ""

# Optional: Check Starknet Foundry
echo "Checking Starknet Foundry (optional)..."
if check_command "snforge" "Starknet Foundry" "snforge --version" "curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh"; then
    echo "  (Optional but recommended for contract testing)"
fi
echo ""

# Check if node_modules exists
echo "Checking project dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Node modules are installed"
else
    echo -e "${YELLOW}⚠${NC} Node modules are NOT installed"
    echo "  Run: npm install"
    ALL_CHECKS_PASSED=false
fi
echo ""

# Check if package builds exist
echo "Checking package builds..."
PACKAGES=("backend" "sdk" "circuits" "integration")
for pkg in "${PACKAGES[@]}"; do
    if [ -d "packages/$pkg/node_modules" ]; then
        echo -e "${GREEN}✓${NC} packages/$pkg dependencies installed"
    else
        echo -e "${YELLOW}⚠${NC} packages/$pkg dependencies NOT installed"
        ALL_CHECKS_PASSED=false
    fi
done
echo ""

# Check environment files
echo "Checking environment configuration..."
ENV_FILES=(
    "packages/backend/.env"
    "packages/circuits/.env"
    "packages/sdk/.env"
    "packages/integration/.env"
)

for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}✓${NC} $env_file exists"
    else
        echo -e "${YELLOW}⚠${NC} $env_file does NOT exist"
        echo "  Copy from ${env_file}.example"
        ALL_CHECKS_PASSED=false
    fi
done
echo ""

# Check TypeScript configuration
echo "Checking TypeScript configuration..."
TS_CONFIGS=(
    "packages/backend/tsconfig.json"
    "packages/sdk/tsconfig.json"
    "packages/integration/tsconfig.json"
)

for ts_config in "${TS_CONFIGS[@]}"; do
    if [ -f "$ts_config" ]; then
        echo -e "${GREEN}✓${NC} $ts_config exists"
    else
        echo -e "${RED}✗${NC} $ts_config is MISSING"
        ALL_CHECKS_PASSED=false
    fi
done
echo ""

# Check Jest configuration
echo "Checking Jest configuration..."
JEST_CONFIGS=(
    "packages/backend/jest.config.js"
    "packages/circuits/jest.config.js"
    "packages/sdk/jest.config.js"
    "packages/integration/jest.config.js"
)

for jest_config in "${JEST_CONFIGS[@]}"; do
    if [ -f "$jest_config" ]; then
        echo -e "${GREEN}✓${NC} $jest_config exists"
    else
        echo -e "${RED}✗${NC} $jest_config is MISSING"
        ALL_CHECKS_PASSED=false
    fi
done
echo ""

# Check Cairo contracts
echo "Checking Cairo contracts setup..."
if [ -f "packages/contracts/Scarb.toml" ]; then
    echo -e "${GREEN}✓${NC} Scarb.toml exists"
else
    echo -e "${RED}✗${NC} Scarb.toml is MISSING"
    ALL_CHECKS_PASSED=false
fi
echo ""

# Final summary
echo "================================================"
if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your development environment is ready."
    echo ""
    echo "Next steps:"
    echo "  1. Review the spec: .kiro/specs/phantom-darkpool/"
    echo "  2. Start implementing: Follow tasks.md"
    echo "  3. Run tests: npm test"
    echo "  4. Start backend: cd packages/backend && npm run dev"
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please install missing dependencies and try again."
    echo "See SETUP.md for detailed installation instructions."
    exit 1
fi
echo "================================================"
