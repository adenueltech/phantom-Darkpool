#!/bin/bash

# Phantom Darkpool - Development Environment Setup Script
# This script automates the installation of required tools and dependencies

set -e

echo "=========================================="
echo "Phantom Darkpool - Development Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Check Node.js
echo "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "Node.js $NODE_VERSION is installed"
else
    print_error "Node.js is not installed"
    echo "Please install Node.js v20+ from https://nodejs.org/"
    exit 1
fi

# Check npm
echo "Checking npm installation..."
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "npm $NPM_VERSION is installed"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Rust
echo ""
echo "Checking Rust installation..."
if command_exists rustc; then
    RUST_VERSION=$(rustc --version)
    print_status "Rust is installed: $RUST_VERSION"
else
    print_warning "Rust is not installed (required for Circom)"
    echo "Install Rust from https://rustup.rs/"
    echo "Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
fi

# Check Circom
echo ""
echo "Checking Circom installation..."
if command_exists circom; then
    CIRCOM_VERSION=$(circom --version)
    print_status "Circom is installed: $CIRCOM_VERSION"
else
    print_warning "Circom is not installed"
    echo "To install Circom:"
    echo "  git clone https://github.com/iden3/circom.git"
    echo "  cd circom"
    echo "  cargo build --release"
    echo "  cargo install --path circom"
fi

# Check Scarb (Cairo)
echo ""
echo "Checking Scarb installation..."
if command_exists scarb; then
    SCARB_VERSION=$(scarb --version)
    print_status "Scarb is installed: $SCARB_VERSION"
else
    print_warning "Scarb is not installed (required for Cairo contracts)"
    echo "To install Scarb:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh"
fi

# Check Starknet Foundry
echo ""
echo "Checking Starknet Foundry installation..."
if command_exists snforge; then
    SNFORGE_VERSION=$(snforge --version)
    print_status "Starknet Foundry is installed: $SNFORGE_VERSION"
else
    print_warning "Starknet Foundry is not installed (required for Cairo testing)"
    echo "To install Starknet Foundry:"
    echo "  curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh"
    echo "  snfoundryup"
fi

# Check SnarkJS
echo ""
echo "Checking SnarkJS installation..."
if command_exists snarkjs; then
    print_status "SnarkJS is installed"
else
    print_warning "SnarkJS is not installed globally"
    echo "To install SnarkJS globally:"
    echo "  npm install -g snarkjs"
fi

# Install project dependencies
echo ""
echo "=========================================="
echo "Installing project dependencies..."
echo "=========================================="
npm install

# Copy environment files
echo ""
echo "=========================================="
echo "Setting up environment files..."
echo "=========================================="

copy_env_file() {
    if [ ! -f "$1" ]; then
        cp "$1.example" "$1"
        print_status "Created $1"
    else
        print_warning "$1 already exists, skipping"
    fi
}

copy_env_file "packages/backend/.env"
copy_env_file "packages/circuits/.env"
copy_env_file "packages/contracts/.env"
copy_env_file "packages/sdk/.env"
copy_env_file "packages/integration/.env"

# Download Powers of Tau file (optional)
echo ""
echo "=========================================="
echo "Powers of Tau Setup"
echo "=========================================="
echo "The Powers of Tau file is required for circuit compilation."
echo "This is a large file (~500MB) and only needs to be downloaded once."
echo ""
read -p "Download Powers of Tau file now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd packages/circuits
    if [ ! -f "powersOfTau28_hez_final_20.ptau" ]; then
        echo "Downloading Powers of Tau file..."
        wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau
        print_status "Powers of Tau file downloaded"
    else
        print_status "Powers of Tau file already exists"
    fi
    cd ../..
else
    print_warning "Skipping Powers of Tau download"
    echo "You can download it later with:"
    echo "  cd packages/circuits"
    echo "  wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau"
fi

# Build packages
echo ""
echo "=========================================="
echo "Building packages..."
echo "=========================================="
npm run build

# Summary
echo ""
echo "=========================================="
echo "Setup Summary"
echo "=========================================="
echo ""

if command_exists node && command_exists npm; then
    print_status "Node.js and npm are ready"
else
    print_error "Node.js or npm is missing"
fi

if command_exists rustc; then
    print_status "Rust is ready"
else
    print_warning "Rust is not installed (needed for Circom)"
fi

if command_exists circom; then
    print_status "Circom is ready"
else
    print_warning "Circom is not installed"
fi

if command_exists scarb; then
    print_status "Scarb is ready"
else
    print_warning "Scarb is not installed (needed for Cairo contracts)"
fi

if command_exists snforge; then
    print_status "Starknet Foundry is ready"
else
    print_warning "Starknet Foundry is not installed (needed for Cairo testing)"
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Review and update environment files in packages/*/.env"
echo "2. Install missing tools (see warnings above)"
echo "3. Run tests: npm run test"
echo "4. Start development: cd packages/backend && npm run dev"
echo ""
echo "For detailed instructions, see SETUP.md"
echo ""
print_status "Setup complete!"
