# Requirements Document

## Introduction

Phantom Darkpool is a zero-knowledge private trading infrastructure that enables fully confidential decentralized trading. The system allows users to place, match, and execute trades without revealing order size, asset balances, trade intent, pricing strategy, or wallet identity linkage. All trade validity is publicly verifiable while sensitive trading data remains confidential, eliminating front-running, MEV exploitation, strategy leakage, and balance surveillance.

## Glossary

- **Phantom_System**: The complete zero-knowledge private trading infrastructure
- **Private_Balance_Layer**: Component that maintains shielded asset balances using encrypted state commitments
- **Order_Commitment_Layer**: Component that processes private orders as cryptographic commitments
- **Matching_Engine**: Component that identifies compatible orders without seeing actual values
- **Settlement_Layer**: Component that executes trades and updates private balances
- **Balance_Note**: Encrypted UTXO-like structure representing a user's shielded balance
- **Order_Commitment**: Cryptographic commitment representing an encrypted order
- **Nullifier**: Unique identifier that prevents reuse of spent balance notes
- **Commitment_Tree**: Merkle tree storing all balance note commitments
- **Execution_Bundle**: Data structure containing matched order IDs, settlement proof, and new balance commitments
- **Viewing_Key**: Cryptographic key enabling selective disclosure of private data
- **Shielded_Vault**: Smart contract managing deposits and encrypted note creation
- **Order_Registry**: Smart contract storing order commitments and metadata
- **Settlement_Contract**: Smart contract verifying execution proofs and updating balance state
- **Audit_Gateway**: Smart contract managing viewing key registry and selective disclosure
- **Zero_Knowledge_Proof**: Cryptographic proof that validates statements without revealing underlying data
- **Balance_Proof**: Zero-knowledge proof demonstrating sufficient funds ownership
- **Order_Validity_Proof**: Zero-knowledge proof that order parameters are within allowed ranges
- **Trade_Conservation_Proof**: Zero-knowledge proof that trade inputs equal outputs
- **Matching_Correctness_Proof**: Zero-knowledge proof that matched orders satisfy price rules

## Requirements

### Requirement 1: Private Balance Management

**User Story:** As a trader, I want to maintain shielded asset balances, so that my holdings remain confidential while being verifiable.

#### Acceptance Criteria

1. WHEN a user deposits assets, THE Private_Balance_Layer SHALL create an encrypted Balance_Note
2. THE Private_Balance_Layer SHALL add each Balance_Note to the Commitment_Tree
3. WHEN validating ownership, THE Private_Balance_Layer SHALL verify the Balance_Proof without revealing the balance amount
4. THE Private_Balance_Layer SHALL prevent double spending by tracking Nullifiers
5. WHEN a Balance_Note is spent, THE Private_Balance_Layer SHALL mark its Nullifier as used
6. THE Private_Balance_Layer SHALL reject any transaction attempting to reuse a Nullifier

### Requirement 2: Order Commitment Submission

**User Story:** As a trader, I want to submit private orders, so that my trading strategy and intent remain hidden.

#### Acceptance Criteria

1. WHEN a user creates an order, THE Order_Commitment_Layer SHALL encrypt the asset pair, amount, price, order type, and expiration
2. THE Order_Commitment_Layer SHALL generate an Order_Commitment hash from the encrypted payload
3. WHEN submitting an order, THE Order_Commitment_Layer SHALL require a valid Order_Validity_Proof
4. THE Order_Registry SHALL store the Order_Commitment hash and metadata hash onchain
5. THE Order_Commitment_Layer SHALL reject orders without valid proofs
6. WHEN an order expires, THE Order_Registry SHALL mark the Order_Commitment as inactive

### Requirement 3: Zero-Knowledge Order Matching

**User Story:** As a trader, I want my orders matched without revealing order details, so that I can execute trades privately.

#### Acceptance Criteria

1. THE Matching_Engine SHALL identify compatible Order_Commitments without decrypting order values
2. WHEN orders are matched, THE Matching_Engine SHALL generate an Execution_Bundle
3. THE Matching_Engine SHALL include a Matching_Correctness_Proof in each Execution_Bundle
4. THE Matching_Engine SHALL operate without custody of user assets
5. THE Matching_Engine SHALL apply deterministic matching rules
6. WHEN multiple orders match, THE Matching_Engine SHALL prioritize based on timestamp and price-time priority

