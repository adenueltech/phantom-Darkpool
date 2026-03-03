# Phantom Darkpool - Development Environment Setup

This guide covers the complete setup of the Phantom Darkpool development environment.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** v20+ and npm/yarn
- **Rust** (for Circom compiler)
- **Cairo toolchain** (Scarb for Starknet contracts)
- **Git**

## Project Structure

```
phantom-darkpool/
├── packages/
│   ├── backend/          # Express.js API server and matching engine
│   ├── circuits/         # Circom zero-knowledge circuits
│   ├── contracts/        # Cairo smart contracts for Starknet
│   ├── sdk/              # Client SDK for proof generation
│   └── integration/      # End-to-end integration tests
├── product demo/         # Next.js frontend (already complete)
└── package.json          # Root workspace configuration
```

## Installation Steps

### 1. Install Dependencies

From the root directory:

```bash
# Install all workspace dependencies
npm install

# Or using yarn
yarn install
```

This will install dependencies for all packages in the monorepo.

### 2. Install Circom Compiler

Circom is required for compiling zero-knowledge circuits.

**Option A: Using Cargo (Rust)**
```bash
cargo install circom
```

**Option B: Download Pre-built Binary**
Visit https://github.com/iden3/circom/releases and download the appropriate binary for your system.

**Verify Installation:**
```bash
circom --version
# Should output: circom compiler 2.1.x
```

### 3. Install SnarkJS

SnarkJS is already included in package dependencies, but you can install it globally:

```bash
npm install -g snarkjs
```

### 4. Install Cairo Toolchain (Scarb)

Scarb is the Cairo package manager and build tool for Starknet contracts.

**Installation:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
```

**Verify Installation:**
```bash
scarb --version
# Should output: scarb 2.5.x
```

### 5. Install Starknet Foundry (Optional - for contract testing)

```bash
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
snfoundryup
```

**Verify Installation:**
```bash
snforge --version
```

### 6. Configure Environment Variables

Each package has an `.env.example` file. Copy these to `.env` and configure:

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Circuits
cp packages/circuits/.env.example packages/circuits/.env

# SDK
cp packages/sdk/.env.example packages/sdk/.env

# Integration tests
cp packages/integration/.env.example packages/integration/.env
```

**Important:** Update the following in your `.env` files:
- Starknet RPC URLs (use testnet for development)
- Contract addresses (after deployment)
- Database connection strings (for backend)

## Development Workflow

### Building Packages

```bash
# Build all packages
npm run build

# Build specific package
cd packages/backend && npm run build
cd packages/sdk && npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/backend && npm test
cd packages/circuits && npm test
cd packages/sdk && npm test
cd packages/integration && npm test
```

### Linting and Formatting

```bash
# Lint all TypeScript packages
npm run lint

# Format all files
npm run format
```

### Running the Backend Server

```bash
cd packages/backend
npm run dev
```

The server will start on `http://localhost:3000` (configurable in `.env`).

### Compiling Circuits

```bash
cd packages/circuits
npm run compile
```

This will:
1. Compile all Circom circuits in `circuits/` directory
2. Generate R1CS constraint files
3. Generate WASM witness generators
4. Generate proving and verification keys

### Building Cairo Contracts

```bash
cd packages/contracts
scarb build
```

This generates Sierra and CASM files for deployment to Starknet.

### Running the Frontend Demo

The frontend is already complete in the `product demo/` directory:

```bash
cd "product demo"
npm install
npm run dev
```

Visit `http://localhost:3000` to see the UI.

## Package-Specific Setup

### Backend Package

**Dependencies:**
- Express.js for REST API
- WebSocket (ws) for real-time updates
- Starknet.js for blockchain interaction
- Circomlibjs for cryptographic operations
- @zk-kit/incremental-merkle-tree for commitment tree

**Configuration:**
- Port: 3000 (REST API)
- WebSocket Port: 3001
- Database: PostgreSQL (configure in `.env`)

