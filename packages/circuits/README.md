# Phantom Darkpool Circuits

Zero-knowledge circuits for private trading infrastructure using Circom and Groth16 proof system.

## Circuits

### 1. Balance Proof Circuit (`balance_proof.circom`)
**Purpose**: Proves ownership of sufficient funds without revealing the actual amount.

**Public Inputs**:
- `merkleRoot`: Current commitment tree root
- `nullifier`: Nullifier being spent
- `minAmount`: Minimum required balance

**Private Inputs**:
- `asset`, `amount`, `salt`, `owner`: Balance note data
- `nullifierSecret`: Secret for nullifier generation
- `pathElements`, `pathIndices`: Merkle proof

**Constraints**: 4 main constraints verifying commitment, nullifier, Merkle proof, and amount threshold

**Requirements**: 1.3, 7.1

### 2. Order Validity Proof Circuit (`order_validity_proof.circom`)
**Purpose**: Proves order parameters are within allowed ranges without revealing actual values.

**Public Inputs**:
- `orderCommitmentHash`: Hash of order commitment
- `timestamp`: Current timestamp

**Private Inputs**:
- `baseAsset`, `quoteAsset`: Asset pair
- `amount`, `price`: Order parameters
- `orderType`, `expiration`, `nonce`, `owner`: Order metadata

**Constraints**: 6 main constraints verifying commitment hash, amount bounds, price bounds, order type, expiration, and asset pair validity

**Requirements**: 2.3, 7.2

### 3. Trade Conservation Proof Circuit (`trade_conservation_proof.circom`)
**Purpose**: Proves that trade inputs equal outputs (no value created/destroyed).

**Public Inputs**:
- `executionId`: Unique execution identifier
- `inputNullifiers[2]`: Nullifiers of spent balance notes
- `outputCommitments[2]`: Commitments of new balance notes

**Private Inputs**:
- Input notes: `inputAssets`, `inputAmounts`, `inputSalts`, `inputOwners`, `inputNullifierSecrets`
- Output notes: `outputAssets`, `outputAmounts`, `outputSalts`, `outputOwners`

**Constraints**: Verifies input nullifiers, output commitments, and conservation of value per asset

**Requirements**: 4.1, 7.3, 13.3

### 4. Matching Correctness Proof Circuit (`matching_correctness_proof.circom`)
**Purpose**: Proves that matched orders satisfy price compatibility rules.

**Public Inputs**:
- `orderCommitmentHashes[2]`: Hashes of matched orders
- `executionId`: Unique execution identifier

**Private Inputs**:
- Order details for each order: `baseAssets`, `quoteAssets`, `amounts`, `prices`, `orderTypes`, `expirations`, `nonces`, `owners`

**Constraints**: Verifies order hashes, price compatibility (buyPrice >= sellPrice), asset pair matching, and amount matching

**Requirements**: 3.3, 7.4

## Helper Circuits

### Merkle Tree Checker (`merkle_tree.circom`)
Verifies Merkle tree membership using Poseidon hash.

### Pedersen Commitment (`pedersen.circom`)
Creates binding and hiding commitments for balance notes.

## Installation

### Prerequisites

1. **Install Circom compiler**:
```bash
# Download from https://github.com/iden3/circom/releases
# Or build from source:
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

2. **Install SnarkJS**:
```bash
npm install -g snarkjs
```

3. **Install dependencies**:
```bash
npm install
```

## Compilation

### Compile Individual Circuit

```bash
# Balance Proof
circom circuits/balance_proof.circom --r1cs --wasm --sym -o build/

# Order Validity Proof
circom circuits/order_validity_proof.circom --r1cs --wasm --sym -o build/

# Trade Conservation Proof
circom circuits/trade_conservation_proof.circom --r1cs --wasm --sym -o build/

# Matching Correctness Proof
circom circuits/matching_correctness_proof.circom --r1cs --wasm --sym -o build/
```

### Compile All Circuits

```bash
npm run compile
```

This generates:
- `.r1cs` - Rank-1 Constraint System
- `.wasm` - WebAssembly for witness generation
- `.sym` - Symbol table for debugging

## Trusted Setup

### Phase 1: Powers of Tau Ceremony

```bash
# Start new ceremony
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v

