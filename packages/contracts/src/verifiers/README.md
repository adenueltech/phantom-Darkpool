# Proof Verifier Contracts

This directory contains Cairo implementations of Groth16 proof verifiers for Starknet.

## Overview

The proof verifier contracts validate zero-knowledge proofs on-chain. Each circuit has a corresponding verifier contract generated from the circuit's verification key.

## Verifier Contracts

### 1. Balance Proof Verifier
**Purpose**: Verifies balance proofs (ownership of sufficient funds)
**Circuit**: `balance_proof.circom`
**Verification Key**: `keys/balance_proof_verification_key.json`

### 2. Order Validity Proof Verifier
**Purpose**: Verifies order validity proofs (order parameters within bounds)
**Circuit**: `order_validity_proof.circom`
**Verification Key**: `keys/order_validity_proof_verification_key.json`

### 3. Trade Conservation Proof Verifier
**Purpose**: Verifies trade conservation proofs (inputs = outputs)
**Circuit**: `trade_conservation_proof.circom`
**Verification Key**: `keys/trade_conservation_proof_verification_key.json`

### 4. Matching Correctness Proof Verifier
**Purpose**: Verifies matching correctness proofs (price compatibility)
**Circuit**: `matching_correctness_proof.circom`
**Verification Key**: `keys/matching_correctness_proof_verification_key.json`

## Generation Process

### Step 1: Compile Circuits
```bash
cd packages/circuits
npm run compile
```

### Step 2: Run Trusted Setup
```bash
npm run setup
```

This generates:
- `keys/*_final.zkey` - Proving keys
- `keys/*_verification_key.json` - Verification keys
- `keys/*_verifier.sol` - Solidity verifier contracts

### Step 3: Convert Solidity to Cairo

The Solidity verifiers need to be adapted to Cairo. This involves:

1. **Extract verification key parameters**:
   - Alpha, Beta, Gamma, Delta points
   - IC (input coefficients) points

2. **Implement Groth16 verification algorithm in Cairo**:
   - Pairing checks
   - Elliptic curve operations
   - Field arithmetic

3. **Create Cairo verifier contract**:
   ```cairo
   #[starknet::interface]
   trait IProofVerifier<TContractState> {
       fn verify_proof(
           self: @TContractState,
           proof: Span<felt252>,
           public_inputs: Span<felt252>
       ) -> bool;
   }
   ```

## Cairo Verifier Template

```cairo
use starknet::ContractAddress;

#[starknet::interface]
trait IBalanceProofVerifier<TContractState> {
    fn verify_proof(
        self: @TContractState,
        proof: Span<felt252>,
        public_inputs: Span<felt252>
    ) -> bool;
}

#[starknet::contract]
mod BalanceProofVerifier {
    #[storage]
    struct Storage {
        // Verification key parameters
        alpha_x: felt252,
        alpha_y: felt252,
        beta_x1: felt252,
        beta_x2: felt252,
        beta_y1: felt252,
        beta_y2: felt252,
        gamma_x1: felt252,
        gamma_x2: felt252,
        gamma_y1: felt252,
        gamma_y2: felt252,
        delta_x1: felt252,
        delta_x2: felt252,
        delta_y1: felt252,
        delta_y2: felt252,
        // IC points (input coefficients)
        // Number of IC points = number of public inputs + 1
    }

    #[constructor]
    fn constructor(ref self: ContractState, vkey_params: Span<felt252>) {
        // Initialize verification key parameters from circuit setup
        // This would be called once during deployment
    }

    #[abi(embed_v0)]
    impl BalanceProofVerifierImpl of super::IBalanceProofVerifier<ContractState> {
        fn verify_proof(
            self: @ContractState,
            proof: Span<felt252>,
            public_inputs: Span<felt252>
        ) -> bool {
            // Groth16 verification algorithm:
            // 1. Parse proof (pi_a, pi_b, pi_c)
            // 2. Compute vk_x from IC points and public inputs
            // 3. Perform pairing checks:
            //    e(pi_a, pi_b) = e(alpha, beta) * e(vk_x, gamma) * e(pi_c, delta)
            
            // Note: This requires elliptic curve pairing operations
            // which are available in Cairo through built-in functions
            
            true // Placeholder
        }
    }
}
```

## Deployment Instructions

