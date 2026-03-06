/**
 * Circuit Constraint Validator
 * 
 * Validates circuit constraints before proof generation:
 * - Input range validation
 * - Constraint satisfaction checking
 * - Circuit parameter validation
 * - Formal verification support
 * 
 * Requirements: 17.5
 */

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Circuit input constraints
 */
export interface CircuitConstraints {
  minAmount?: bigint;
  maxAmount?: bigint;
  minPrice?: bigint;
  maxPrice?: bigint;
  maxTreeDepth?: number;
  requiredFields?: string[];
}

/**
 * Circuit Constraint Validator
 * Validates inputs before proof generation
 */
export class CircuitValidator {
  /**
   * Validate balance proof inputs
   */
  validateBalanceProofInputs(inputs: {
    asset: string;
    amount: bigint;
    salt: bigint;
    owner: string;
    nullifierSecret: bigint;
    merkleProof: bigint[];
    minAmount: bigint;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate asset address
    if (!inputs.asset || inputs.asset.length === 0) {
      errors.push('Asset address is required');
    }

    // Validate amount
    if (inputs.amount < 0n) {
      errors.push('Amount cannot be negative');
    }

    if (inputs.amount === 0n) {
      warnings.push('Amount is zero');
    }

    // Validate minAmount constraint
    if (inputs.amount < inputs.minAmount) {
      errors.push(`Amount ${inputs.amount} is less than minimum ${inputs.minAmount}`);
    }

    // Validate salt
    if (inputs.salt === 0n) {
      errors.push('Salt cannot be zero (security risk)');
    }

    // Validate owner
    if (!inputs.owner || inputs.owner.length === 0) {
      errors.push('Owner address is required');
    }

    // Validate nullifier secret
    if (inputs.nullifierSecret === 0n) {
      errors.push('Nullifier secret cannot be zero');
    }

    // Validate Merkle proof
    if (!inputs.merkleProof || inputs.merkleProof.length === 0) {
      errors.push('Merkle proof is required');
    }

    const maxTreeDepth = 20;
    if (inputs.merkleProof.length > maxTreeDepth) {
      errors.push(`Merkle proof depth ${inputs.merkleProof.length} exceeds maximum ${maxTreeDepth}`);
    }

    // Check for zero siblings (potential issue)
    const zeroSiblings = inputs.merkleProof.filter(s => s === 0n).length;
    if (zeroSiblings > 0) {
      warnings.push(`Merkle proof contains ${zeroSiblings} zero siblings`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate order validity proof inputs
   */
  validateOrderValidityProofInputs(inputs: {
    baseAsset: string;
    quoteAsset: string;
    amount: bigint;
    price: bigint;
    orderType: 'BUY' | 'SELL';
    expiration: number;
    nonce: bigint;
    owner: string;
    timestamp: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate assets
    if (!inputs.baseAsset || inputs.baseAsset.length === 0) {
      errors.push('Base asset is required');
    }

    if (!inputs.quoteAsset || inputs.quoteAsset.length === 0) {
      errors.push('Quote asset is required');
    }

    if (inputs.baseAsset === inputs.quoteAsset) {
      errors.push('Base and quote assets must be different');
    }

    // Validate amount
    const MIN_ORDER_AMOUNT = 1n;
    const MAX_ORDER_AMOUNT = BigInt('1000000000000000000000000'); // 1M tokens

    if (inputs.amount < MIN_ORDER_AMOUNT) {
      errors.push(`Amount ${inputs.amount} is below minimum ${MIN_ORDER_AMOUNT}`);
    }

    if (inputs.amount > MAX_ORDER_AMOUNT) {
      errors.push(`Amount ${inputs.amount} exceeds maximum ${MAX_ORDER_AMOUNT}`);
    }

    // Validate price
    const MIN_PRICE = 1n;
    const MAX_PRICE = BigInt('1000000000000000000000000'); // 1M (scaled)

    if (inputs.price < MIN_PRICE) {
      errors.push(`Price ${inputs.price} is below minimum ${MIN_PRICE}`);
    }

    if (inputs.price > MAX_PRICE) {
      errors.push(`Price ${inputs.price} exceeds maximum ${MAX_PRICE}`);
    }

    // Validate order type
    if (inputs.orderType !== 'BUY' && inputs.orderType !== 'SELL') {
      errors.push(`Invalid order type: ${inputs.orderType}`);
    }

    // Validate expiration
    if (inputs.expiration <= inputs.timestamp) {
      errors.push('Expiration must be in the future');
    }

    const maxExpiration = inputs.timestamp + (365 * 24 * 60 * 60 * 1000); // 1 year
    if (inputs.expiration > maxExpiration) {
      warnings.push('Expiration is more than 1 year in the future');
    }

    // Validate nonce
    if (inputs.nonce === 0n) {
      warnings.push('Nonce is zero (consider using random nonce)');
    }

    // Validate owner
    if (!inputs.owner || inputs.owner.length === 0) {
      errors.push('Owner address is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate trade conservation proof inputs
   */
  validateTradeConservationProofInputs(inputs: {
    inputAssets: string[];
    inputAmounts: bigint[];
    outputAssets: string[];
    outputAmounts: bigint[];
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate input arrays
    if (inputs.inputAssets.length !== inputs.inputAmounts.length) {
      errors.push('Input assets and amounts length mismatch');
    }

    if (inputs.outputAssets.length !== inputs.outputAmounts.length) {
      errors.push('Output assets and amounts length mismatch');
    }

    // Validate conservation per asset
    const inputsByAsset = new Map<string, bigint>();
    const outputsByAsset = new Map<string, bigint>();

    // Sum inputs by asset
    for (let i = 0; i < inputs.inputAssets.length; i++) {
      const asset = inputs.inputAssets[i];
      const amount = inputs.inputAmounts[i];
      
      const current = inputsByAsset.get(asset) || 0n;
      inputsByAsset.set(asset, current + amount);
    }

    // Sum outputs by asset
    for (let i = 0; i < inputs.outputAssets.length; i++) {
      const asset = inputs.outputAssets[i];
      const amount = inputs.outputAmounts[i];
      
      const current = outputsByAsset.get(asset) || 0n;
      outputsByAsset.set(asset, current + amount);
    }

    // Check conservation for each asset
    const allAssets = new Set([
      ...inputsByAsset.keys(),
      ...outputsByAsset.keys(),
    ]);

    for (const asset of allAssets) {
      const inputTotal = inputsByAsset.get(asset) || 0n;
      const outputTotal = outputsByAsset.get(asset) || 0n;

      if (inputTotal !== outputTotal) {
        errors.push(
          `Conservation violated for asset ${asset}: ` +
          `inputs=${inputTotal}, outputs=${outputTotal}`
        );
      }
    }

    // Validate no negative amounts
    for (const amount of inputs.inputAmounts) {
      if (amount < 0n) {
        errors.push('Input amounts cannot be negative');
      }
    }

    for (const amount of inputs.outputAmounts) {
      if (amount < 0n) {
        errors.push('Output amounts cannot be negative');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate matching correctness proof inputs
   */
  validateMatchingCorrectnessProofInputs(inputs: {
    orders: Array<{
      baseAsset: string;
      quoteAsset: string;
      amount: bigint;
      price: bigint;
      orderType: 'BUY' | 'SELL';
    }>;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (inputs.orders.length < 2) {
      errors.push('At least 2 orders required for matching');
    }

    if (inputs.orders.length % 2 !== 0) {
      warnings.push('Odd number of orders (some may not match)');
    }

    // Validate each pair
    for (let i = 0; i < inputs.orders.length; i += 2) {
      if (i + 1 >= inputs.orders.length) break;

      const order1 = inputs.orders[i];
      const order2 = inputs.orders[i + 1];

      // Check asset pair compatibility
      if (order1.baseAsset !== order2.baseAsset) {
        errors.push(`Orders ${i} and ${i + 1}: base asset mismatch`);
      }

      if (order1.quoteAsset !== order2.quoteAsset) {
        errors.push(`Orders ${i} and ${i + 1}: quote asset mismatch`);
      }

      // Check order types
      if (order1.orderType === order2.orderType) {
        errors.push(`Orders ${i} and ${i + 1}: both are ${order1.orderType} orders`);
      }

      // Check price compatibility
      const buyOrder = order1.orderType === 'BUY' ? order1 : order2;
      const sellOrder = order1.orderType === 'SELL' ? order1 : order2;

      if (buyOrder.price < sellOrder.price) {
        errors.push(
          `Orders ${i} and ${i + 1}: buy price ${buyOrder.price} < sell price ${sellOrder.price}`
        );
      }

      // Check amount compatibility
      if (order1.amount !== order2.amount) {
        warnings.push(`Orders ${i} and ${i + 1}: amount mismatch (partial fills not supported)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate all constraints before proof generation
   */
  validateAll(
    circuitType: string,
    inputs: any
  ): ValidationResult {
    switch (circuitType) {
      case 'balance':
        return this.validateBalanceProofInputs(inputs);
      case 'orderValidity':
        return this.validateOrderValidityProofInputs(inputs);
      case 'tradeConservation':
        return this.validateTradeConservationProofInputs(inputs);
      case 'matchingCorrectness':
        return this.validateMatchingCorrectnessProofInputs(inputs);
      default:
        return {
          valid: false,
          errors: [`Unknown circuit type: ${circuitType}`],
          warnings: [],
        };
    }
  }
}

/**
 * Global circuit validator instance
 */
export const circuitValidator = new CircuitValidator();
