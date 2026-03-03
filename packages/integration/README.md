# Phantom Darkpool Integration Tests

End-to-end integration tests for the complete system.

## Test Suites

- Deposit-to-withdrawal flow
- Order-to-settlement flow
- Multi-asset support
- Property-based tests

## Running Tests

```bash
# Run all integration tests
npm run test

# Run E2E tests only
npm run test:e2e
```

## Requirements

- Running backend server
- Deployed contracts on testnet
- Test wallet with testnet tokens
