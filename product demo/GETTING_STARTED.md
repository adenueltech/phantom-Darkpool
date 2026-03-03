# Getting Started with Phantom Darkpool Demo

## Quick Start

The complete Phantom Darkpool demo UI is fully functional with beautiful cyberpunk-inspired design. All pages are interactive and ready to explore.

### Access the Application

1. **Landing Page** - Visit `/` to see the introduction and feature overview
2. **Dashboard** - Click "Launch App" or visit `/dashboard` to access your portfolio
3. **Explore All Pages** - Use the sidebar navigation to explore every feature

---

## Page Walkthrough

### 1. Start at the Landing Page
**Route**: `/`

- Read about the zero-knowledge private trading infrastructure
- Understand the four core layers (Private Balance, Order Commitment, Matching Engine, Settlement)
- See key cryptographic technologies used
- Get inspired by the cyberpunk design aesthetic

**Interactive Elements**:
- Click "Launch App" button to go to dashboard
- Explore feature cards
- View architecture overview

---

### 2. Dashboard - Your Portfolio Hub
**Route**: `/dashboard`

This is your main hub showing:
- **Total Balance**: Aggregated portfolio value in USD
- **Individual Assets**: ETH, USDC, DAI with performance indicators
- **Quick Actions**: Deposit, Withdraw, Trade, Refresh buttons
- **Recent Activity**: Transaction history with status indicators
- **Privacy Notice**: Explanation of how your data is protected

**What to Try**:
1. Review your total balance and asset breakdown
2. Check the recent activity section
3. Note the privacy guarantee notice
4. Click action buttons (they navigate or show flows)

**Key Features**:
- All balances shown as encrypted commitments
- Only zero-knowledge proofs verified on-chain
- Real-time status updates
- Privacy-first design

---

### 3. Trading - Private Order Placement
**Route**: `/trading`

Three main sections:

#### Order Placement Form (Left Sidebar)
- **Buy/Sell Toggle**: Switch between order types
- **Trading Pair Selection**: Choose ETH/USDC, USDC/DAI, or ETH/DAI
- **Amount Input**: Enter order size
- **Limit Price**: Set your limit price
- **Expiry Selection**: Choose when order expires
- **Privacy Notice**: Shows that orders are encrypted

#### Order Book (Center)
- **Sell Orders** (Top): Red-colored, higher prices
- **Spread**: Gap between best buy and sell prices
- **Buy Orders** (Bottom): Green-colored, lower prices
- **Lock Icons**: Indicate encrypted amounts

#### Your Active Orders (Bottom)
- **Status Tracking**: See which orders are active or partially matched
- **Match Percentage**: Visual progress bar
- **Cancel Action**: Remove orders you no longer need

**What to Try**:
1. Toggle between Buy and Sell modes
2. Change the trading pair
3. Enter an amount and observe the form
4. Check the order book to see market depth
5. Review your active orders table
6. Note how much information is encrypted

**Key Privacy Features**:
- Order amounts are encrypted with commitments
- Prices shown are partially revealed
- Full details only visible to matched counterparty
- No front-running possible

---

### 4. Transactions - Settlement History
**Route**: `/transactions`

View all your completed trades and account management:

#### Statistics Dashboard
- **Total Settled**: All completed trades value
- **Pending**: Trades awaiting settlement
- **Average Settlement Time**: ~45 seconds with ZK proofs
- **Total Fees**: All trading fees combined

#### Filters
- **All**: Show everything
- **Deposits**: Funding your account
- **Withdrawals**: Withdrawing funds
- **Trades**: Actual trading transactions

#### Transaction Details
Each row shows:
- **Type Icon**: Visual indicator of transaction type
- **From → To**: What changed (e.g., ETH → USDC)
- **Amount**: How much was transacted
- **Status**: Current settlement state
- **Proof**: Verification status (Verified or Verifying)
- **Time**: When it occurred
- **View**: Details button for more info

**What to Try**:
1. Use filters to see different transaction types
2. Look at the proof verification column
3. Note the average settlement time
4. Click "View" to see full transaction details
5. Review how zero-knowledge proofs work

**Key Security Features**:
- All proofs verified on-chain
- Trade conservation proofs ensure fair value
- Matching correctness proofs guarantee fair prices
- Settlement immutable once confirmed