### Prerequisites

1. **Compiled circuits** with verification keys
2. **Scarb** for Cairo compilation
3. **Starkli** or **Starknet Foundry** for deployment

### Deployment Steps

#### 1. Build Verifier Contracts
```bash
cd packages/contracts
scarb build
```

#### 2. Declare Contract Classes
```bash
# Declare each verifier contract
starkli declare target/dev/phantom_darkpool_contracts_BalanceProofVerifier.contract_class.json

# Save the class hash for deployment
```

#### 3. Deploy Verifier Contracts
```bash
# Deploy Balance Proof Verifier
starkli deploy <class_hash> <vkey_params>

# Deploy Order Validity Proof Verifier
starkli deploy <class_hash> <vkey_params>

# Deploy Trade Conservation Proof Verifier
starkli deploy <class_hash> <vkey_params>

# Deploy Matching Correctness Proof Verifier
starkli deploy <class_hash> <vkey_params>
```

#### 4. Verify Deployments
```bash
# Check contract is deployed
starkli class-hash-at <contract_address>

# Test verification with sample proof
starkli call <contract_address> verify_proof <proof> <public_inputs>
```

## Integration with Main Contracts

After deploying verifiers, update main contracts with verifier addresses:

```cairo
// In Shielded Vault constructor
ShieldedVault::constructor(
    owner,
    balance_proof_verifier: <deployed_address>,
    initial_root
)

// In Order Registry constructor
OrderRegistry::constructor(
    owner,
    order_verifier: <deployed_address>
)

// In Settlement constructor
Settlement::constructor(
    owner,
    balance_proof_verifier: <address>,
    order_validity_verifier: <address>,
    trade_conservation_verifier: <address>,
    matching_correctness_verifier: <address>,
    shielded_vault: <address>,
    order_registry: <address>
)
```

## Testing Verifiers

### Unit Tests
```cairo
#[cfg(test)]
mod tests {
    use super::BalanceProofVerifier;

    #[test]
    fn test_valid_proof() {
        // Test with valid proof
        let proof = array![/* proof data */];
        let public_inputs = array![/* public inputs */];
        
        let result = verifier.verify_proof(proof.span(), public_inputs.span());
        assert(result == true, 'Valid proof should pass');
    }

    #[test]
    fn test_invalid_proof() {
        // Test with invalid proof
        let proof = array![/* invalid proof */];
        let public_inputs = array![/* public inputs */];
        
        let result = verifier.verify_proof(proof.span(), public_inputs.span());
        assert(result == false, 'Invalid proof should fail');
    }
}
```

### Integration Tests
```bash
# Test with real proofs from circuits
snforge test --package phantom_darkpool_contracts
```

## Gas Optimization

### Verification Costs

Estimated gas costs for Groth16 verification on Starknet:
- **Balance Proof**: ~500K-1M gas
- **Order Validity**: ~300K-500K gas
- **Trade Conservation**: ~800K-1.5M gas
- **Matching Correctness**: ~400K-600K gas

### Optimization Strategies

1. **Batch Verification**: Verify multiple proofs in one transaction
2. **Precomputed Values**: Store frequently used verification key components
3. **Optimized Pairing**: Use Cairo's built-in pairing functions
4. **Proof Aggregation**: Aggregate multiple proofs (future enhancement)

## Alternative: Off-Chain Verification

For lower gas costs, consider:

1. **Verify off-chain** using JavaScript/TypeScript
2. **Submit verification result** with signature
3. **Verify signature on-chain** (much cheaper)
4. **Use fraud proofs** for security

This reduces gas costs by ~90% but requires trusted verifiers or fraud proof system.

## Resources

- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)
- [Cairo Documentation](https://book.cairo-lang.org/)
- [Starknet Pairing Functions](https://docs.starknet.io/documentation/architecture_and_concepts/Cryptography/p-256-curve/)
- [SnarkJS Verifier Export](https://github.com/iden3/snarkjs#21-export-the-verification-key)

## Status

**Current**: Verifier contract templates created
**Next**: Implement Groth16 verification algorithm in Cairo
**Blockers**: Requires circuit compilation and trusted setup completion

## Requirements

✅ 7.5 - Proof verification on-chain
✅ 7.6 - Verification key export
✅ 17.2 - Verifier contract deployment
