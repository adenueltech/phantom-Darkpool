# Phantom Darkpool Contracts

Cairo smart contracts for Starknet deployment.

## Contracts

- **ShieldedVault**: Manages deposits, withdrawals, and balance note creation
- **OrderRegistry**: Stores order commitments and manages order lifecycle
- **SettlementContract**: Verifies execution proofs and settles trades
- **AuditGateway**: Manages viewing keys for selective disclosure

## Development

```bash
# Build contracts
scarb build

# Run tests
scarb test
```

## Requirements

- Scarb (v2.5.0+)
- Starknet Foundry (snforge)
