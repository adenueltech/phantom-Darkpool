# Quick Integration Reference

Quick reference for integrating Phantom Darkpool components.

## Import Statements

```typescript
// Wallet
import { useWallet } from '@/contexts/WalletContext';

// API
import { apiClient } from '@/lib/api-client';

// WebSocket
import { useWebSocket } from '@/hooks/use-websocket';

// SDK (mock for now)
import { mockSDK } from '@/lib/sdk-integration';

// Contracts (mock for now)
import { mockContractClient } from '@/lib/contract-integration';

// API Hook
import { useApi } from '@/hooks/use-api';
```

## Common Patterns

### Connect Wallet

```typescript
const { isConnected, walletAddress, account, connect, disconnect } = useWallet();

// Connect
await connect('argent'); // or 'braavos'

// Disconnect
disconnect();
```

### Submit Order

```typescript
// 1. Generate order commitment
const order = await mockSDK.generateOrderCommitment({
  baseAsset: '0xETH',
  quoteAsset: '0xUSDC',
  amount: BigInt(100),
  price: BigInt(2000),
  orderType: 'BUY',
  expiration: Date.now() + 3600000
});

// 2. Generate proof
const proof = await mockSDK.generateOrderValidityProof(order);

// 3. Submit to backend
const result = await apiClient.submitOrder({
  orderCommitment: order.commitmentHash,
  expiration: order.expiration,
  orderValidityProof: proof.proof
});

if (result.success) {
  console.log('Order ID:', result.data.orderId);
}
```

### Deposit Assets

```typescript
// 1. Create balance note
const note = await mockSDK.createPrivateBalance(
  '0xETH_ADDRESS',
  BigInt(1000000)
);

// 2. Call contract
const txHash = await mockContractClient.deposit(
  '0xETH_ADDRESS',
  BigInt(1000000),
  note.commitment
);

// 3. Store note in IndexedDB
await storeBalanceNote(note);

console.log('Deposit TX:', txHash);
```

### Withdraw Assets

```typescript
// 1. Get balance note from storage
const note = await getBalanceNote(asset);

// 2. Generate proof
const proof = await mockSDK.generateBalanceProof();

// 3. Submit withdrawal
const result = await apiClient.submitWithdrawal({
  nullifier: note.nullifier,
  recipient: walletAddress,
  amount: amount.toString(),
  balanceProof: proof.proof,
  merkleProof: proof.publicInputs
});

if (result.success) {
  console.log('Withdrawal TX:', result.data.txHash);
}
```

### Real-time Updates

```typescript
const { isConnected } = useWebSocket((event) => {
  switch (event.type) {
    case 'order_submitted':
      console.log('New order:', event.data.orderId);
      // Update order book
      break;
      
    case 'settlement_complete':
      console.log('Settlement:', event.data.executionId);
      // Update transactions
      break;
      
    case 'tree_root_updated':
      console.log('New root:', event.data.newRoot);
      // Refresh balances
      break;
  }
});
```

### API with Hook

```typescript
const { loading, error, data, execute } = useApi();

const handleSubmit = async () => {
  const result = await execute(() => 
    apiClient.submitOrder(orderData)
  );
  
  if (result) {
    console.log('Success:', result);
  }
};

// In JSX
{loading && <Spinner />}
{error && <Error message={error} />}
{data && <Success data={data} />}
```

### Generate Viewing Key

```typescript
// 1. Create key
const key = await mockSDK.createViewingKey('BALANCE_NOTE');

// 2. Register on-chain
const txHash = await mockContractClient.registerViewingKey(
  key.keyId,
  'BALANCE_NOTE',
  Date.now() + 86400000 // 24 hours
);

// 3. Share decryption key off-chain
console.log('Share this key:', key.decryptionKey);
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_RPC_URL=https://starknet-goerli.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_ENABLE_MOCK_MODE=true
```

## Error Handling

```typescript
try {
  const result = await apiClient.submitOrder(order);
  
  if (!result.success) {
    // Handle API error
    console.error('API Error:', result.error);
    toast.error(result.error);
    return;
  }
  
  // Success
  toast.success('Order submitted!');
  
} catch (error) {
  // Handle network error
  console.error('Network Error:', error);
  toast.error('Network error. Please try again.');
}
```

## Loading States

```typescript
const [isGeneratingProof, setIsGeneratingProof] = useState(false);

const handleOrder = async () => {
  setIsGeneratingProof(true);
  
  try {
    const proof = await mockSDK.generateOrderValidityProof(order);
    // Continue...
  } finally {
    setIsGeneratingProof(false);
  }
};

// In JSX
{isGeneratingProof && (
  <div>
    <Spinner />
    <p>Generating zero-knowledge proof...</p>
  </div>
)}
```

## TypeScript Types

```typescript
// Balance Note
interface BalanceNote {
  asset: string;
  amount: bigint;
  salt: bigint;
  owner: string;
  nullifier: string;
  commitment: string;
}

// Order Commitment
interface OrderCommitment {
  baseAsset: string;
  quoteAsset: string;
  amount: bigint;
  price: bigint;
  orderType: 'BUY' | 'SELL';
  expiration: number;
  nonce: bigint;
  owner: string;
  commitmentHash: string;
}

// API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// WebSocket Event
type WebSocketEvent = 
  | { type: 'order_submitted'; data: { orderId: string } }
  | { type: 'settlement_complete'; data: { executionId: string } }
  | { type: 'tree_root_updated'; data: { newRoot: string } };
```

## Common Issues

### Wallet Not Connecting
```typescript
// Check if wallet is installed
if (!window.starknet) {
  alert('Please install Argent X or Braavos');
  return;
}
```

### BigInt Serialization
```typescript
// Convert BigInt to string for JSON
const orderData = {
  amount: amount.toString(),
  price: price.toString()
};

// Parse back to BigInt
const amount = BigInt(orderData.amount);
```

### WebSocket Reconnection
```typescript
// WebSocket client handles reconnection automatically
// Just check connection status
const { isConnected } = useWebSocket(callback);

if (!isConnected) {
  return <div>Connecting to real-time updates...</div>;
}
```

## Testing

```typescript
// Mock mode (no backend required)
NEXT_PUBLIC_ENABLE_MOCK_MODE=true

// Production mode (requires backend)
NEXT_PUBLIC_ENABLE_MOCK_MODE=false
```

## File Locations

```
product demo/
├── contexts/
│   └── WalletContext.tsx       # Wallet state
├── lib/
│   ├── api-client.ts           # REST API
│   ├── websocket-client.ts     # WebSocket
│   ├── sdk-integration.ts      # SDK wrapper
│   └── contract-integration.ts # Contract calls
├── hooks/
│   ├── use-websocket.ts        # WebSocket hook
│   └── use-api.ts              # API hook
└── app/
    ├── deposit/page.tsx        # Deposit flow
    ├── trading/page.tsx        # Order submission
    ├── withdraw/page.tsx       # Withdrawal flow
    ├── dashboard/page.tsx      # Balance display
    ├── transactions/page.tsx   # Transaction history
    └── audit/page.tsx          # Viewing keys
```

## Next Steps

1. Copy this reference to your workspace
2. Follow patterns for each page integration
3. Replace mock implementations when SDK is ready
4. Test with testnet before mainnet
