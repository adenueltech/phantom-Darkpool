pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

/**
 * Merkle Tree Checker
 * 
 * Verifies that a leaf is part of a Merkle tree with a given root.
 * Uses Poseidon hash for ZK-friendly operations.
 * 
 * Inputs:
 * - leaf: The leaf value to verify
 * - pathElements: Sibling hashes along the path from leaf to root
 * - pathIndices: Binary path (0 = left, 1 = right) for each level
 * 
 * Output:
 * - root: Computed Merkle root
 */

template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    signal output root;
    
    // Hash computations for each level
    component hashers[levels];
    component mux[levels];
    
    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;
    
    for (var i = 0; i < levels; i++) {
        // Determine left and right based on path index
        // If pathIndices[i] == 0, current hash is left child
        // If pathIndices[i] == 1, current hash is right child
        
        mux[i] = MultiMux1(2);
        mux[i].c[0][0] <== levelHashes[i];
        mux[i].c[0][1] <== pathElements[i];
        mux[i].c[1][0] <== pathElements[i];
        mux[i].c[1][1] <== levelHashes[i];
        mux[i].s <== pathIndices[i];
        
        // Hash the pair
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== mux[i].out[0];
        hashers[i].inputs[1] <== mux[i].out[1];
        
        levelHashes[i + 1] <== hashers[i].out;
    }
    
    root <== levelHashes[levels];
}

/**
 * Merkle Tree Inclusion Proof
 * 
 * Simpler version that just verifies inclusion without outputting root.
 * Useful when root is a public input.
 */

template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    component checker = MerkleTreeChecker(levels);
    checker.leaf <== leaf;
    for (var i = 0; i < levels; i++) {
        checker.pathElements[i] <== pathElements[i];
        checker.pathIndices[i] <== pathIndices[i];
    }
    
    // Verify computed root matches expected root
    root === checker.root;
}
