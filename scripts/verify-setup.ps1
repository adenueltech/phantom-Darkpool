# Phantom Darkpool - Setup Verification Script (PowerShell)
# This script verifies that all required tools and dependencies are installed

Write-Host "🔍 Verifying Phantom Darkpool Development Environment Setup..." -ForegroundColor Cyan
Write-Host ""

$AllChecksPassed = $true

# Function to check if a command exists
function Test-Command {
    param(
        [string]$Command,
        [string]$Name,
        [string]$VersionCommand,
        [string]$InstallInfo
    )
    
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Host "✓ $Name is installed" -ForegroundColor Green
        if ($VersionCommand) {
            $Version = Invoke-Expression $VersionCommand 2>&1
            Write-Host "  Version: $Version"
        }
        return $true
    } else {
        Write-Host "✗ $Name is NOT installed" -ForegroundColor Red
        Write-Host "  Install: $InstallInfo" -ForegroundColor Yellow
        $script:AllChecksPassed = $false
        return $false
    }
}

# Check Node.js
Write-Host "Checking Node.js..."
if (Test-Command "node" "Node.js" "node --version" "https://nodejs.org/") {
    $NodeVersion = (node --version).Trim('v').Split('.')[0]
    if ([int]$NodeVersion -lt 20) {
        Write-Host "  ⚠ Node.js version should be 20 or higher" -ForegroundColor Yellow
        $AllChecksPassed = $false
    }
}
Write-Host ""

# Check npm
Write-Host "Checking npm..."
Test-Command "npm" "npm" "npm --version" "Comes with Node.js"
Write-Host ""

# Check Rust
Write-Host "Checking Rust..."
Test-Command "rustc" "Rust" "rustc --version" "https://rustup.rs/"
Write-Host ""

# Check Cargo
Write-Host "Checking Cargo..."
Test-Command "cargo" "Cargo" "cargo --version" "Comes with Rust"
Write-Host ""

# Check Circom
Write-Host "Checking Circom..."
Test-Command "circom" "Circom" "circom --version" "cargo install circom"
Write-Host ""

# Check Scarb
Write-Host "Checking Scarb..."
Test-Command "scarb" "Scarb (Cairo toolchain)" "scarb --version" "https://docs.swmansion.com/scarb/download"
Write-Host ""

# Check Git
Write-Host "Checking Git..."
Test-Command "git" "Git" "git --version" "https://git-scm.com/"
Write-Host ""

# Optional: Check Starknet Foundry
Write-Host "Checking Starknet Foundry (optional)..."
if (Test-Command "snforge" "Starknet Foundry" "snforge --version" "https://foundry-rs.github.io/starknet-foundry/") {
    Write-Host "  (Optional but recommended for contract testing)"
}
Write-Host ""

# Check if node_modules exists
Write-Host "Checking project dependencies..."
if (Test-Path "node_modules") {
    Write-Host "✓ Node modules are installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Node modules are NOT installed" -ForegroundColor Yellow
    Write-Host "  Run: npm install"
    $AllChecksPassed = $false
}
Write-Host ""

# Check package dependencies
Write-Host "Checking package builds..."
$Packages = @("backend", "sdk", "circuits", "integration")
foreach ($pkg in $Packages) {
    if (Test-Path "packages/$pkg/node_modules") {
        Write-Host "✓ packages/$pkg dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "⚠ packages/$pkg dependencies NOT installed" -ForegroundColor Yellow
        $AllChecksPassed = $false
    }
}
Write-Host ""

# Check environment files
Write-Host "Checking environment configuration..."
$EnvFiles = @(
    "packages/backend/.env",
    "packages/circuits/.env",
    "packages/sdk/.env",
    "packages/integration/.env"
)

foreach ($envFile in $EnvFiles) {
    if (Test-Path $envFile) {
        Write-Host "✓ $envFile exists" -ForegroundColor Green
    } else {
        Write-Host "⚠ $envFile does NOT exist" -ForegroundColor Yellow
        Write-Host "  Copy from $envFile.example"
        $AllChecksPassed = $false
    }
}
Write-Host ""

# Check TypeScript configuration
Write-Host "Checking TypeScript configuration..."
$TsConfigs = @(
    "packages/backend/tsconfig.json",
    "packages/sdk/tsconfig.json",
    "packages/integration/tsconfig.json"
)

foreach ($tsConfig in $TsConfigs) {
    if (Test-Path $tsConfig) {
        Write-Host "✓ $tsConfig exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $tsConfig is MISSING" -ForegroundColor Red
        $AllChecksPassed = $false
    }
}
Write-Host ""

# Check Jest configuration
Write-Host "Checking Jest configuration..."
$JestConfigs = @(
    "packages/backend/jest.config.js",
    "packages/circuits/jest.config.js",
    "packages/sdk/jest.config.js",
    "packages/integration/jest.config.js"
)

foreach ($jestConfig in $JestConfigs) {
    if (Test-Path $jestConfig) {
        Write-Host "✓ $jestConfig exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $jestConfig is MISSING" -ForegroundColor Red
        $AllChecksPassed = $false
    }
}
Write-Host ""

# Check Cairo contracts
Write-Host "Checking Cairo contracts setup..."
if (Test-Path "packages/contracts/Scarb.toml") {
    Write-Host "✓ Scarb.toml exists" -ForegroundColor Green
} else {
    Write-Host "✗ Scarb.toml is MISSING" -ForegroundColor Red
    $AllChecksPassed = $false
}
Write-Host ""

# Final summary
Write-Host "================================================"
if ($AllChecksPassed) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your development environment is ready."
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Review the spec: .kiro/specs/phantom-darkpool/"
    Write-Host "  2. Start implementing: Follow tasks.md"
    Write-Host "  3. Run tests: npm test"
    Write-Host "  4. Start backend: cd packages/backend; npm run dev"
} else {
    Write-Host "✗ Some checks failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install missing dependencies and try again."
    Write-Host "See SETUP.md for detailed installation instructions."
    exit 1
}
Write-Host "================================================"
