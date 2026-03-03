# Phantom Darkpool

A zero-knowledge private trading infrastructure that enables fully confidential decentralized trading on Starknet.

## Overview

Phantom Darkpool eliminates front-running, MEV exploitation, strategy leakage, and balance surveillance through cryptographic privacy guarantees. All trading activity remains confidential while maintaining public verifiability of system correctness.

### Key Features

- **Private Balances**: Shielded asset balances using UTXO-based encrypted notes
- **Hidden Orders**: Orders submitted as cryptographic commitments
- **Zero-Knowledge Matching**: Order matching without revealing details
- **Confidential Settlement**: Trade execution with encrypted balance updates
- **Selective Disclosure**: Optional viewing keys for compliance/auditing
- **Multi-Asset Support**: Trade multiple asset pairs privately
- **Non-Custodial**: Users maintain full control of assets

## Architecture

The system consists of four primary layers:

1. **Private Balance Layer**: Manages shielded balances using Pedersen commitments
2. **Order Commitment Layer**: Processes private orders as cryptographic commitments
3. **Matching Engine**: Identifies compatible orders without decryption
4. **Settlement Layer**: Executes trades with zero-knowledge proofs

### Technology Stack

- **Smart Contracts**: Cairo (Starknet)
- **Zero-Knowledge Circuits**: Circom + Groth16
- **Backend**: TypeScript + Express.js
- **SDK**: TypeScript + SnarkJS
- **Frontend**: Next.js + React (already complete)

## Project Structure

```
phantom-darkpool/
├── packages/
│   ├── backend/          # API server and matching engine
│   ├── circuits/         # Zero-knowledge circuits (Circom)
│   ├── contracts/        # Smart contracts (Cairo)
│   ├── sdk/              # Client SDK for proof generation
│   └── integration/      # End-to-end integration tests
├── product demo/         # Next.js frontend UI (complete)
├── .kiro/specs/          # Specification documents
│   └── phantom-darkpool/
│       ├── requirements.md  # System requirements
│       ├── design.md        # Architecture and design
│       └── tasks.md         # Implementation plan
└── SETUP.md              # Development environment setup
```

## Getting Started

### Prerequisites

- Node.js v20+
- Rust (for Circom compiler)
- Cairo toolchain (Scarb)
- Git

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd phantom-darkpool
   npm install
   ```

2. **Install required tools:**
   ```bash
   # Install Circom
   cargo install circom
   
   # Install Scarb (Cairo toolchain)
   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
   ```

3. **Configure environment:**
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   cp packages/circuits/.env.example packages/circuits/.env
   cp packages/sdk/.env.example packages/sdk/.env
   ```

4. **Build all packages:**
   ```bash
   npm run build
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Development Workflow

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd packages/backend && npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run specific package tests
cd packages/sdk && npm test
```

### Running the Backend

```bash
cd packages/backend
npm run dev
```

### Running the Frontend

```bash
cd "product demo"
npm install
npm run dev
```

Visit `http://localhost:3000` to see the UI.

## Implementation Status

The project follows a structured implementation plan defined in `.kiro/specs/phantom-darkpool/tasks.md`.

### Completed
- ✅ Project structure and monorepo setup
- ✅ TypeScript configuration
- ✅ Testing framework setup (Jest)
- ✅ Linting and formatting (ESLint, Prettier)
- ✅ Environment configuration files
- ✅ Frontend UI (complete in `product demo/`)

### In Progress
- 🔄 Cryptographic primitives implementation
- 🔄 Zero-knowledge circuits
- 🔄 Smart contracts
- 🔄 Backend API and matching engine
- 🔄 SDK development
- 🔄 Frontend integration

## Core Components

### Smart Contracts (Cairo)

1. **Shielded Vault**: Manages deposits, withdrawals, and balance notes
2. **Order Registry**: Stores order commitments and metadata
3. **Settlement Contract**: Verifies proofs and settles trades
4. **Audit Gateway**: Manages viewing keys for selective disclosure

### Zero-Knowledge Circuits (Circom)

1. **Balance Proof**: Prove balance ownership without revealing amount
2. **Order Validity Proof**: Prove order parameters are valid
3. **Trade Conservation Proof**: Prove inputs equal outputs
4. **Matching Correctness Proof**: Prove matched orders satisfy price rules

### Backend Services

1. **REST API**: Order submission, status queries, withdrawals
2. **WebSocket Server**: Real-time order book and settlement updates
3. **Matching Engine**: Off-chain order matching with proof generation
4. **Commitment Tree Manager**: Merkle tree state management

### SDK

Client-side library for:
- Balance note management
- Order commitment generation
- Zero-knowledge proof generation
- Viewing key management
- Encrypted state storage

## Security Features

- **Zero-Knowledge Proofs**: All sensitive data verified without revelation
- **Nullifier System**: Prevents double-spending of balance notes
- **Commitment Trees**: Publicly verifiable balance note registry
- **Deterministic Matching**: Fair order matching with price-time priority
- **Replay Protection**: Unique nonces and timestamp validation
- **Selective Disclosure**: Optional viewing keys for compliance

## Documentation

- **[SETUP.md](./SETUP.md)**: Complete development environment setup
- **[requirements.md](.kiro/specs/phantom-darkpool/requirements.md)**: System requirements and user stories
- **[design.md](.kiro/specs/phantom-darkpool/design.md)**: Architecture and technical design
- **[tasks.md](.kiro/specs/phantom-darkpool/tasks.md)**: Implementation task breakdown

### Package Documentation

- [Backend README](./packages/backend/README.md)
- [Circuits README](./packages/circuits/README.md)
- [Contracts README](./packages/contracts/README.md)
- [SDK README](./packages/sdk/README.md)
- [Integration README](./packages/integration/README.md)

## Testing

The project includes comprehensive testing:

- **Unit Tests**: Individual component testing (Jest)
- **Circuit Tests**: Zero-knowledge circuit correctness
- **Contract Tests**: Smart contract functionality (Starknet Foundry)
- **Integration Tests**: End-to-end flow testing
- **Property-Based Tests**: Universal correctness properties (45 properties)

Run all tests:
```bash
npm test
```

## Contributing

1. Review the specification documents in `.kiro/specs/phantom-darkpool/`
2. Follow the implementation plan in `tasks.md`
3. Ensure all tests pass before submitting changes
4. Follow the existing code style (enforced by ESLint and Prettier)

## License

[Add license information]

## Resources

- **Circom**: https://docs.circom.io/
- **SnarkJS**: https://github.com/iden3/snarkjs
- **Cairo**: https://book.cairo-lang.org/
- **Starknet**: https://docs.starknet.io/
- **Starknet.js**: https://www.starknetjs.com/

## Contact

[Add contact information]
