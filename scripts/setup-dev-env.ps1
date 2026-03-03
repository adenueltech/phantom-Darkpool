# Phantom Darkpool - Development Environment Setup Script (PowerShell)
# This script automates the installation of required tools and dependencies

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Phantom Darkpool - Development Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Helper functions
function Test-CommandExists {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param($Message)
    Write-Host "! $Message" -ForegroundColor Yellow
}

# Check Node.js
Write-Host "Checking Node.js installation..."
if (Test-CommandExists node) {
    $nodeVersion = node --version
    Write-Success "Node.js $nodeVersion is installed"
} else {
    Write-Error "Node.js is not installed"
    Write-Host "Please install Node.js v20+ from https://nodejs.org/"
    exit 1
}

# Check npm
Write-Host "Checking npm installation..."
if (Test-CommandExists npm) {
    $npmVersion = npm --version
    Write-Success "npm $npmVersion is installed"
} else {
    Write-Error "npm is not installed"
    exit 1
}

# Check Rust
Write-Host ""
Write-Host "Checking Rust installation..."
if (Test-CommandExists rustc) {
    $rustVersion = rustc --version
    Write-Success "Rust is installed: $rustVersion"
} else {
    Write-Warning "Rust is not installed (required for Circom)"
    Write-Host "Install Rust from https://rustup.rs/"
    Write-Host "Run: Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile rustup-init.exe; .\rustup-init.exe"
}

# Check Circom
Write-Host ""
Write-Host "Checking Circom installation..."
if (Test-CommandExists circom) {
    $circomVersion = circom --version
    Write-Success "Circom is installed: $circomVersion"
} else {
    Write-Warning "Circom is not installed"
    Write-Host "To install Circom:"
    Write-Host "  git clone https://github.com/iden3/circom.git"
    Write-Host "  cd circom"
    Write-Host "  cargo build --release"
    Write-Host "  cargo install --path circom"
}

# Check Scarb (Cairo)
Write-Host ""
Write-Host "Checking Scarb installation..."
if (Test-CommandExists scarb) {
    $scarbVersion = scarb --version
    Write-Success "Scarb is installed: $scarbVersion"
} else {
    Write-Warning "Scarb is not installed (required for Cairo contracts)"
    Write-Host "To install Scarb on Windows:"
    Write-Host "  Download from https://docs.swmansion.com/scarb/download.html"
    Write-Host "  Or use: Invoke-WebRequest -Uri https://docs.swmansion.com/scarb/install.ps1 -OutFile install.ps1; .\install.ps1"
}

# Check Starknet Foundry
Write-Host ""
Write-Host "Checking Starknet Foundry installation..."
if (Test-CommandExists snforge) {
    $snforgeVersion = snforge --version
    Write-Success "Starknet Foundry is installed: $snforgeVersion"
} else {
    Write-Warning "Starknet Foundry is not installed (required for Cairo testing)"
    Write-Host "To install Starknet Foundry:"
    Write-Host "  Download from https://github.com/foundry-rs/starknet-foundry/releases"
}

# Check SnarkJS
Write-Host ""
Write-Host "Checking SnarkJS installation..."
if (Test-CommandExists snarkjs) {
    Write-Success "SnarkJS is installed"
} else {
    Write-Warning "SnarkJS is not installed globally"
    Write-Host "To install SnarkJS globally:"
    Write-Host "  npm install -g snarkjs"
}

# Install project dependencies
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Installing project dependencies..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
npm install

# Copy environment files
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setting up environment files..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

function Copy-EnvFile {
    param($Path)
    if (-not (Test-Path $Path)) {
        Copy-Item "$Path.example" $Path
        Write-Success "Created $Path"
    } else {
        Write-Warning "$Path already exists, skipping"
    }
}

Copy-EnvFile "packages\backend\.env"
Copy-EnvFile "packages\circuits\.env"
Copy-EnvFile "packages\contracts\.env"
Copy-EnvFile "packages\sdk\.env"
Copy-EnvFile "packages\integration\.env"

# Download Powers of Tau file (optional)
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Powers of Tau Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "The Powers of Tau file is required for circuit compilation."
Write-Host "This is a large file (~500MB) and only needs to be downloaded once."
Write-Host ""
$response = Read-Host "Download Powers of Tau file now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Push-Location packages\circuits
    if (-not (Test-Path "powersOfTau28_hez_final_20.ptau")) {
        Write-Host "Downloading Powers of Tau file..."
        Invoke-WebRequest -Uri "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau" -OutFile "powersOfTau28_hez_final_20.ptau"
        Write-Success "Powers of Tau file downloaded"
    } else {
        Write-Success "Powers of Tau file already exists"
    }
    Pop-Location
} else {
    Write-Warning "Skipping Powers of Tau download"
    Write-Host "You can download it later with:"
    Write-Host "  cd packages\circuits"
    Write-Host "  Invoke-WebRequest -Uri 'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau' -OutFile 'powersOfTau28_hez_final_20.ptau'"
}

# Build packages
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Building packages..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
npm run build

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if ((Test-CommandExists node) -and (Test-CommandExists npm)) {
    Write-Success "Node.js and npm are ready"
} else {
    Write-Error "Node.js or npm is missing"
}

if (Test-CommandExists rustc) {
    Write-Success "Rust is ready"
} else {
    Write-Warning "Rust is not installed (needed for Circom)"
}

if (Test-CommandExists circom) {
    Write-Success "Circom is ready"
} else {
    Write-Warning "Circom is not installed"
}

if (Test-CommandExists scarb) {
    Write-Success "Scarb is ready"
} else {
    Write-Warning "Scarb is not installed (needed for Cairo contracts)"
}

if (Test-CommandExists snforge) {
    Write-Success "Starknet Foundry is ready"
} else {
    Write-Warning "Starknet Foundry is not installed (needed for Cairo testing)"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review and update environment files in packages\*\.env"
Write-Host "2. Install missing tools (see warnings above)"
Write-Host "3. Run tests: npm run test"
Write-Host "4. Start development: cd packages\backend; npm run dev"
Write-Host ""
Write-Host "For detailed instructions, see SETUP.md"
Write-Host ""
Write-Success "Setup complete!"
