#!/bin/bash

# Phantom Darkpool - Quick Start Script
# This script helps you get started with development quickly

set -e

echo "🚀 Phantom Darkpool - Quick Start"
echo "=================================="
echo ""

# Check if we're in the root directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
if [ -d "node_modules" ]; then
    echo "   Dependencies already installed, skipping..."
else
    npm install
    echo "   ✓ Dependencies installed"
fi
echo ""

# Step 2: Setup environment files
echo "⚙️  Step 2: Setting up environment files..."
ENV_FILES=(
    "packages/backend/.env"
    "packages/circuits/.env"
    "packages/sdk/.env"
    "packages/integration/.env"
)

for env_file in "${ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        cp "${env_file}.example" "$env_file"
        echo "   ✓ Created $env_file"
    else
        echo "   ✓ $env_file already exists"
    fi
done
echo ""

# Step 3: Build packages
echo "🔨 Step 3: Building packages..."
echo "   This may take a few minutes..."
npm run build
echo "   ✓ All packages built successfully"
echo ""

# Step 4: Run tests
echo "🧪 Step 4: Running tests..."
npm test
echo "   ✓ All tests passed"
echo ""

# Success message
echo "=================================="
echo "✅ Quick start completed successfully!"
echo ""
echo "Your development environment is ready."
echo ""
echo "📚 Next steps:"
echo ""
echo "1. Review the specification:"
echo "   - Requirements: .kiro/specs/phantom-darkpool/requirements.md"
echo "   - Design: .kiro/specs/phantom-darkpool/design.md"
echo "   - Tasks: .kiro/specs/phantom-darkpool/tasks.md"
echo ""
echo "2. Start the backend server:"
echo "   cd packages/backend"
echo "   npm run dev"
echo ""
echo "3. Start the frontend demo:"
echo "   cd 'product demo'"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "4. Begin implementation:"
echo "   Follow the tasks in .kiro/specs/phantom-darkpool/tasks.md"
echo "   Start with Task 2: Implement cryptographic primitives"
echo ""
echo "📖 For detailed setup information, see SETUP.md"
echo "=================================="
