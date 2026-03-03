pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * Matching Correctness Proof Circuit
 * 
 * Proves that matched orders satisfy price compatibility rules.
 * Verifies that buy price >= sell price and asset pairs match.
 * 
 * Public Inputs:
 * - orderCommitmentHashes[numOrders]: Hashes of matched orders
 * - executionId: Unique execution identifier
 * 
 * Private Inputs (for each order):
 * - baseAssets[]: Base asset addresses
 * - quoteAssets[]: Quote asset addresses
 * - amounts[]: Order sizes
 * - prices[]: Limit prices
 * - orderTypes[]: BUY (0) or SELL (1)
 * - expirations[]: Expiration timestamps
 * - nonces[]: Unique order identifiers
 * - owners[]: Owners' public keys
 * 
 * Constraints:
 * 1. Verify order commitment hashes
 * 2. Verify price compatibility for matched pairs (buyPrice >= sellPrice)
 * 3. Verify asset pairs match
 * 4. Verify amounts match
 * 
 * Requirements: 3.3, 7.4
 */

template MatchingCorrectnessProof(numOrders) {
    // Public inputs
    signal input orderCommitmentHashes[numOrders];
    signal input executionId;
    
    // Private inputs - Order details
    signal input baseAssets[numOrders];
    signal input quoteAssets[numOrders];
    signal input amounts[numOrders];
    signal input prices[numOrders];
    signal input orderTypes[numOrders];
    signal input expirations[numOrders];
    signal input nonces[numOrders];
    signal input owners[numOrders];
    
    // Constraint 1: Verify order commitment hashes
    component hashers[numOrders];
    
    for (var i = 0; i < numOrders; i++) {
        hashers[i] = Poseidon(8);
        hashers[i].inputs[0] <== baseAssets[i];
        hashers[i].inputs[1] <== quoteAssets[i];
        hashers[i].inputs[2] <== amounts[i];
        hashers[i].inputs[3] <== prices[i];
        hashers[i].inputs[4] <== orderTypes[i];
        hashers[i].inputs[5] <== expirations[i];
        hashers[i].inputs[6] <== nonces[i];
        hashers[i].inputs[7] <== owners[i];
        
        orderCommitmentHashes[i] === hashers[i].out;
    }
    
    // Constraint 2, 3, 4: Verify matching rules for pairs
    // Assuming orders come in pairs: (buy, sell), (buy, sell), ...
    // For each pair (i, i+1) where i is even:
    
    for (var i = 0; i < numOrders; i += 2) {
        var buyIdx = i;
        var sellIdx = i + 1;
        
        // Verify one is BUY (0) and other is SELL (1)
        orderTypes[buyIdx] === 0;
        orderTypes[sellIdx] === 1;
        
        // Verify asset pairs match
        // Buy order: wants to buy baseAsset with quoteAsset
        // Sell order: wants to sell baseAsset for quoteAsset
        baseAssets[buyIdx] === baseAssets[sellIdx];
        quoteAssets[buyIdx] === quoteAssets[sellIdx];
        
        // Verify price compatibility: buyPrice >= sellPrice
        component priceCheck = GreaterEqThan(252);
        priceCheck.in[0] <== prices[buyIdx];
        priceCheck.in[1] <== prices[sellIdx];
        priceCheck.out === 1;
        
        // Verify amounts match
        amounts[buyIdx] === amounts[sellIdx];
    }
}

// Main component for 2 orders (1 buy, 1 sell)
component main {public [orderCommitmentHashes, executionId]} = MatchingCorrectnessProof(2);