### Requirement 4: Private Trade Settlement

**User Story:** As a trader, I want trades to settle securely, so that my updated balances remain confidential.

#### Acceptance Criteria

1. WHEN an Execution_Bundle is submitted, THE Settlement_Contract SHALL verify the Trade_Conservation_Proof
2. THE Settlement_Contract SHALL verify that all input Balance_Notes have sufficient funds via Balance_Proofs
3. THE Settlement_Contract SHALL verify that all Order_Commitments are valid and unexpired
4. THE Settlement_Contract SHALL verify that no Nullifiers are reused
5. WHEN settlement succeeds, THE Settlement_Layer SHALL create new encrypted Balance_Notes for both parties
6. THE Settlement_Layer SHALL add new Balance_Notes to the Commitment_Tree
7. THE Settlement_Layer SHALL mark old Nullifiers as spent
8. THE Settlement_Contract SHALL emit a settlement event without revealing trade details

### Requirement 5: Shielded Vault Operations

**User Story:** As a user, I want to deposit and withdraw assets securely, so that I can enter and exit the private trading system.

#### Acceptance Criteria

1. WHEN a user deposits assets, THE Shielded_Vault SHALL accept the asset transfer
2. THE Shielded_Vault SHALL mint an encrypted Balance_Note with the deposited amount
3. THE Shielded_Vault SHALL add the new Balance_Note commitment to the Commitment_Tree
4. WHEN a user requests withdrawal, THE Shielded_Vault SHALL require a valid Balance_Proof demonstrating ownership
5. THE Shielded_Vault SHALL verify the Nullifier has not been used
6. WHEN withdrawal is approved, THE Shielded_Vault SHALL transfer assets to the user's public address
7. THE Shielded_Vault SHALL mark the Nullifier as spent

### Requirement 6: Selective Disclosure and Auditability

**User Story:** As an institutional trader, I want to selectively disclose trading data to auditors, so that I can meet compliance requirements while maintaining privacy.

#### Acceptance Criteria

1. WHEN a user generates a Viewing_Key, THE Phantom_System SHALL create a cryptographic key for specific data access
2. THE Audit_Gateway SHALL store Viewing_Key registrations
3. WHEN a Viewing_Key is presented, THE Audit_Gateway SHALL grant access only to the authorized data scope
4. THE Phantom_System SHALL allow users to generate Viewing_Keys for specific Balance_Notes
5. THE Phantom_System SHALL allow users to generate Viewing_Keys for specific Order_Commitments
6. THE Phantom_System SHALL allow users to revoke Viewing_Keys
7. WHERE a Viewing_Key is active, THE Phantom_System SHALL enable decryption of the associated encrypted data

### Requirement 7: Zero-Knowledge Proof Generation and Verification

**User Story:** As a system operator, I want all proofs to be cryptographically sound, so that the system maintains security and correctness.

#### Acceptance Criteria

1. THE Phantom_System SHALL generate Balance_Proofs demonstrating sufficient funds without revealing amounts
2. THE Phantom_System SHALL generate Order_Validity_Proofs demonstrating order parameters are within allowed ranges
3. THE Phantom_System SHALL generate Trade_Conservation_Proofs demonstrating inputs equal outputs
4. THE Phantom_System SHALL generate Matching_Correctness_Proofs demonstrating matched orders satisfy price rules
5. WHEN a Zero_Knowledge_Proof is submitted, THE Settlement_Contract SHALL verify the proof in under 500 milliseconds
6. THE Phantom_System SHALL reject any transaction with an invalid Zero_Knowledge_Proof
7. THE Phantom_System SHALL use deterministic circuit constraints for all proof generation

### Requirement 8: Commitment Tree Management

**User Story:** As a system operator, I want efficient commitment tree operations, so that the system scales with user activity.

#### Acceptance Criteria

1. THE Private_Balance_Layer SHALL maintain a Merkle Commitment_Tree of all Balance_Notes
2. WHEN a Balance_Note is created, THE Private_Balance_Layer SHALL insert its commitment into the Commitment_Tree
3. THE Private_Balance_Layer SHALL update the Commitment_Tree root after each insertion
4. THE Private_Balance_Layer SHALL provide Merkle proofs for Balance_Note membership
5. THE Private_Balance_Layer SHALL support efficient tree updates for batched settlements
6. THE Commitment_Tree SHALL be publicly verifiable for integrity

