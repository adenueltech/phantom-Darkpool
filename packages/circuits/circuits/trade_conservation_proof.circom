pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "./pedersen.circom";

/**
 * Trade Conservation Proof Circuit
 * 
 * Proves that trade inputs equal outputs (no value created/destroyed).
 * Verifies conservation of value per asset type.
 * 
 * Public Inputs:
 * - executionId: Unique execution identifier
 * - inputNullifiers[numInputs]: Nullifiers of spent balance notes
 * - outputCommitments[numOutputs]: Commitments of new balance notes
 * 
 * Private Inputs:
 * - Input notes (for each input):
 *   - inputAssets[]: Asset types
 *   - inputAmounts[]: Amounts
 *   - inputSalts[]: Salts
 *   - inputOwners[]: Owners
 *   - inputNullifierSecrets[]: Secrets for nullifier generation
 * 
 * - Output notes (for each output):
 *   - outputAssets[]: Asset types
 *   - outputAmounts[]: Amounts
 *   - outputSalts[]: Salts
 *   - outputOwners[]: Owners
 * 
 * Constraints:
 * 1. Verify input nullifiers match computed values
 * 2. Verify output commitments match computed values
 * 3. Verify sum of inputs equals sum of outputs per asset
 * 
 * Requirements: 4.1, 7.3, 13.3
 */

template TradeConservationProof(numInputs, numOutputs, maxAssets) {
    // Public inputs
    signal input executionId;
    signal input inputNullifiers[numInputs];
    signal input outputCommitments[numOutputs];
    
    // Private inputs - Input notes
    signal input inputAssets[numInputs];
    signal input inputAmounts[numInputs];
    signal input inputSalts[numInputs];
    signal input inputOwners[numInputs];
    signal input inputNullifierSecrets[numInputs];
    
    // Private inputs - Output notes
    signal input outputAssets[numOutputs];
    signal input outputAmounts[numOutputs];
    signal input outputSalts[numOutputs];
    signal input outputOwners[numOutputs];
    
    // Constraint 1: Verify input nullifiers
    component inputCommitments[numInputs];
    component inputNullifierHashers[numInputs];
    
    for (var i = 0; i < numInputs; i++) {
        // Compute commitment for input note
        inputCommitments[i] = PedersenCommitment();
        inputCommitments[i].asset <== inputAssets[i];
        inputCommitments[i].amount <== inputAmounts[i];
        inputCommitments[i].salt <== inputSalts[i];
        inputCommitments[i].owner <== inputOwners[i];
        
        // Compute nullifier from commitment and secret
        inputNullifierHashers[i] = Poseidon(2);
        inputNullifierHashers[i].inputs[0] <== inputCommitments[i].out;
        inputNullifierHashers[i].inputs[1] <== inputNullifierSecrets[i];
        
        // Verify nullifier matches public input
        inputNullifiers[i] === inputNullifierHashers[i].out;
    }
    
    // Constraint 2: Verify output commitments
    component outputCommitmentHashers[numOutputs];
    
    for (var i = 0; i < numOutputs; i++) {
        // Compute commitment for output note
        outputCommitmentHashers[i] = PedersenCommitment();
        outputCommitmentHashers[i].asset <== outputAssets[i];
        outputCommitmentHashers[i].amount <== outputAmounts[i];
        outputCommitmentHashers[i].salt <== outputSalts[i];
        outputCommitmentHashers[i].owner <== outputOwners[i];
        
        // Verify commitment matches public input
        outputCommitments[i] === outputCommitmentHashers[i].out;
    }
    
    // Constraint 3: Verify conservation per asset
    // For simplicity, we'll verify conservation for up to maxAssets different assets
    // In practice, most trades involve 2 assets (e.g., ETH/USDC)
    
    signal inputSums[maxAssets];
    signal outputSums[maxAssets];
    
    // Initialize sums to zero
    for (var a = 0; a < maxAssets; a++) {
        inputSums[a] <== 0;
        outputSums[a] <== 0;
    }
    
    // Accumulate input amounts per asset
    // Note: This is a simplified version. Production implementation would need
    // more sophisticated asset tracking with dynamic asset identification.
    
    // For a 2-asset trade (most common case):
    // Asset 0: Base asset (e.g., ETH)
    // Asset 1: Quote asset (e.g., USDC)
    
    // Verify that for each asset type:
    // sum(inputAmounts where inputAsset == assetType) == sum(outputAmounts where outputAsset == assetType)
    
    // Simplified constraint for 2-input, 2-output case:
    // This assumes inputs and outputs are ordered by asset type
    // Input 0 and Output 1 are same asset (buyer's perspective)
    // Input 1 and Output 0 are same asset (seller's perspective)
    
    // For production, use a more general asset matching algorithm
    
    // Verify asset conservation (simplified for 2x2 case)
    if (numInputs == 2 && numOutputs == 2) {
        // Buyer gives asset A, receives asset B
        // Seller gives asset B, receives asset A
        
        // Input 0 asset should match Output 1 asset
        inputAssets[0] === outputAssets[1];
        // Input 0 amount should match Output 1 amount
        inputAmounts[0] === outputAmounts[1];
        
        // Input 1 asset should match Output 0 asset
        inputAssets[1] === outputAssets[0];
        // Input 1 amount should match Output 0 amount
        inputAmounts[1] === outputAmounts[0];
    }
}

// Main component for 2-input, 2-output trades (most common case)
component main {public [executionId, inputNullifiers, outputCommitments]} = TradeConservationProof(2, 2, 2);
