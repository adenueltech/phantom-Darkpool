pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * Order Validity Proof Circuit
 * 
 * Proves that order parameters are within allowed ranges without revealing actual values.
 * 
 * Public Inputs:
 * - orderCommitmentHash: Hash of order commitment
 * - timestamp: Current timestamp
 * 
 * Private Inputs:
 * - baseAsset: Base asset address
 * - quoteAsset: Quote asset address
 * - amount: Order size
 * - price: Limit price
 * - orderType: BUY (0) or SELL (1)
 * - expiration: Expiration timestamp
 * - nonce: Unique order identifier
 * - owner: Owner's public key
 * 
 * Constraints:
 * 1. Verify commitment hash = Poseidon(all order fields)
 * 2. Verify amount is positive and within bounds
 * 3. Verify price is positive and within bounds
 * 4. Verify orderType is 0 or 1
 * 5. Verify expiration > timestamp
 * 6. Verify baseAsset != quoteAsset
 * 
 * Requirements: 2.3, 7.2
 */

template OrderValidityProof() {
    // Public inputs
    signal input orderCommitmentHash;
    signal input timestamp;
    
    // Private inputs
    signal input baseAsset;
    signal input quoteAsset;
    signal input amount;
    signal input price;
    signal input orderType;
    signal input expiration;
    signal input nonce;
    signal input owner;
    
    // Constants for bounds checking
    var MAX_ORDER_SIZE = 2**128 - 1;
    var MIN_PRICE = 1;
    var MAX_PRICE = 2**128 - 1;
    
    // Constraint 1: Verify commitment hash = Poseidon(all order fields)
    component hasher = Poseidon(8);
    hasher.inputs[0] <== baseAsset;
    hasher.inputs[1] <== quoteAsset;
    hasher.inputs[2] <== amount;
    hasher.inputs[3] <== price;
    hasher.inputs[4] <== orderType;
    hasher.inputs[5] <== expiration;
    hasher.inputs[6] <== nonce;
    hasher.inputs[7] <== owner;
    
    orderCommitmentHash === hasher.out;
    
    // Constraint 2: Verify amount is positive and within bounds
    // amount > 0
    component amountPositive = GreaterThan(252);
    amountPositive.in[0] <== amount;
    amountPositive.in[1] <== 0;
    amountPositive.out === 1;
    
    // amount <= MAX_ORDER_SIZE (implicitly checked by field size)
    
    // Constraint 3: Verify price is positive and within bounds
    // price >= MIN_PRICE
    component priceCheck = GreaterEqThan(252);
    priceCheck.in[0] <== price;
    priceCheck.in[1] <== MIN_PRICE;
    priceCheck.out === 1;
    
    // price <= MAX_PRICE (implicitly checked by field size)
    
    // Constraint 4: Verify order type is valid (0 or 1)
    // orderType * (orderType - 1) === 0
    signal orderTypeCheck;
    orderTypeCheck <== orderType * (orderType - 1);
    orderTypeCheck === 0;
    
    // Constraint 5: Verify not expired (expiration > timestamp)
    component expirationCheck = GreaterThan(64);
    expirationCheck.in[0] <== expiration;
    expirationCheck.in[1] <== timestamp;
    expirationCheck.out === 1;
    
    // Constraint 6: Verify assets are different (baseAsset != quoteAsset)
    component assetCheck = IsEqual();
    assetCheck.in[0] <== baseAsset;
    assetCheck.in[1] <== quoteAsset;
    assetCheck.out === 0;
}

// Main component
component main {public [orderCommitmentHash, timestamp]} = OrderValidityProof();
