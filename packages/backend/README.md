# Phantom Darkpool Backend

Backend API and matching engine for private trading infrastructure.

## Features

- REST API for order submission and status queries
- WebSocket server for real-time updates
- Off-chain matching engine
- Commitment tree management
- Starknet RPC integration

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Environment Variables

Create a `.env` file:

```
PORT=3000
STARKNET_RPC_URL=https://starknet-testnet.public.blastapi.io
DATABASE_URL=postgresql://localhost:5432/phantom
```
