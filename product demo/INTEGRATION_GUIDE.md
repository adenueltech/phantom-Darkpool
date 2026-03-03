# Frontend Integration Guide

This guide explains how the Phantom Darkpool frontend integrates with the backend API, smart contracts, and SDK.

## Architecture Overview

```
Frontend (Next.js)
├── Wallet Integration (Starknet)
│   ├── Argent X
│   └── Braavos
├── API Client (REST)
│   └── Backend API calls
├── WebSocket Client (Real-time)
│   └── Live updates
├── SDK Integration
│   ├── Proof Generation
│   ├── Balance Management
│   └── State Management
└── Contract Integration
    ├── Shielded Vault
    ├── Order Registry
    ├── Settlement
    └── Audit Gateway
```

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the following variables:
- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NEXT_PUBLIC_WS_URL`: WebSocket server endpoint
- `NEXT_PUBLIC_RPC_URL`: Starknet RPC provider
- Contract addresses (after deployment)

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

Required packages:
- `starknet`: Starknet.js library
- `@starknet-io/get-starknet-core`: Wallet connection

### 3. Run Development Server

```bash
npm run dev
```

## Integration Components

### Wallet Integration (`contexts/WalletContext.tsx`)

Handles Starknet wallet connections:

```typescript
import { useWallet } from '@/contexts/WalletContext';

function MyComponent() {
  const { isConnected, walletAddress, account, connect, disconnect } = useWallet();
  
  // Connect wallet
  await connect('argent'); // or 'braavos'
  
  // Use account for transactions
  if (account) {
    // Make contract calls
  }
}
```

Features:
- ✅ Argent X integration
- ✅ Braavos integration
- ✅ Account change detection
- ✅ Auto-reconnection
- ✅ Protected route handling

### API Client (`lib/api-client.ts`)

REST API communication:

```typescript
import { apiClient } from '@/lib/api-client';

// Submit order
const result = await apiClient.submitOrder({
  orderCommitment: '0x...',
  expiration: Date.now() + 3600000,
  orderValidityProof: '0x...'
});

// Get order status
const status = await apiClient.getOrderStatus(orderId);

// Submit withdrawal
const withdrawal = await apiClient.submitWithdrawal({
  nullifier: '0x...',
  recipient: '0x...',
  amount: '1000000',
  balanceProof: '0x...',
  merkleProof: ['0x...']
});
```

### WebSocket Client (`lib/websocket-client.ts`)

Real-time updates:

```typescript
import { useWebSocket } from '@/hooks/use-websocket';

function OrderBook() {
  const { isConnected } = useWebSocket((event) => {
    switch (event.type) {
      case 'order_submitted':
        // Update order book
        break;
      case 'settlement_complete':
        // Update settlements
        break;
      case 'tree_root_updated':
        // Update tree state
        break;
    }
  });
}
```

Events:
- `order_submitted`: New order added
- `order_cancelled`: Order cancelled
- `order_matched`: Orders matched
- `settlement_complete`: Settlement executed
- `tree_root_updated`: Merkle tree updated

### SDK Integration (`lib/sdk-integration.ts`)

Proof generation and state management:

```typescript
import { phantomSDK, mockSDK } from '@/lib/sdk-integration';

// Create private balance
const note = await mockSDK.createPrivateBalance(
  '0xETH_ADDRESS',
  BigInt(1000000)
);

// Generate order commitment
const order = await mockSDK.generateOrderCommitment({
  baseAsset: '0xETH',
  quoteAsset: '0xUSDC',
  amount: BigInt(100),
  price: BigInt(2000),
  orderType: 'BUY',
  expiration: Date.now() + 3600000
});

// Generate proofs
const balanceProof = await mockSDK.generateBalanceProof();
const orderProof = await mockSDK.generateOrderValidityProof();
```

Note: Currently using mock implementations. Replace with actual SDK calls when `packages/sdk` is integrated.

### Contract Integration (`lib/contract-integration.ts`)

Smart contract interactions:

```typescript
import { contractClient, mockContractClient } from '@/lib/contract-integration';

// Set account from wallet
contractClient.setAccount(account);

// Deposit
const txHash = await mockContractClient.deposit(
  '0xETH',
  BigInt(1000000),
  '0xCOMMITMENT'
);