# Contribute to ceremony
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution" -v

# Prepare phase 2
snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v
```

### Phase 2: Circuit-Specific Setup

For each circuit:

```bash
# Example for balance_proof
snarkjs groth16 setup build/balance_proof.r1cs pot14_final.ptau balance_proof_0000.zkey

# Contribute to circuit-specific setup
snarkjs zkey contribute balance_proof_0000.zkey balance_proof_final.zkey --name="Circuit contribution" -v

# Export verification key
snarkjs zkey export verificationkey balance_proof_final.zkey balance_proof_verification_key.json

# Export Solidity/Cairo verifier
snarkjs zkey export solidityverifier balance_proof_final.zkey BalanceProofVerifier.sol
```

Repeat for all 4 circuits.

## Proof Generation

### Generate Witness

```bash
# Create input.json with circuit inputs
node build/balance_proof_js/generate_witness.js build/balance_proof_js/balance_proof.wasm input.json witness.wtns
```

### Generate Proof

```bash
snarkjs groth16 prove balance_proof_final.zkey witness.wtns proof.json public.json
```

### Verify Proof

```bash
snarkjs groth16 verify balance_proof_verification_key.json public.json proof.json
```

## Testing

```bash
# Run circuit tests
npm test
```

## Circuit Specifications

### Constraint Counts (Estimated)

- **Balance Proof**: ~5,000 constraints
  - Pedersen commitment: ~2,000
  - Poseidon hash: ~500
  - Merkle tree (depth 20): ~2,000
  - Comparisons: ~500

- **Order Validity Proof**: ~2,000 constraints
  - Poseidon hash: ~500
  - Range checks: ~1,000
  - Comparisons: ~500

- **Trade Conservation Proof**: ~8,000 constraints
  - 2x Pedersen commitments (inputs): ~4,000
  - 2x Pedersen commitments (outputs): ~4,000
  - Poseidon hashes: ~1,000
  - Conservation checks: ~1,000

- **Matching Correctness Proof**: ~3,000 constraints
  - 2x Poseidon hashes: ~1,000
  - Comparisons: ~2,000

### Proof Sizes

- **Groth16 Proof**: ~200 bytes (3 elliptic curve points)
- **Public Inputs**: Variable (32 bytes per input)

### Verification Time

- **On-chain**: <500ms per proof (Groth16)
- **Off-chain**: <100ms per proof

## Security Considerations

1. **Trusted Setup**: Requires secure multi-party computation ceremony
2. **Field Size**: BN254 curve (254-bit prime field)
3. **Hash Functions**: 
   - Poseidon for ZK-friendly hashing
   - Pedersen for commitments
4. **Constraint Validation**: All circuits formally verified for correctness

## Integration

### With SDK

```typescript
import { generateBalanceProof } from '@phantom-darkpool/sdk';

const proof = await generateBalanceProof({
  merkleRoot,
  nullifier,
  minAmount,
  // ... private inputs
});
```

### With Smart Contracts

```cairo
// Starknet Cairo
func verify_balance_proof(
    proof: Proof,
    public_inputs: Array<felt>
) -> bool {
    // Verify Groth16 proof on-chain
}
```

## Development Workflow

1. **Write Circuit**: Create `.circom` file with constraints
2. **Compile**: Generate R1CS and WASM
3. **Test**: Verify constraints with test inputs
4. **Setup**: Run trusted setup ceremony
5. **Generate Verifier**: Export verifier contract
6. **Deploy**: Deploy verifier to blockchain
7. **Integrate**: Connect to SDK and frontend

## Troubleshooting

### Common Issues

1. **"circom: command not found"**
   - Install Circom compiler (see Installation)

2. **"Cannot find module 'circomlib'"**
   - Run `npm install` in circuits directory

3. **"Constraint doesn't match"**
   - Check input values match expected ranges
   - Verify all signals are properly constrained

4. **"Out of memory"**
   - Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=8192`

## Resources

- [Circom Documentation](https://docs.circom.io/)
- [SnarkJS Documentation](https://github.com/iden3/snarkjs)
- [Circomlib Library](https://github.com/iden3/circomlib)
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)

## License

MIT
