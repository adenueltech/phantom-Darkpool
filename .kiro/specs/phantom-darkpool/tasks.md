# Implementation Plan: Phantom Darkpool

## Overview

This implementation plan focuses on building the backend infrastructure, zero-knowledge circuits, smart contracts, cryptographic systems, and integrating with the existing frontend demo. The frontend UI is already complete with all pages and components built using mock data.

**Implementation Language**: TypeScript (backend, APIs, SDK)  
**Smart Contracts**: Cairo (Starknet)  
**Circuits**: Circom  
**Frontend**: Already complete in `product demo/` folder

**Key Focus Areas**:
1. Zero-knowledge circuits (4 circuits for proofs)
2. Smart contracts on Starknet (Shielded Vault, Order Registry, Settlement, Audit Gateway)
3. Cryptographic implementations (Poseidon, Pedersen, nullifiers)
4. Commitment tree system (Merkle tree with Poseidon hash)
5. Matching engine (off-chain order matching with proof generation)
6. Backend APIs (REST/WebSocket for real-time updates)
7. Frontend integration (connect UI to smart contracts and proof generation)
8. Wallet integration (Argent X, Braavos for Starknet)

## Tasks

- [x] 1. Set up project structure and development environment
  - Create monorepo structure with packages for circuits, contracts, backend, SDK, and integration
  - Set up TypeScript configuration for backend and SDK packages
  - Install Circom compiler and SnarkJS for circuit development
  - Install Cairo toolchain (Scarb) for Starknet contract development
  - Set up testing frameworks (Jest for TypeScript, Starknet Foundry for Cairo)
  - Configure linting and formatting (ESLint, Prettier)
  - Create environment configuration files for testnet deployment
  - _Requirements: 20.1_

- [x] 2. Implement cryptographic primitives
  - [x] 2.1 Implement Poseidon hash function wrapper
    - Integrate `circomlibjs` Poseidon implementation
    - Create TypeScript wrapper with type-safe interfaces
    - Implement hash functions for nullifiers, Merkle nodes, and commitments
    - _Requirements: 1.4, 8.1_
  
  - [ ]* 2.2 Write property test for Poseidon hash
    - **Property 23: Proof Generation Determinism**
    - **Validates: Requirements 7.7**
  
  - [x] 2.3 Implement Pedersen commitment system
    - Integrate `bigint-pedersen` library
    - Create commitment function for balance notes (asset, amount, salt, owner)
    - Implement commitment verification
    - _Requirements: 1.1, 1.3_
  
  - [ ]* 2.4 Write property test for Pedersen commitments
    - **Property 1: Balance Note Creation from Deposits**
    - **Validates: Requirements 1.1, 5.1, 5.2**
  
  - [x] 2.5 Implement nullifier generation system
    - Create nullifier generation function using Poseidon(commitment, nullifierSecret)
    - Implement nullifier secret derivation from master key
    - Create nullifier tracking utilities
    - _Requirements: 1.4, 1.5, 9.1_
  
  - [ ]* 2.6 Write property test for nullifier uniqueness
    - **Property 27: Order Nonce Uniqueness**
    - **Validates: Requirements 9.1**

- [x] 3. Implement Merkle commitment tree system
  - [x] 3.1 Create incremental Merkle tree with Poseidon hash
    - Integrate `@zk-kit/incremental-merkle-tree` library
    - Configure tree depth to 20 (supports 1M leaves)
    - Implement tree insertion and root calculation
    - Create Merkle proof generation function
    - Implement Merkle proof verification
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 3.2 Write property test for tree insertion
    - **Property 2: Commitment Tree Insertion**
    - **Validates: Requirements 1.2, 4.6, 5.3, 8.2**
  
  - [ ]* 3.3 Write property test for Merkle proof verification
    - **Property 25: Merkle Proof Generation and Verification**
    - **Validates: Requirements 8.4**
  
  - [ ]* 3.4 Write property test for tree root updates
    - **Property 24: Merkle Tree Root Update**
    - **Validates: Requirements 8.3**
  
  - [x] 3.5 Implement multi-asset tree management
    - Create separate tree instances per asset type
    - Implement asset-specific tree operations
    - Create tree state persistence layer
    - _Requirements: 10.6_
  
  - [ ]* 3.6 Write property test for multi-asset trees
    - **Property 31: Separate Commitment Trees Per Asset**
    - **Validates: Requirements 10.6**

