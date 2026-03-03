pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkle_tree.circom";
include "./pedersen.circom";

/**
 * Balance Proof Circuit
 * 
 * Proves ownership of sufficient funds without revealing the actual amount.
 * 
 * Public Inputs:
 * - merkleRoot: Current commitment tree root
 * - nullifier: Nullifier being spent
 * - minAmount: Minimum required balance
 * 
 * Private Inputs:
 * - asset: Asset address
 * - amount: Actual balance
 * - salt: Blinding factor
 * - owner: Owner's public key
 * - nullifierSecret: Secret for nullifier generation
 * - merkleProof: Proof of commitment membership (pathElements and pathIndices)
 * 
 * Constraints:
 * 1. Verify Pedersen commitment
 * 2. Verify nullifier = Poseidon(commitment, nullifierSecret)
 * 3. Verify Merkle proof against root
 * 4. Verify amount >= minAmount
 * 
 * Requirements: 1.3, 7.1
 */

template BalanceProof(levels) {
    // Public inputs
    signal input merkleRoot;
    signal input nullifier;
    signal input minAmount;
    
    // Private inputs
    signal input asset;
    signal input amount;
    signal input salt;
    signal input owner;
    signal input nullifierSecret;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    // Intermediate signals
    signal commitment;
    signal computedNullifier;
    
    // Constraint 1: Verify Pedersen commitment
    // commitment = PedersenCommit(asset, amount, salt, owner)
    component pedersenCommit = PedersenCommitment();
    pedersenCommit.asset <== asset;
    pedersenCommit.amount <== amount;
    pedersenCommit.salt <== salt;
    pedersenCommit.owner <== owner;
    commitment <== pedersenCommit.out;
    
    // Constraint 2: Verify nullifier = Poseidon(commitment, nullifierSecret)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== commitment;
    nullifierHasher.inputs[1] <== nullifierSecret;
    computedNullifier <== nullifierHasher.out;
    
    // Ensure computed nullifier matches public input
    nullifier === computedNullifier;
    
    // Constraint 3: Verify Merkle proof against root
    component merkleVerifier = MerkleTreeChecker(levels);
    merkleVerifier.leaf <== commitment;
    for (var i = 0; i < levels; i++) {
        merkleVerifier.pathElements[i] <== pathElements[i];
        merkleVerifier.pathIndices[i] <== pathIndices[i];
    }
    
    // Ensure computed root matches public input
    merkleRoot === merkleVerifier.root;
    
    // Constraint 4: Verify amount >= minAmount
    component amountCheck = GreaterEqThan(252);
    amountCheck.in[0] <== amount;
    amountCheck.in[1] <== minAmount;
    amountCheck.out === 1;
}

// Main component with tree depth of 20
component main {public [merkleRoot, nullifier, minAmount]} = BalanceProof(20);
