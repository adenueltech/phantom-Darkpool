# Phantom Darkpool SDK

Client-side SDK for wallet integration and proof generation.

## Features

- Balance note management
- Order commitment generation
- Zero-knowledge proof generation
- Viewing key management
- Encrypted state storage

## Installation

```bash
npm install @phantom-darkpool/sdk
```

## Usage

```typescript
import { PhantomWallet } from '@phantom-darkpool/sdk';

const wallet = new PhantomWallet(provider);

// Create private balance
const note = await wallet.createPrivateBalance('ETH', 1000n);

// Generate order commitment
const order = await wallet.generateOrderCommitment({
  baseAsset: 'ETH',
  quoteAsset: 'USDC',
  amount: 100n,
  price: 2000n,
  orderType: 'BUY',
  expiration: Date.now() + 3600000,
});

// Submit order
const orderId = await wallet.submitOrder(order);
```