- [x] 4. Checkpoint - Ensure cryptographic primitives work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Develop zero-knowledge circuits in Circom
  - [x] 5.1 Implement Balance Proof circuit
    - Create circuit with public inputs: merkleRoot, nullifier, minAmount
    - Add private inputs: asset, amount, salt, owner, nullifierSecret, merkleProof
    - Implement constraint 1: Verify Pedersen commitment
    - Implement constraint 2: Verify nullifier = Poseidon(commitment, nullifierSecret)
    - Implement constraint 3: Verify Merkle proof against root
    - Implement constraint 4: Verify amount >= minAmount
    - Compile circuit and generate verification key
    - _Requirements: 1.3, 7.1_
  
  - [ ]* 5.2 Write property test for Balance Proof circuit
    - **Property 3: Balance Proof Verification Without Revelation**
    - **Validates: Requirements 1.3, 7.1**
  
  - [x] 5.3 Implement Order Validity Proof circuit
    - Create circuit with public inputs: orderCommitmentHash, timestamp
    - Add private inputs: baseAsset, quoteAsset, amount, price, orderType, expiration, nonce, owner
    - Implement constraint 1: Verify commitment hash = Poseidon(all order fields)
    - Implement constraint 2: Verify amount is positive and within bounds
    - Implement constraint 3: Verify price is positive and within bounds
    - Implement constraint 4: Verify orderType is 0 or 1
    - Implement constraint 5: Verify expiration > timestamp
    - Implement constraint 6: Verify baseAsset != quoteAsset
    - Compile circuit and generate verification key
    - _Requirements: 2.3, 7.2_
  
  - [ ]* 5.4 Write property test for Order Validity Proof circuit
    - **Property 20: Order Validity Proof Generation**
    - **Validates: Requirements 7.2**
  
  - [x] 5.5 Implement Trade Conservation Proof circuit
    - Create circuit with public inputs: executionId, inputNullifiers[], outputCommitments[]
    - Add private inputs: input/output assets, amounts, salts, owners, nullifierSecrets
    - Implement constraint 1: Verify input nullifiers match computed values
    - Implement constraint 2: Verify output commitments match computed values
    - Implement constraint 3: Verify sum of inputs equals sum of outputs per asset
    - Compile circuit and generate verification key
    - _Requirements: 4.1, 7.3, 13.3_
  
  - [ ]* 5.6 Write property test for Trade Conservation Proof circuit
    - **Property 21: Trade Conservation Proof**
    - **Validates: Requirements 7.3, 13.3, 13.6**
  
  - [x] 5.7 Implement Matching Correctness Proof circuit
    - Create circuit with public inputs: orderCommitmentHashes[], executionId
    - Add private inputs: order details (assets, amounts, prices, types, etc.)
    - Implement constraint 1: Verify order commitment hashes
    - Implement constraint 2: Verify price compatibility (buyPrice >= sellPrice)
    - Implement constraint 3: Verify asset pairs match
    - Implement constraint 4: Verify amounts match
    - Compile circuit and generate verification key
    - _Requirements: 3.3, 7.4_
  
  - [ ]* 5.8 Write property test for Matching Correctness Proof circuit
    - **Property 22: Matching Correctness Proof**
    - **Validates: Requirements 7.4**
  
  - [x] 5.9 Generate trusted setup for all circuits
    - Run Powers of Tau ceremony for circuit parameters
    - Generate proving and verification keys for each circuit
    - Export verification keys for smart contract deployment
    - _Requirements: 7.7, 17.2_