// Submit order
const orderId = await mockContractClient.submitOrder(
  '0xORDER_COMMITMENT',
  Date.now() + 3600000,
  '0xPROOF'
);

// Withdraw
const withdrawTx = await mockContractClient.withdraw(
  '0xNULLIFIER',
  '0xRECIPIENT',
  BigInt(1000000),
  '0xPROOF',
  ['0xMERKLE_PROOF']
);
```

## Page Integration Status

### ✅ Task 12.1: Wallet Integration
- [x] Argent X connector
- [x] Braavos connector
- [x] Wallet connection flow
- [x] Account change handling
- [x] Disconnect handling

### 🔄 Task 12.2: Deposit Flow
Location: `app/deposit/page.tsx`

Integration points:
1. Call `contractClient.deposit()` on form submission
2. Generate balance note commitment using SDK
3. Store encrypted note in IndexedDB
4. Show transaction confirmation

### 🔄 Task 12.3: Order Submission
Location: `app/trading/page.tsx`

Integration points:
1. Generate order commitment using SDK
2. Generate Order Validity Proof
3. Call `apiClient.submitOrder()`
4. Update UI with order status

### 🔄 Task 12.4: Withdrawal Flow
Location: `app/withdraw/page.tsx`

Integration points:
1. Generate balance proof using SDK
2. Get Merkle proof from API
3. Call `apiClient.submitWithdrawal()`
4. Show withdrawal status

### 🔄 Task 12.5: Real-time Updates
Location: `app/trading/page.tsx`, `app/transactions/page.tsx`

Integration points:
1. Connect WebSocket on mount
2. Subscribe to relevant events
3. Update order book display
4. Update settlement status

### 🔄 Task 12.6: Dashboard Data
Location: `app/dashboard/page.tsx`

Integration points:
1. Fetch balance notes from IndexedDB
2. Calculate total balances per asset
3. Query transaction history from API
4. Subscribe to real-time updates

### 🔄 Task 12.7: Audit Features
Location: `app/audit/page.tsx`

Integration points:
1. Generate viewing keys using SDK
2. Register keys via `contractClient.registerViewingKey()`
3. Implement key sharing interface
4. Display audit logs

## Mock Mode

For development without backend/contracts, use mock implementations:

```typescript
// In .env.local
NEXT_PUBLIC_ENABLE_MOCK_MODE=true
```

Mock clients provide:
- Simulated API responses
- Fake proof generation
- Mock contract transactions
- Realistic delays

## Testing Integration

### Test Wallet Connection
1. Go to `/connect`
2. Click "Argent X" or "Braavos"
3. Approve connection in wallet
4. Verify redirect to dashboard

### Test Order Submission
1. Go to `/trading`
2. Fill order form
3. Click "Place Order"
4. Verify proof generation
5. Check order appears in order book

### Test WebSocket
1. Open browser console
2. Go to `/trading`
3. Watch for WebSocket connection log
4. Submit order
5. Verify real-time update

## Next Steps

1. **Complete SDK Integration**
   - Replace mock implementations in `lib/sdk-integration.ts`
   - Import actual functions from `packages/sdk`

2. **Complete Contract Integration**
   - Add contract ABIs
   - Implement actual contract calls
   - Handle transaction confirmations

3. **Add State Management**
   - Implement IndexedDB for encrypted storage
   - Add state synchronization
   - Handle offline mode

4. **Add Error Handling**
   - User-friendly error messages
   - Retry logic
   - Fallback mechanisms

5. **Add Loading States**
   - Proof generation progress
   - Transaction pending states
   - Optimistic UI updates

## Troubleshooting

### Wallet Not Connecting
- Ensure wallet extension is installed
- Check wallet is on correct network
- Clear browser cache and retry

### API Errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend server is running
- Inspect network tab for error details

### WebSocket Not Connecting
- Verify `NEXT_PUBLIC_WS_URL` is correct
- Check WebSocket server is running
- Look for CORS issues

### Proof Generation Fails
- Ensure SDK is properly integrated
- Check circuit files are available
- Verify input parameters are valid

## Resources

- [Starknet.js Documentation](https://www.starknetjs.com/)
- [get-starknet Documentation](https://github.com/starknet-io/get-starknet)
- [Phantom Darkpool Spec](.kiro/specs/phantom-darkpool/)
- [Backend API Documentation](../packages/backend/README.md)
- [SDK Documentation](../packages/sdk/README.md)
