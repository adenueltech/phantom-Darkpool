pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/pedersen.circom";

/**
 * Pedersen Commitment for Balance Notes
 * 
 * Creates a binding and hiding commitment for balance note data.
 * 
 * Inputs:
 * - asset: Asset address
 * - amount: Balance amount
 * - salt: Random blinding factor
 * - owner: Owner's public key
 * 
 * Output:
 * - out: Pedersen commitment
 * 
 * Properties:
 * - Binding: Cannot change values without changing commitment
 * - Hiding: Commitment reveals nothing about underlying values
 */

template PedersenCommitment() {
    signal input asset;
    signal input amount;
    signal input salt;
    signal input owner;
    
    signal output out;
    
    // Use Pedersen hash from circomlib
    // We hash all 4 components together
    component hasher = Pedersen(1016); // 4 fields * 254 bits = 1016 bits
    
    // Convert inputs to bits for Pedersen hash
    component assetBits = Num2Bits(254);
    component amountBits = Num2Bits(254);
    component saltBits = Num2Bits(254);
    component ownerBits = Num2Bits(254);
    
    assetBits.in <== asset;
    amountBits.in <== amount;
    saltBits.in <== salt;
    ownerBits.in <== owner;
    
    // Concatenate all bits
    for (var i = 0; i < 254; i++) {
        hasher.in[i] <== assetBits.out[i];
        hasher.in[254 + i] <== amountBits.out[i];
        hasher.in[508 + i] <== saltBits.out[i];
        hasher.in[762 + i] <== ownerBits.out[i];
    }
    
    // Output the x-coordinate of the Pedersen hash point
    out <== hasher.out[0];
}

/**
 * Num2Bits
 * Converts a number to its binary representation
 */
template Num2Bits(n) {
    signal input in;
    signal output out[n];
    
    var lc1 = 0;
    var e2 = 1;
    
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    
    lc1 === in;
}