- [x] 6. Checkpoint - Ensure all circuits compile and generate valid proofs
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Cairo smart contracts for Starknet
  - [x] 7.1 Implement Shielded Vault contract
    - Create contract with state variables: nullifiers mapping, supportedAssets, commitmentTreeRoot
    - Implement deposit function: accept asset transfer, create balance note commitment, update tree
    - Implement withdraw function: verify balance proof, check nullifier not spent, transfer assets
    - Implement isNullifierSpent view function
    - Add events: Deposit, Withdrawal
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 7.2 Write property test for Shielded Vault
    - **Property 4: Nullifier Prevents Double-Spending**
    - **Validates: Requirements 1.4, 1.6, 4.4, 9.3, 9.4, 17.3**
  
  - [ ]* 7.3 Write property test for withdrawal authorization
    - **Property 16: Withdrawal Authorization**
    - **Validates: Requirements 5.4, 5.5, 5.6**
  
  - [x] 7.4 Implement Order Registry contract
    - Create OrderMetadata struct: commitmentHash, timestamp, expiration, active, cancelled
    - Implement submitOrder function: verify order validity proof, store commitment
    - Implement cancelOrder function: verify ownership proof, mark as cancelled
    - Implement isOrderActive view function
    - Implement getActiveOrders view function
    - Add events: OrderSubmitted, OrderCancelled, OrderExpired
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 11.4, 11.5_
  
  - [ ]* 7.5 Write property test for order storage
    - **Property 8: Order Storage Persistence**
    - **Validates: Requirements 2.4**
  
  - [ ]* 7.6 Write property test for order expiration
    - **Property 9: Order Expiration Exclusion**
    - **Validates: Requirements 2.6, 9.6, 11.3**
  
  - [x] 7.7 Implement Settlement contract
    - Create state variables: verifier addresses, settledExecutions mapping
    - Implement settleExecution function: verify all proofs, check nullifiers, create new commitments
    - Implement verifyProof internal function for each proof type
    - Implement batched settlement function
    - Add events: ExecutionSettled, SettlementFailed
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
  
  - [ ]* 7.8 Write property test for settlement proof verification
    - **Property 13: Settlement Proof Verification**
    - **Validates: Requirements 4.1, 4.2, 4.3, 7.6**
  
  - [ ]* 7.9 Write property test for settlement output creation
    - **Property 14: Settlement Output Creation**
    - **Validates: Requirements 4.5**
  
  - [x] 7.10 Implement Audit Gateway contract
    - Create ViewingKey struct: owner, dataScope, expiration, revoked
    - Implement registerViewingKey function
    - Implement revokeViewingKey function
    - Implement isKeyValid view function
    - _Requirements: 6.1, 6.2, 6.6_
  
  - [ ]* 7.11 Write property test for viewing key access control
    - **Property 17: Viewing Key Access Control**
    - **Validates: Requirements 6.3**
  
  - [x] 7.12 Deploy proof verifier contracts
    - Generate Cairo verifier contracts from circuit verification keys
    - Deploy BalanceProofVerifier contract
    - Deploy OrderValidityProofVerifier contract
    - Deploy TradeConservationProofVerifier contract
    - Deploy MatchingCorrectnessProofVerifier contract
    - _Requirements: 7.5, 7.6_

- [x] 8. Checkpoint - Ensure all smart contracts deploy and interact correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement backend API and matching engine
  - [x] 9.1 Create TypeScript backend server structure
    - Set up Express.js server with TypeScript
    - Configure CORS for frontend integration
    - Set up WebSocket server for real-time updates
    - Create database schema for order book and tree state
    - Implement connection to Starknet RPC provider
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [x] 9.2 Implement order submission API
    - Create POST /api/v1/orders endpoint
    - Validate order commitment and proof format
    - Submit order to Order Registry contract
    - Return order ID and status
    - _Requirements: 15.1_
  
  - [x] 9.3 Implement order status API
    - Create GET /api/v1/orders/:orderId/status endpoint
    - Query Order Registry for order status
    - Return status, timestamp, expiration, execution ID
    - _Requirements: 15.2_
  
  - [x] 9.4 Implement withdrawal API
    - Create POST /api/v1/withdraw endpoint
    - Validate balance proof and Merkle proof
    - Submit withdrawal to Shielded Vault contract
    - Return transaction hash and status
    - _Requirements: 15.3_
  
  - [x] 9.5 Implement balance proof API
    - Create GET /api/v1/balance-proof endpoint
    - Generate balance proof for specified asset and minimum amount
    - Return proof, Merkle root, and nullifier
    - _Requirements: 15.4_
  
  - [x] 9.6 Implement commitment tree query API
    - Create GET /api/v1/commitment-tree endpoint
    - Return current tree root, depth, and leaf count
    - _Requirements: 15.5_
  
  - [x] 9.7 Implement matching engine core logic
    - Create order fetching from Order Registry
    - Implement order grouping by asset pair
    - Implement price-time priority sorting
    - Implement matching algorithm (buy price >= sell price)
    - Create execution bundle generation
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 19.1, 19.2_
  
  - [ ]* 9.8 Write property test for compatible order matching
    - **Property 10: Compatible Order Matching**
    - **Validates: Requirements 3.1, 10.3**
  
  - [ ]* 9.9 Write property test for deterministic matching
    - **Property 12: Deterministic Matching**
    - **Validates: Requirements 3.5, 3.6**
  
  - [x] 9.10 Implement execution bundle submission
    - Generate all required proofs for matched orders
    - Submit execution bundle to Settlement contract
    - Handle settlement success/failure
    - Emit WebSocket events for real-time updates
    - _Requirements: 3.3, 19.4_
  
  - [ ]* 9.11 Write property test for execution bundle generation
    - **Property 11: Execution Bundle Generation**
    - **Validates: Requirements 3.2, 3.3**
  
  - [x] 9.12 Implement WebSocket real-time updates
    - Create WebSocket connection handler
    - Emit order status updates
    - Emit settlement events
    - Emit tree root updates
    - _Requirements: 15.6_