### Requirement 9: Replay Attack Prevention

**User Story:** As a user, I want protection against replay attacks, so that my transactions cannot be maliciously resubmitted.

#### Acceptance Criteria

1. THE Phantom_System SHALL include a unique nonce in each Order_Commitment
2. THE Settlement_Contract SHALL track all used Nullifiers
3. WHEN a transaction is submitted, THE Settlement_Contract SHALL verify the Nullifier has not been used previously
4. THE Settlement_Contract SHALL reject transactions with reused Nullifiers
5. THE Phantom_System SHALL include timestamp validation in Order_Validity_Proofs
6. WHEN an order expires, THE Order_Registry SHALL prevent its use in new Execution_Bundles

### Requirement 10: Multi-Asset Support

**User Story:** As a trader, I want to trade multiple asset pairs, so that I can execute diverse trading strategies.

#### Acceptance Criteria

1. THE Private_Balance_Layer SHALL support Balance_Notes for multiple asset types
2. THE Order_Commitment_Layer SHALL encode asset pair information in Order_Commitments
3. THE Matching_Engine SHALL match orders only for identical asset pairs
4. THE Settlement_Layer SHALL verify asset type consistency in Trade_Conservation_Proofs
5. THE Shielded_Vault SHALL support deposits and withdrawals for multiple asset types
6. WHERE an asset is supported, THE Phantom_System SHALL maintain separate Commitment_Trees per asset type

### Requirement 11: Order Expiration and Cancellation

**User Story:** As a trader, I want to set order expiration times and cancel orders, so that I maintain control over my trading activity.

#### Acceptance Criteria

1. WHEN creating an order, THE Order_Commitment_Layer SHALL include an expiration timestamp
2. THE Order_Registry SHALL track expiration timestamps for all Order_Commitments
3. WHEN current time exceeds expiration, THE Matching_Engine SHALL exclude the Order_Commitment from matching
4. WHEN a user requests cancellation, THE Order_Registry SHALL mark the Order_Commitment as cancelled
5. THE Order_Registry SHALL require proof of ownership for order cancellation
6. THE Matching_Engine SHALL exclude cancelled Order_Commitments from matching

### Requirement 12: Performance and Scalability

**User Story:** As a user, I want fast transaction processing, so that I can trade efficiently.

#### Acceptance Criteria

1. WHEN a user submits an order, THE Order_Commitment_Layer SHALL process the submission in under 5 seconds
2. WHEN verifying a proof, THE Settlement_Contract SHALL complete verification in under 500 milliseconds
3. THE Settlement_Layer SHALL support batched settlement of multiple trades
4. THE Commitment_Tree SHALL support efficient updates for batched operations
5. THE Matching_Engine SHALL process matching logic without blocking order submissions
6. THE Phantom_System SHALL handle at least 100 concurrent order submissions

### Requirement 13: System Solvency Verification

**User Story:** As a user, I want to verify system solvency, so that I can trust the platform with my assets.

#### Acceptance Criteria

1. THE Phantom_System SHALL maintain publicly verifiable proof of total deposits
2. THE Phantom_System SHALL maintain publicly verifiable proof of total Balance_Note commitments
3. THE Settlement_Contract SHALL enforce conservation of value in all trades
4. THE Phantom_System SHALL allow anyone to verify that total commitments equal total deposits
5. THE Phantom_System SHALL prevent creation of Balance_Notes without corresponding deposits
6. WHEN settlement occurs, THE Settlement_Contract SHALL verify that sum of input commitments equals sum of output commitments

### Requirement 14: Wallet Integration Support

**User Story:** As a wallet developer, I want clear integration interfaces, so that I can support Phantom Darkpool in my wallet.

#### Acceptance Criteria

1. THE Phantom_System SHALL provide a createPrivateBalance API for wallet integration
2. THE Phantom_System SHALL provide a generateOrderCommitment API for wallet integration
3. THE Phantom_System SHALL provide a generateExecutionWitness API for wallet integration
4. THE Phantom_System SHALL provide a revealForAudit API for wallet integration
5. THE Phantom_System SHALL support local proof generation in wallet environments
6. THE Phantom_System SHALL provide encrypted state storage interfaces for wallets
7. THE Phantom_System SHALL provide Viewing_Key management interfaces for wallets