---

### 5. Audit & Compliance - Viewing Keys
**Route**: `/audit`

Selectively disclose data to auditors while maintaining privacy:

#### Create Viewing Key
**Form Fields**:
- **Data Scope**: Choose what data to share
  - Balance Notes
  - Order Commitments
  - Trade History
  - All Data
- **Auditor/Recipient**: Who gets access (e.g., "Deloitte Audit")
- **Expiration**: How long the key remains valid
- **Purpose**: Why you're sharing (e.g., "Tax compliance")

#### Your Viewing Keys
Shows all active and expired keys:
- **Status**: Active or Expired
- **Auditor**: Who has access
- **Dates**: Created and expiry times
- **Disclosure Status**: Whether auditor accessed it
- **Actions**: Show/hide key, copy, revoke

#### System Solvency Proofs
Publicly verifiable proofs that:
- Total deposits equal total commitments
- System maintains reserve requirements
- No value is created or destroyed
- All participants' funds are accounted for

**What to Try**:
1. Fill out the form to create a viewing key
2. Review existing keys and their status
3. Toggle show/hide for key values
4. Check solvency proofs
5. Understand time-based key expiration

**Key Compliance Features**:
- Time-limited access to data
- Scope-based restrictions
- On-chain key registry
- Audit trail of key usage

---

### 6. Settings - Account Configuration
**Route**: `/settings`

Manage all account settings across four tabs:

#### Wallet Tab
- **Connected Wallet**: Shows MetaMask connection
- **Connected Assets**: List of assets you can trade
- **Add Asset**: Support new tokens for trading
- **Network Selection**: Choose blockchain (Ethereum, Arbitrum, etc.)

#### Security Tab
- **Cryptographic Keys**: View key protection status
  - Master Secret (root key)
  - Nullifier Secret (spend authorization)
  - Viewing Key (selective disclosure)
- **Key Rotation**: Change keys without losing funds
- **Backup & Recovery**: 
  - Download backup file
  - View recovery phrase
  - Verify backup is valid

#### Privacy Tab
- **Hide Balance**: Don't show amounts in UI
- **Randomize Timing**: Break timing correlations
- **Split Deposits**: Automatic note fragmentation
- **Require Viewing Key**: All audits need explicit approval

#### Notifications Tab
- **Order Matched**: When counterparties found
- **Settlement Complete**: Trade confirmed on-chain
- **Order Expiring**: Reminder before expiry
- **System Updates**: Security patches
- **Viewing Key Access**: When auditors access data

**What to Try**:
1. Review your connected wallet and assets
2. Explore security key management
3. Toggle privacy options
4. Review notification preferences
5. Understand each security mechanism

**Key Account Features**:
- Non-custodial key management
- Local proof generation capability
- Privacy-preserving default settings
- Full user control

---

### 7. Deposit Flow - Multi-Step Process
**Route**: `/deposit`

Complete guide to adding funds:

#### Step 1: Select Asset
Choose which asset to deposit (ETH, USDC, or DAI)

#### Step 2: Enter Amount
- Input the amount you want to deposit
- See maximum available from your wallet
- Check estimated gas fees
- Review total cost

#### Step 3: Review
- Confirm all details
- Read privacy guarantee
- Understand the deposit process
- See what happens next

#### Step 4: Confirming
- Watch the processing animation
- See proof generation feedback
- Blockchain interaction confirmation

#### Step 5: Complete
- Success message
- Transaction hash
- Commitment root reference
- Guidance on next steps

**What to Try**:
1. Click through each step
2. Read the privacy notices
3. Review the step-by-step process
4. Understand how balance notes work
5. See the complete flow without actually transacting

**Key Deposit Features**:
- Multi-asset support
- Clear step-by-step process
- Gas fee transparency
- Privacy guarantee throughout

---

### 8. Order Details - Deep Dive
**Route**: `/order/[id]` (Example: `/order/ORD-2024-001`)

Comprehensive view of a specific order:

#### Order Status Overview
- **Order ID and Status**: Type, pair, current state
- **Amount and Value**: Size and USD equivalent
- **Quick Stats**: Order type, pair, price, matching status

#### Timing Information
- **Created**: When the order was placed
- **Expires**: When the order becomes invalid
- **Last Updated**: Recent activity timestamp