- [x] 10. Checkpoint - Ensure backend APIs and matching engine work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement wallet SDK for proof generation
  - [x] 11.1 Create balance note management
    - Implement createPrivateBalance function
    - Implement getBalance function
    - Implement encrypted note storage in IndexedDB
    - _Requirements: 14.1_
  
  - [x] 11.2 Implement order commitment generation
    - Create generateOrderCommitment function
    - Implement order commitment hash calculation
    - Create submitOrder function
    - _Requirements: 14.2_
  
  - [x] 11.3 Implement proof generation functions
    - Create generateBalanceProof function using SnarkJS
    - Create generateOrderValidityProof function
    - Create generateTradeConservationProof function
    - Create generateMatchingCorrectnessProof function
    - Optimize proof generation with WebAssembly
    - _Requirements: 14.3, 14.5_
  
  - [x] 11.4 Implement viewing key management
    - Create createViewingKey function
    - Implement viewing key derivation from master key
    - Create revokeViewingKey function
    - _Requirements: 14.4, 14.7_
  
  - [ ]* 11.5 Write property test for viewing key decryption
    - **Property 19: Viewing Key Decryption Round-Trip**
    - **Validates: Requirements 6.7**
  
  - [x] 11.6 Implement withdrawal function
    - Create withdraw function with proof generation
    - Implement nullifier generation for withdrawal
    - Submit withdrawal transaction to Shielded Vault
    - _Requirements: 14.4_
  
  - [x] 11.7 Implement encrypted state management
    - Create IndexedDB schema for balance notes and orders
    - Implement encrypted storage with user's master key
    - Create state synchronization with on-chain data
    - _Requirements: 14.6_