### Circuits Package

**Dependencies:**
- Circomlib for circuit templates
- SnarkJS for proof generation

**Circuits to Implement:**
1. `BalanceProof.circom` - Prove balance ownership
2. `OrderValidityProof.circom` - Prove order validity
3. `TradeConservationProof.circom` - Prove trade conservation
4. `MatchingCorrectnessProof.circom` - Prove matching correctness

### Contracts Package

**Dependencies:**
- Starknet standard library

**Contracts to Implement:**
1. `ShieldedVault.cairo` - Deposit/withdrawal management
2. `OrderRegistry.cairo` - Order commitment storage
3. `SettlementContract.cairo` - Trade settlement
4. `AuditGateway.cairo` - Viewing key management
5. Verifier contracts (generated from circuits)

### SDK Package

**Dependencies:**
- Starknet.js for wallet integration
- SnarkJS for client-side proof generation
- Circomlibjs for cryptographic operations
- bigint-pedersen for Pedersen commitments

**Features:**
- Balance note management
- Order commitment generation
- Proof generation (client-side)
- Viewing key management
- Encrypted state storage (IndexedDB)

### Integration Package

**Purpose:** End-to-end testing of complete flows

**Test Scenarios:**
- Deposit → Balance Note → Withdrawal
- Order Submission → Matching → Settlement
- Multi-asset trading
- Viewing key generation and usage

## Troubleshooting

### Circom Installation Issues

If you encounter issues installing Circom:
1. Ensure Rust is properly installed: `rustc --version`
2. Update Rust: `rustup update`
3. Try installing from source: https://github.com/iden3/circom

### Scarb Installation Issues

If Scarb installation fails:
1. Check your system architecture (x86_64 or ARM)
2. Manually download from: https://docs.swmansion.com/scarb/download
3. Add to PATH manually

### Node Module Issues

If you encounter dependency conflicts:
```bash
# Clean install
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Errors

Ensure all packages are built in order:
```bash
cd packages/sdk && npm run build
cd ../backend && npm run build
```

## Next Steps

After completing the setup:

1. **Review the spec files** in `.kiro/specs/phantom-darkpool/`:
   - `requirements.md` - System requirements
   - `design.md` - Architecture and design
   - `tasks.md` - Implementation tasks

2. **Start with Task 2**: Implement cryptographic primitives
   - Poseidon hash wrapper
   - Pedersen commitments
   - Nullifier generation

3. **Follow the task sequence** in `tasks.md` for systematic implementation

## Useful Commands Reference

```bash
# Root level
npm run build          # Build all packages
npm run test           # Run all tests
npm run lint           # Lint all packages
npm run format         # Format all files
npm run clean          # Clean all build artifacts

# Backend
cd packages/backend
npm run dev            # Start dev server with hot reload
npm run build          # Compile TypeScript
npm run test           # Run Jest tests
npm run lint           # Run ESLint

# Circuits
cd packages/circuits
npm run compile        # Compile all circuits
npm run test           # Run circuit tests
npm run clean          # Remove build artifacts

# Contracts
cd packages/contracts
scarb build            # Build Cairo contracts
scarb test             # Run contract tests (if using Scarb test)
snforge test           # Run tests with Starknet Foundry

# SDK
cd packages/sdk
npm run build          # Build SDK
npm run test           # Run SDK tests
npm run lint           # Lint SDK code

# Integration
cd packages/integration
npm run test           # Run integration tests
npm run test:e2e       # Run end-to-end tests
```

## Resources

- **Circom Documentation**: https://docs.circom.io/
- **SnarkJS Documentation**: https://github.com/iden3/snarkjs
- **Cairo Book**: https://book.cairo-lang.org/
- **Starknet Documentation**: https://docs.starknet.io/
- **Scarb Documentation**: https://docs.swmansion.com/scarb/
- **Starknet.js**: https://www.starknetjs.com/

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review package-specific README files
3. Consult the design document for architecture details