#### Order Specification
- **Commitment Hash**: Encrypted order identifier
- **Nonce**: Unique order number
- **Owner**: Your public key (anonymized)

#### Matching Status
- **Matched Amount**: How much has been filled
- **Match Progress**: Visual percentage bar
- **Awaiting Match**: Remaining unfilled amount

#### Settlements
- **Execution ID**: Each completed trade
- **Matched With**: Order paired with this one
- **Amount & Price**: Trade specifics
- **Execution Time**: When it settled

#### Zero-Knowledge Proofs
All proofs shown as verified:
- ✓ **Order Validity Proof**: Order params in valid ranges
- ✓ **Balance Proof**: You had sufficient funds
- ✓ **Matching Correctness Proof**: Match was fair
- ✓ **Trade Conservation Proof**: No value created/destroyed

**What to Try**:
1. Review all order details
2. Check matching status and progress
3. See all executed settlements
4. Review all proof types and status
5. Understand the cryptographic guarantees

**Key Details Features**:
- Complete audit trail
- Proof verification status
- Full transparency on settlements
- Privacy-preserving design

---

## Design System Tour

### Color Meanings
- **🟣 Electric Violet** (`#8B5CF6`): Primary actions, important highlights
- **🔷 Neon Cyan** (`#22D3EE`): Secondary actions, information
- **🟢 Success Green** (`#10B981`): Positive status, achievements
- **🟠 Warning Orange** (`#F59E0B`): Pending or cautionary
- **🔴 Error Red** (`#EF4444`): Errors, danger

### Key Indicators
- **Lock Icon** 🔒: Data is encrypted
- **Check Icon** ✓: Verified/Confirmed
- **Clock Icon** ⏱: Pending/Processing
- **Alert Icon** ⚠: Important notice

---

## Navigation Tips

### Sidebar Navigation (Desktop)
- Click any nav item to jump to that page
- Active page is highlighted in violet
- Current user status at bottom
- Responsive collapse on mobile

### Mobile Navigation
- Hamburger menu in top-left
- Swipe or click to toggle sidebar
- Overlay closes when clicking a link
- Fixed header for easy access

### Common Actions
- **Back Button**: Use browser back or "Back" links
- **Action Buttons**: Primary (violet), Secondary (cyan)
- **Form Submission**: Disabled until required fields filled
- **Status Indicators**: Colors show current state

---

## Understanding Zero-Knowledge Proofs

The demo explains ZK proofs throughout:

1. **Balance Proof**: Prove you have funds without revealing amount
2. **Order Validity Proof**: Prove order parameters are valid
3. **Matching Correctness Proof**: Prove fair price agreement
4. **Trade Conservation Proof**: Prove inputs equal outputs

Each proof:
- Takes 30-60 seconds to generate locally
- Takes <500ms to verify on-chain
- Requires no trusted third parties
- Uses Groth16 with proven circuits

---

## Privacy Features Highlighted

Explore these privacy mechanisms throughout the demo:

1. **Balance Encryption**: All amounts are commitments, not values
2. **Order Commitments**: Orders hidden until matched
3. **Nullifier System**: Prevents double-spending
4. **Selective Disclosure**: Share data only when needed
5. **Deterministic Matching**: Fair without revealing details
6. **Non-Custodial**: You control all keys

---

## Key Takeaways

1. **Complete Privacy**: Balance and order details fully encrypted
2. **Cryptographic Guarantees**: Zero-knowledge proofs verify correctness
3. **Non-Custodial**: You maintain full control of assets
4. **Compliance Ready**: Selective disclosure for audits
5. **Fair Trading**: Deterministic matching prevents front-running
6. **User-Friendly**: Complex cryptography, simple interface

---

## Next Steps

- **Share with Others**: Show the beautiful UI to your team
- **Review Documentation**: Read FEATURES.md for comprehensive details
- **Integrate Backend**: Connect to actual Phantom Darkpool infrastructure
- **Add Real Wallet**: Implement actual MetaMask connection
- **Proof Generation**: Add actual zero-knowledge proof flows

---

## Support & Questions

For questions about Phantom Darkpool:
- Review the design document for system details
- Check requirements document for specifications
- Explore each page's help sections
- Read embedded privacy notices throughout the app

---

Enjoy exploring Phantom Darkpool! 🔐