- [x] 12. Integrate frontend with backend and smart contracts
  - [x] 12.1 Connect wallet integration to Starknet wallets
    - Integrate Argent X wallet connector
    - Integrate Braavos wallet connector
    - Implement wallet connection flow in existing UI
    - Handle wallet account changes and disconnection
    - _Requirements: 14.1_
  
  - [x] 12.2 Connect deposit flow to Shielded Vault
    - Update deposit page to call Shielded Vault deposit function
    - Generate balance note commitment on successful deposit
    - Store encrypted balance note in local storage
    - Update UI to show deposit confirmation
    - _Requirements: 5.1, 5.2_
  
  - [x] 12.3 Connect order submission to Order Registry
    - Update trading interface to generate order commitments
    - Generate Order Validity Proof before submission
    - Submit order to backend API
    - Update UI to show order status
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 12.4 Connect withdrawal flow to Shielded Vault
    - Update withdrawal page to generate balance proof
    - Generate Merkle proof for balance note
    - Submit withdrawal to backend API
    - Update UI to show withdrawal status
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [x] 12.5 Implement real-time order book updates
    - Connect WebSocket to backend for real-time updates
    - Update order book display on new orders
    - Update order status on settlements
    - Show live matching activity
    - _Requirements: 15.6_
  
  - [x] 12.6 Connect dashboard to balance and transaction data
    - Fetch user's balance notes from encrypted storage
    - Display total balances per asset
    - Show transaction history from on-chain events
    - Update dashboard in real-time
    - _Requirements: 15.4_
  
  - [x] 12.7 Implement audit/compliance features in UI
    - Connect viewing key generation to Audit Gateway
    - Implement viewing key sharing interface
    - Show selective disclosure options
    - Display audit logs
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 13. Checkpoint - Ensure frontend integration works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement testing and validation
  - [x]* 14.1 Write integration tests for deposit-to-withdrawal flow
    - Test full flow: deposit → create note → verify in tree → withdraw
    - Verify nullifier prevents double withdrawal
    - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 5.4, 5.5, 5.6_
  
  - [x]* 14.2 Write integration tests for order-to-settlement flow
    - Test full flow: create order → submit → match → settle → verify new notes
    - Verify order expiration handling
    - Verify order cancellation
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.5_
  
  - [x]* 14.3 Write property test for multi-asset support
    - **Property 29: Multi-Asset Balance Note Support**
    - **Validates: Requirements 10.1, 10.5**
  
  - [x]* 14.4 Write property test for asset type conservation
    - **Property 30: Asset Type Conservation in Settlement**
    - **Validates: Requirements 10.4**
  
  - [x]* 14.5 Write property test for public solvency verification
    - **Property 36: Public Solvency Verification**
    - **Validates: Requirements 13.1, 13.2, 13.4**
  
  - [x]* 14.6 Write property test for no unauthorized balance note creation
    - **Property 37: No Unauthorized Balance Note Creation**
    - **Validates: Requirements 13.5**
  
  - [x]* 14.7 Write property test for encrypted data owner-only decryption
    - **Property 38: Encrypted Data Owner-Only Decryption**
    - **Validates: Requirements 15.7**
  
  - [x]* 14.8 Write property test for order commitment determinism
    - **Property 6: Order Commitment Determinism**
    - **Validates: Requirements 2.1, 2.2, 10.2**
  
  - [x]* 14.9 Write property test for order validity proof requirement
    - **Property 7: Order Validity Proof Requirement**
    - **Validates: Requirements 2.3, 2.5**
  
  - [x]* 14.10 Write property test for nullifier state transition
    - **Property 5: Nullifier State Transition**
    - **Validates: Requirements 1.5, 4.7, 5.7, 9.2**
  
  - [x]* 14.11 Write property test for settlement event privacy
    - **Property 15: Settlement Event Privacy**
    - **Validates: Requirements 4.8**
  
  - [x]* 14.12 Write property test for viewing key revocation
    - **Property 18: Viewing Key Revocation**
    - **Validates: Requirements 6.6**
  
  - [x]* 14.13 Write property test for order expiration timestamp inclusion
    - **Property 32: Order Expiration Timestamp Inclusion**
    - **Validates: Requirements 11.1, 11.2**
  
  - [x]* 14.14 Write property test for order cancellation authorization
    - **Property 33: Order Cancellation Authorization**
    - **Validates: Requirements 11.4, 11.5**
  
  - [x]* 14.15 Write property test for cancelled order exclusion
    - **Property 34: Cancelled Order Exclusion**
    - **Validates: Requirements 11.6**
  
  - [x]* 14.16 Write property test for batched settlement atomicity
    - **Property 35: Batched Settlement Atomicity**
    - **Validates: Requirements 12.3**
  
  - [x]* 14.17 Write property test for key rotation preservation
    - **Property 39: Key Rotation Preservation**
    - **Validates: Requirements 17.4**
  
  - [x]* 14.18 Write property test for matching engine order retrieval
    - **Property 44: Matching Engine Order Retrieval**
    - **Validates: Requirements 19.1**
  
  - [x]* 14.19 Write property test for dual settlement mode support
    - **Property 45: Dual Settlement Mode Support**
    - **Validates: Requirements 19.6**

