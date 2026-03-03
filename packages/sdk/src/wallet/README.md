# Phantom Darkpool Wallet SDK

This directory contains the wallet SDK implementation for Phantom Darkpool, providing client-side proof generation and encrypted state management.

## Components

### BalanceNoteManager
Manages encrypted balance notes in IndexedDB.

**Features:**
- Create private balance notes
- Get balance for specific assets
- Track spent/unspent notes
- Encrypted storage with master key

**Usage:**
```typescript
const manager = new BalanceNoteManager(masterKey);
await manager.initialize();

const note = await manager.createPrivateBalance(
  '0x...asset',
  1000000n,
  '0x...owner'
);

const balance = await manager.getBalance('0x...asset');
```

### OrderCommitmentManager
Generates and manages order commitments.

**Features:**
- Generate order commitments with Poseidon hash
- Submit orders to backend
- Track order status

**Usage:**
```typescript
const manager = new OrderCommitmentManager();

const commitment = await manager.generateOrderCommitment({
  baseAsset: '0x...base',
  quoteAsset: '0x...quote',
  amount: 1000000n,
  price: 2000000000000000000n, // 2.0 scaled by 1e18
  orderType: 'BUY',
  expiration: Date.now() + 3600000, // 1 hour
});

const orderId = await manager.submitOrder(commitment);
```

### ProofGenerator
Generates zero-knowledge proofs for various operations.

**Features:**
- Balance proofs
- Order validity proofs
- Trade conservation proofs
- Matching correctness proofs

**Usage:**
```typescript
const generator = new ProofGenerator();

const proof = await generator.generateBalanceProof({
  merkleRoot: '0x...',
  nullifier: '0x...',
  minAmount: '1000000',
  asset: '0x...',
  amount: '2000000',
  salt: '12345',
  owner: '0x...',
  nullifierSecret: '0x...',
  merkleProof: [...],
  pathIndices: [...],
});
```

### ViewingKeyManager
Manages viewing keys for selective disclosure.

**Features:**
- Create viewing keys with specific data scopes
- Revoke viewing keys
- Register keys on-chain
- Decrypt data with viewing keys

**Usage:**
```typescript
const manager = new ViewingKeyManager(masterKey);

const viewingKey = await manager.createViewingKey(
  '0x...owner',
  DataScope.BALANCE_NOTE,
  86400000 // 24 hours
);

await manager.registerViewingKeyOnChain(viewingKey);

// Later, revoke the key
manager.revokeViewingKey(viewingKey.keyId);
```

### WithdrawalManager
Handles withdrawal operations with proof generation.

**Features:**
- Generate withdrawal proofs
- Submit withdrawals to Shielded Vault
- Track withdrawal status
- Estimate gas costs

**Usage:**
```typescript
const manager = new WithdrawalManager(masterKey);

const result = await manager.withdraw({
  asset: '0x...asset',
  amount: 1000000n,
  recipient: '0x...recipient',
  balanceNote: note,
  merkleProof: proof,
});

console.log('Transaction hash:', result.transactionHash);
```

### StateManager
Manages encrypted state storage and synchronization.

**Features:**
- IndexedDB schema for balance notes and orders
- Encrypted storage with AES-GCM
- State synchronization with on-chain data
- Export/import for backup

**Usage:**
```typescript
const manager = new StateManager(masterKey);
await manager.initialize();

// Store balance note
await manager.storeBalanceNote(note);

// Store order
await manager.storeOrder(commitment, 'pending');

// Sync with chain
await manager.syncWithChain('/api/v1/sync');

// Export for backup
const backup = await manager.exportState();

// Import from backup
await manager.importState(backup);
```

## PhantomWallet Class

The main SDK interface that combines all components.

**Usage:**
```typescript
import { PhantomWallet, DataScope } from '@phantom-darkpool/sdk';

// Initialize wallet
const wallet = new PhantomWallet(masterKey, '/api/v1');
await wallet.initialize();

// Create private balance
const note = await wallet.createPrivateBalance(
  '0x...asset',
  1000000n,
  '0x...owner'
);

// Get balance
const balance = await wallet.getBalance('0x...asset');

// Generate and submit order
const commitment = await wallet.generateOrderCommitment({
  baseAsset: '0x...base',
  quoteAsset: '0x...quote',
  amount: 1000000n,
  price: 2000000000000000000n,
  orderType: 'BUY',
  expiration: Date.now() + 3600000,
});

const orderId = await wallet.submitOrder(commitment);

// Withdraw
const result = await wallet.withdraw({
  asset: '0x...asset',
  amount: 500000n,
  recipient: '0x...recipient',
  balanceNote: note,
  merkleProof: proof,
});

// Create viewing key
const viewingKey = await wallet.createViewingKey(
  '0x...owner',
  DataScope.BALANCE_NOTE
);

// Sync with chain
await wallet.syncWithChain();

// Export state
const backup = await wallet.exportState();
```

## Security Considerations

### Master Key
- The master key is used to derive all encryption keys
- Never expose the master key to external services
- Store securely in browser's secure storage or hardware wallet

### Encrypted Storage
- All sensitive data is encrypted with AES-GCM
- Encryption key derived from master key using PBKDF2
- 100,000 iterations for key derivation

### Nullifiers
- Nullifiers prevent double-spending
- Generated deterministically from commitment and secret
- Never reuse nullifiers across transactions

### Viewing Keys
- Viewing keys enable selective disclosure
- Can be revoked at any time
- Expiration enforced both locally and on-chain

## Requirements Coverage

This implementation satisfies the following requirements:

- **14.1**: Wallet integration support (createPrivateBalance, getBalance)
- **14.2**: Order commitment generation (generateOrderCommitment, submitOrder)
- **14.3**: Proof generation (generateBalanceProof, etc.)
- **14.4**: Viewing key management (createViewingKey, revokeViewingKey)
- **14.5**: Local proof generation (ProofGenerator)
- **14.6**: Encrypted state storage (StateManager)
- **14.7**: Viewing key interfaces (ViewingKeyManager)

## Testing

Each component has corresponding test files in `__tests__/` directory:

```bash
npm test -- wallet
```

## Dependencies

- `circomlibjs`: Poseidon hash implementation
- `bigint-pedersen`: Pedersen commitment
- `snarkjs`: Zero-knowledge proof generation
- `@zk-kit/incremental-merkle-tree`: Merkle tree operations

## Browser Compatibility

- Requires IndexedDB support
- Requires Web Crypto API
- Requires BigInt support
- Tested on Chrome 90+, Firefox 88+, Safari 14+