### Requirement 15: Trading Interface Integration

**User Story:** As a frontend developer, I want to build trading interfaces, so that users can interact with Phantom Darkpool.

#### Acceptance Criteria

1. THE Phantom_System SHALL provide a POST /orders endpoint for order submission
2. THE Phantom_System SHALL provide a GET /order-status endpoint for order tracking
3. THE Phantom_System SHALL provide a POST /withdraw endpoint for withdrawal requests
4. THE Phantom_System SHALL provide a GET /balance-proof endpoint for balance verification
5. THE Phantom_System SHALL provide a query interface for the Commitment_Tree
6. THE Phantom_System SHALL provide proof status information for pending transactions
7. THE Phantom_System SHALL return encrypted order data that only the user can decrypt

### Requirement 16: Liquidity Provider Support

**User Story:** As a liquidity provider, I want to provide hidden liquidity, so that I can market make without exposing my strategy.

#### Acceptance Criteria

1. THE Phantom_System SHALL allow liquidity providers to deposit shielded liquidity
2. THE Phantom_System SHALL support market making orders with hidden depth
3. THE Matching_Engine SHALL match liquidity provider orders without revealing their size
4. THE Settlement_Layer SHALL update liquidity provider Balance_Notes after trades
5. WHERE a liquidity provider operates, THE Phantom_System SHALL maintain confidentiality of their positions
6. THE Phantom_System SHALL allow liquidity providers to withdraw profits privately

### Requirement 17: Security and Key Management

**User Story:** As a user, I want robust security guarantees, so that my assets and data remain protected.

#### Acceptance Criteria

1. THE Phantom_System SHALL operate without a trusted setup ceremony
2. THE Phantom_System SHALL use deterministic circuit constraints for all Zero_Knowledge_Proofs
3. THE Phantom_System SHALL enforce Nullifier uniqueness across all transactions
4. THE Phantom_System SHALL support key rotation for user accounts
5. THE Phantom_System SHALL protect against circuit constraint vulnerabilities through formal verification
6. WHERE cryptographic keys are used, THE Phantom_System SHALL follow industry best practices for key derivation

### Requirement 18: Compliance and Regulatory Features

**User Story:** As an institutional user, I want optional compliance features, so that I can meet regulatory requirements.

#### Acceptance Criteria

1. WHERE compliance is required, THE Audit_Gateway SHALL support identity proof gating
2. WHERE compliance is required, THE Audit_Gateway SHALL support jurisdiction filters
3. THE Audit_Gateway SHALL support Viewing_Key export for regulatory reporting
4. THE Audit_Gateway SHALL provide regulatory reporting hooks
5. WHERE identity verification is enabled, THE Order_Registry SHALL require identity proofs before accepting Order_Commitments
6. THE Phantom_System SHALL allow users to opt into compliance features voluntarily

### Requirement 19: Matching Engine Integration

**User Story:** As a matching engine operator, I want to run matching logic, so that I can facilitate trade execution.

#### Acceptance Criteria

1. THE Matching_Engine SHALL retrieve active Order_Commitments from the Order_Registry
2. THE Matching_Engine SHALL run matching logic on encrypted order metadata
3. THE Matching_Engine SHALL access public commitments without accessing private data
4. WHEN orders match, THE Matching_Engine SHALL generate an Execution_Bundle with settlement proof
5. THE Matching_Engine SHALL operate in a deterministic manner for fairness
6. THE Matching_Engine SHALL support both automated and manual settlement modes

### Requirement 20: Testing and Verification

**User Story:** As a developer, I want comprehensive testing capabilities, so that I can verify system correctness.

#### Acceptance Criteria

1. THE Phantom_System SHALL provide circuit correctness test suites
2. THE Phantom_System SHALL provide trade conservation test suites
3. THE Phantom_System SHALL support double spend simulation for security testing
4. THE Phantom_System SHALL support stress testing of order volume
5. THE Phantom_System SHALL support adversarial matching attempt simulation
6. THE Phantom_System SHALL provide test fixtures for all Zero_Knowledge_Proof types
