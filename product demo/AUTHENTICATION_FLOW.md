# Authentication Flow Documentation

## Overview

Phantom Darkpool uses **wallet-based authentication** for secure, non-custodial access to the private trading platform. Users must connect their Web3 wallet to access any protected features.

## Why Wallet Authentication?

For a zero-knowledge private trading system, wallet authentication is essential because:

1. **Cryptographic Operations**: Users need private keys to generate zero-knowledge proofs
2. **Non-Custodial Design**: Users maintain full control of their assets and keys
3. **On-Chain Interactions**: Deposits, withdrawals, and settlements require wallet signatures
4. **Privacy Preservation**: No email/password means no personal data collection

## User Flow

### 1. Landing Page (`/`)
- Public marketing page showcasing features
- "Connect Wallet" button in header and hero section
- No authentication required

### 2. Connect Wallet Page (`/connect`)
- Displays wallet connection options:
  - **Argent X** (Popular, Starknet) - Starknet native wallet
  - **Braavos** (Popular, Starknet) - Starknet native wallet
  - **MetaMask** (Popular) - Browser extension
  - **WalletConnect** - Mobile wallet QR code
  - **Coinbase Wallet** - Coinbase integration
  - **Phantom** - Phantom wallet
- Shows security features and benefits
- Simulates wallet connection (1.5s delay)
- Stores connection state in localStorage
- Redirects to `/dashboard` on success

### 3. Protected Routes
All app pages require wallet connection:
- `/dashboard` - Portfolio overview
- `/trading` - Place orders
- `/deposit` - Deposit assets
- `/withdraw` - Withdraw assets
- `/transactions` - Transaction history
- `/audit` - Audit logs
- `/settings` - User settings
- `/order/[id]` - Order details

### 4. Automatic Redirect
- If user tries to access protected route without wallet connection
- Automatically redirected to `/connect` page
- After connecting, user can navigate to any protected route

### 5. Disconnect
- "Disconnect" button in sidebar
- Clears wallet connection state
- Redirects to landing page (`/`)

## Technical Implementation

### WalletContext (`contexts/WalletContext.tsx`)

Provides global wallet state management:

```typescript
interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  disconnect: () => void;
}
```

**Features:**
- Checks localStorage for existing connection on mount
- Protects routes by redirecting unauthenticated users
- Provides disconnect functionality
- Persists connection state across page refreshes

### Storage Keys

Connection state stored in localStorage:
- `wallet_connected`: "true" | null
- `wallet_address`: "0x..." | null
- `wallet_type`: "argent" | "braavos" | "metamask" | "walletconnect" | "coinbase" | "phantom" | null

### AppWrapper Updates

The sidebar now displays:
- Connected wallet address (formatted: `0x742d...0bEb`)
- Wallet icon indicator
- Functional disconnect button

## Security Considerations

### Current Implementation (Demo)
- Simulated wallet connection
- localStorage for state persistence
- No actual blockchain interaction

### Production Requirements
1. **Real Wallet Integration**
   - Use ethers.js or web3.js
   - Implement actual wallet connection logic
   - Handle wallet events (account change, disconnect)

2. **Signature Verification**
   - Request signature on connection
   - Verify signature server-side
   - Generate session token

3. **Session Management**
   - Use secure session tokens
   - Implement token refresh
   - Handle session expiration

4. **Network Validation**
   - Check connected network
   - Prompt network switch if needed
   - Support multiple chains

5. **Error Handling**
   - Wallet not installed
   - User rejection
   - Network errors
   - Transaction failures

## Integration with Zero-Knowledge Features

Once authenticated, the wallet is used for:

1. **Proof Generation**
   - Balance proofs (user owns sufficient funds)
   - Order validity proofs
   - Trade conservation proofs
   - All proofs generated client-side

2. **Transaction Signing**
   - Deposit transactions
   - Order commitments
   - Withdrawal requests
   - Settlement confirmations

3. **Key Management**
   - Viewing keys for selective disclosure
   - Nullifier derivation
   - Commitment randomness generation

## Future Enhancements

1. **Multi-Wallet Support**
   - Allow multiple wallet connections
   - Switch between wallets
   - Aggregate balances

2. **Social Recovery**
   - Guardian-based recovery
   - Multi-sig support

3. **Hardware Wallet Support**
   - Ledger integration
   - Trezor integration

4. **Mobile Optimization**
   - Deep linking for mobile wallets
   - In-app browser detection
   - QR code scanning

## Testing the Flow

1. Visit landing page: `http://localhost:3000`
2. Click "Connect Wallet" button
3. Select any wallet option (MetaMask recommended)
4. Wait for connection simulation (1.5s)
5. Redirected to dashboard with wallet connected
6. See wallet address in sidebar
7. Navigate to any protected route
8. Click "Disconnect" to log out

## Code Examples

### Checking Connection Status
```typescript
import { useWallet } from '@/contexts/WalletContext';

function MyComponent() {
  const { isConnected, walletAddress } = useWallet();
  
  if (!isConnected) {
    return <div>Please connect wallet</div>;
  }
  
  return <div>Connected: {walletAddress}</div>;
}
```

### Disconnecting
```typescript
import { useWallet } from '@/contexts/WalletContext';

function DisconnectButton() {
  const { disconnect } = useWallet();
  
  return (
    <button onClick={disconnect}>
      Disconnect Wallet
    </button>
  );
}
```

### Protected Route
```typescript
'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { isConnected } = useWallet();
  const router = useRouter();
  
  useEffect(() => {
    if (!isConnected) {
      router.push('/connect');
    }
  }, [isConnected, router]);
  
  if (!isConnected) {
    return <div>Loading...</div>;
  }
  
  return <div>Protected content</div>;
}
```

## Files Modified/Created

### New Files
- `app/connect/page.tsx` - Wallet connection page
- `app/connect/loading.tsx` - Loading state
- `contexts/WalletContext.tsx` - Wallet state management
- `AUTHENTICATION_FLOW.md` - This documentation

### Modified Files
- `app/layout.tsx` - Added WalletProvider wrapper
- `app/app-wrapper.tsx` - Added wallet display and disconnect
- `app/page.tsx` - Updated CTAs to point to /connect

## Summary

The authentication flow ensures that only users with connected wallets can access the private trading features. This aligns with the zero-knowledge architecture where all cryptographic operations require user-controlled private keys. The implementation is currently a demo simulation but provides the foundation for production wallet integration.