- [x] 15. Implement security and performance optimizations
  - [x] 15.1 Optimize proof generation performance
    - Implement WebAssembly compilation for circuits
    - Add proof generation caching
    - Parallelize multi-proof generation
    - Pre-compute common circuit components
    - _Requirements: 12.1, 12.2_
  
  - [x] 15.2 Optimize smart contract gas costs
    - Implement batched proof verification
    - Optimize verifier contract assembly code
    - Implement proof aggregation where possible
    - _Requirements: 12.2, 12.5_
  
  - [x] 15.3 Implement security hardening
    - Add rate limiting to API endpoints
    - Implement replay attack prevention
    - Add circuit constraint validation
    - Implement emergency pause mechanism in contracts
    - _Requirements: 9.3, 9.4, 17.3, 17.5_
  
  - [x] 15.4 Add monitoring and alerting
    - Implement transaction success rate monitoring
    - Add proof verification failure alerts
    - Monitor double-spend attempts
    - Track gas cost metrics
    - _Requirements: 20.4_

- [x] 16. Checkpoint - Ensure all optimizations and security measures work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Deploy to Starknet testnet
  - [ ] 17.1 Deploy verifier contracts to testnet
    - Deploy BalanceProofVerifier
    - Deploy OrderValidityProofVerifier
    - Deploy TradeConservationProofVerifier
    - Deploy MatchingCorrectnessProofVerifier
    - Verify contract source code on block explorer
    - _Requirements: 7.5, 7.6_
  
  - [ ] 17.2 Deploy core contracts to testnet
    - Deploy Shielded Vault with verifier addresses
    - Deploy Order Registry
    - Deploy Settlement Contract with all dependencies
    - Deploy Audit Gateway
    - Initialize commitment trees
    - Whitelist supported test assets (ETH, USDC, STRK)
    - _Requirements: 5.1, 2.4, 4.1, 6.1_
  
  - [ ] 17.3 Deploy backend services to testnet
    - Deploy backend API server
    - Deploy matching engine service
    - Configure WebSocket server
    - Set up database for order book state
    - Configure Starknet RPC connections
    - _Requirements: 15.1, 19.1_
  
  - [ ] 17.4 Test end-to-end flows on testnet
    - Test deposit flow with testnet tokens
    - Test order submission and matching
    - Test settlement execution
    - Test withdrawal flow
    - Verify all proofs verify correctly on-chain
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [ ] 17.5 Update frontend to connect to testnet
    - Configure frontend to use testnet contract addresses
    - Update wallet connectors for testnet
    - Update API endpoints to testnet backend
    - Test all UI flows with testnet deployment
    - _Requirements: 14.1, 15.1_

- [ ] 18. Documentation and deployment preparation
  - [ ] 18.1 Create API documentation
    - Document all REST API endpoints
    - Document WebSocket event types
    - Create API usage examples
    - Document error codes and handling
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ] 18.2 Create SDK documentation
    - Document wallet SDK functions
    - Create integration guide for wallets
    - Document proof generation APIs
    - Create code examples for common flows
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ] 18.3 Create deployment guide
    - Document contract deployment sequence
    - Document backend service deployment
    - Create configuration guide
    - Document monitoring setup
    - _Requirements: 20.1_
  
  - [ ] 18.4 Create user guide
    - Document how to connect wallet
    - Document how to deposit and withdraw
    - Document how to place orders
    - Document how to view transaction history
    - Document audit/compliance features
    - _Requirements: 14.1, 15.1, 15.2, 15.3_

- [ ] 19. Final checkpoint - Verify complete system functionality
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 45 correctness properties are tested
  - Verify all requirements are covered by implementation
  - Verify frontend is fully integrated with backend
  - Verify testnet deployment is stable and functional

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design document
- Integration tests validate specific examples and end-to-end flows
- The frontend UI is already complete - focus is on backend, contracts, and integration
- All smart contracts are deployed on Starknet using Cairo
- Backend services and SDK are implemented in TypeScript
- Zero-knowledge circuits are implemented in Circom

## Property Test Coverage

This implementation plan includes property-based tests for all 45 correctness properties defined in the design document:

**Properties 1-10**: Balance notes, commitments, nullifiers, orders, matching  
**Properties 11-20**: Execution bundles, settlement, proofs, viewing keys  
**Properties 21-30**: Trade conservation, matching correctness, multi-asset support  
**Properties 31-40**: Asset trees, expiration, cancellation, solvency, encryption  
**Properties 41-45**: Compliance, jurisdiction, matching engine, settlement modes

Each property test is annotated with its property number and the requirements it validates, ensuring complete traceability from requirements through design to implementation and testing.
