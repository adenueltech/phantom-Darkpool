/**
 * Proof Generation Functions
 * 
 * Generates zero-knowledge proofs using SnarkJS for:
 * - Balance proofs
 * - Order validity proofs
 * - Trade conservation proofs
 * - Matching correctness proofs
 * 
 * Requirements: 14.3, 14.5
 */

import * as snarkjs from 'snarkjs';
import { BalanceNote } from './balanceNoteManager';
import { OrderParams } from './orderCommitmentManager';
import { MerkleProof } from '../types';
import { ProofOptimizer, proofOptimizer } from './proofOptimizer';

/**
 * Proof structure
 */
export interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

/**
 * Circuit paths configuration
 */
export interface CircuitPaths {
  wasmPath: string;
  zkeyPath: string;
}

/**
 * Proof Generator
 * Handles generation of all zero-knowledge proofs
 */
export class ProofGenerator {
  private circuitPaths: Map<string, CircuitPaths> = new Map();
  private optimizer: ProofOptimizer;

  constructor(optimizer?: ProofOptimizer) {
    // Initialize default circuit paths
    this.initializeCircuitPaths();
    // Use provided optimizer or global instance
    this.optimizer = optimizer || proofOptimizer;
  }

  /**
   * Initialize circuit paths
   */
  private initializeCircuitPaths(): void {
    this.circuitPaths.set('balance', {
      wasmPath: '/circuits/balance_proof.wasm',
      zkeyPath: '/circuits/balance_proof_final.zkey',
    });

    this.circuitPaths.set('orderValidity', {
      wasmPath: '/circuits/order_validity_proof.wasm',
      zkeyPath: '/circuits/order_validity_proof_final.zkey',
    });

    this.circuitPaths.set('tradeConservation', {
      wasmPath: '/circuits/trade_conservation_proof.wasm',
      zkeyPath: '/circuits/trade_conservation_proof_final.zkey',
    });

    this.circuitPaths.set('matchingCorrectness', {
      wasmPath: '/circuits/matching_correctness_proof.wasm',
      zkeyPath: '/circuits/matching_correctness_proof_final.zkey',
    });
  }

  /**
   * Set custom circuit paths
   */
  setCircuitPaths(circuitName: string, paths: CircuitPaths): void {
    this.circuitPaths.set(circuitName, paths);
  }

  /**
   * Generate balance proof
   * Proves ownership of sufficient funds without revealing amount
   * 
   * Public inputs: merkleRoot, nullifier, minAmount
   * Private inputs: asset, amount, salt, owner, nullifierSecret, merkleProof
   * 
   * @param note - Balance note
   * @param merkleProof - Merkle proof for the note
   * @param nullifierSecret - Secret for nullifier generation
   * @param minAmount - Minimum required amount
   * @returns Zero-knowledge proof
   */
  async generateBalanceProof(
    note: BalanceNote,
    merkleProof: MerkleProof,
    nullifierSecret: bigint,
    minAmount: bigint
  ): Promise<Proof> {
    const paths = this.circuitPaths.get('balance');
    if (!paths) {
      throw new Error('Balance proof circuit paths not configured');
    }

    // Prepare circuit inputs
    const input = {
      // Public inputs
      merkleRoot: merkleProof.root,
      nullifier: note.nullifier,
      minAmount: minAmount.toString(),

      // Private inputs
      asset: this.addressToBigInt(note.asset).toString(),
      amount: note.amount.toString(),
      salt: note.salt.toString(),
      owner: this.addressToBigInt(note.owner).toString(),
      nullifierSecret: nullifierSecret.toString(),
      merkleProof: merkleProof.siblings.map(s => s.toString()),
      pathIndices: merkleProof.pathIndices,
    };

    // Use optimizer for proof generation
    return await this.optimizer.optimizedProofGeneration(
      'balance',
      input,
      async () => {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
          input,
          paths.wasmPath,
          paths.zkeyPath
        );
        return this.formatProof(proof);
      }
    );
  }

  /**
   * Generate order validity proof
   * Proves order parameters are within allowed ranges
   * 
   * Public inputs: orderCommitmentHash, timestamp
   * Private inputs: baseAsset, quoteAsset, amount, price, orderType, expiration, nonce, owner
   * 
   * @param orderParams - Order parameters
   * @param nonce - Order nonce
   * @param commitmentHash - Order commitment hash
   * @returns Zero-knowledge proof
   */
  async generateOrderValidityProof(
    orderParams: OrderParams,
    nonce: bigint,
    commitmentHash: string
  ): Promise<Proof> {
    const paths = this.circuitPaths.get('orderValidity');
    if (!paths) {
      throw new Error('Order validity proof circuit paths not configured');
    }

    // Prepare circuit inputs
    const input = {
      // Public inputs
      orderCommitmentHash: commitmentHash,
      timestamp: Date.now().toString(),

      // Private inputs
      baseAsset: this.addressToBigInt(orderParams.baseAsset).toString(),
      quoteAsset: this.addressToBigInt(orderParams.quoteAsset).toString(),
      amount: orderParams.amount.toString(),
      price: orderParams.price.toString(),
      orderType: (orderParams.orderType === 'BUY' ? 0 : 1).toString(),
      expiration: orderParams.expiration.toString(),
      nonce: nonce.toString(),
      owner: this.addressToBigInt(orderParams.owner).toString(),
    };

    // Generate proof using SnarkJS
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      paths.wasmPath,
      paths.zkeyPath
    );

    return this.formatProof(proof);
  }

  /**
   * Generate trade conservation proof
   * Proves that trade inputs equal outputs (no value created/destroyed)
   * 
   * @param inputNotes - Input balance notes being spent
   * @param outputNotes - Output balance notes being created
   * @param executionId - Unique execution identifier
   * @returns Zero-knowledge proof
   */
  async generateTradeConservationProof(
    inputNotes: BalanceNote[],
    outputNotes: BalanceNote[],
    executionId: string
  ): Promise<Proof> {
    const paths = this.circuitPaths.get('tradeConservation');
    if (!paths) {
      throw new Error('Trade conservation proof circuit paths not configured');
    }

    // Prepare circuit inputs
    const input = {
      // Public inputs
      executionId,
      inputNullifiers: inputNotes.map(n => n.nullifier),
      outputCommitments: outputNotes.map(n => n.commitment),

      // Private inputs
      inputAssets: inputNotes.map(n => this.addressToBigInt(n.asset).toString()),
      inputAmounts: inputNotes.map(n => n.amount.toString()),
      inputSalts: inputNotes.map(n => n.salt.toString()),
      inputOwners: inputNotes.map(n => this.addressToBigInt(n.owner).toString()),

      outputAssets: outputNotes.map(n => this.addressToBigInt(n.asset).toString()),
      outputAmounts: outputNotes.map(n => n.amount.toString()),
      outputSalts: outputNotes.map(n => n.salt.toString()),
      outputOwners: outputNotes.map(n => this.addressToBigInt(n.owner).toString()),
    };

    // Generate proof using SnarkJS
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      paths.wasmPath,
      paths.zkeyPath
    );

    return this.formatProof(proof);
  }

  /**
   * Generate matching correctness proof
   * Proves that matched orders satisfy price compatibility rules
   * 
   * @param orders - Array of matched orders
   * @param executionId - Unique execution identifier
   * @returns Zero-knowledge proof
   */
  async generateMatchingCorrectnessProof(
    orders: Array<{ params: OrderParams; nonce: bigint; commitmentHash: string }>,
    executionId: string
  ): Promise<Proof> {
    const paths = this.circuitPaths.get('matchingCorrectness');
    if (!paths) {
      throw new Error('Matching correctness proof circuit paths not configured');
    }

    // Prepare circuit inputs
    const input = {
      // Public inputs
      orderCommitmentHashes: orders.map(o => o.commitmentHash),
      executionId,

      // Private inputs
      baseAssets: orders.map(o => this.addressToBigInt(o.params.baseAsset).toString()),
      quoteAssets: orders.map(o => this.addressToBigInt(o.params.quoteAsset).toString()),
      amounts: orders.map(o => o.params.amount.toString()),
      prices: orders.map(o => o.params.price.toString()),
      orderTypes: orders.map(o => (o.params.orderType === 'BUY' ? 0 : 1).toString()),
      expirations: orders.map(o => o.params.expiration.toString()),
      nonces: orders.map(o => o.nonce.toString()),
      owners: orders.map(o => this.addressToBigInt(o.params.owner).toString()),
    };

    // Generate proof using SnarkJS
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      paths.wasmPath,
      paths.zkeyPath
    );

    return this.formatProof(proof);
  }

  /**
   * Verify a proof
   * 
   * @param proof - Proof to verify
   * @param publicSignals - Public signals
   * @param verificationKey - Verification key
   * @returns True if proof is valid
   */
  async verifyProof(
    proof: Proof,
    publicSignals: string[],
    verificationKey: any
  ): Promise<boolean> {
    return await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
  }

  /**
   * Format proof for submission
   */
  private formatProof(proof: any): Proof {
    return {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: proof.protocol || 'groth16',
      curve: proof.curve || 'bn128',
    };
  }

  /**
   * Convert address to bigint
   */
  private addressToBigInt(address: string): bigint {
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    return BigInt('0x' + cleanAddress);
  }

  /**
   * Load circuit files (for browser environment)
   */
  async loadCircuitFiles(circuitName: string): Promise<void> {
    const paths = this.circuitPaths.get(circuitName);
    if (!paths) {
      throw new Error(`Circuit ${circuitName} not configured`);
    }

    // Pre-load circuit files for faster proof generation
    try {
      await fetch(paths.wasmPath);
      await fetch(paths.zkeyPath);
    } catch (error) {
      console.warn(`Failed to pre-load circuit files for ${circuitName}:`, error);
    }
  }

  /**
   * Pre-load all circuit files
   */
  async preloadAllCircuits(): Promise<void> {
    const circuitNames = Array.from(this.circuitPaths.keys());
    await Promise.all(circuitNames.map(name => this.loadCircuitFiles(name)));
    
    // Pre-compile circuits for optimization
    await this.optimizer.precompileAllCircuits(this.circuitPaths);
  }

  /**
   * Get optimizer instance
   */
  getOptimizer(): ProofOptimizer {
    return this.optimizer;
  }

  /**
   * Generate multiple proofs in parallel
   * Optimized batch proof generation
   */
  async generateProofsParallel(
    tasks: Array<{
      type: 'balance' | 'orderValidity' | 'tradeConservation' | 'matchingCorrectness';
      params: any;
    }>
  ): Promise<Proof[]> {
    const proofTasks = tasks.map(task => {
      switch (task.type) {
        case 'balance':
          return {
            circuitName: 'balance',
            inputs: task.params,
            generateFn: () => this.generateBalanceProof(
              task.params.note,
              task.params.merkleProof,
              task.params.nullifierSecret,
              task.params.minAmount
            ),
          };
        case 'orderValidity':
          return {
            circuitName: 'orderValidity',
            inputs: task.params,
            generateFn: () => this.generateOrderValidityProof(
              task.params.orderParams,
              task.params.nonce,
              task.params.commitmentHash
            ),
          };
        case 'tradeConservation':
          return {
            circuitName: 'tradeConservation',
            inputs: task.params,
            generateFn: () => this.generateTradeConservationProof(
              task.params.inputNotes,
              task.params.outputNotes,
              task.params.executionId
            ),
          };
        case 'matchingCorrectness':
          return {
            circuitName: 'matchingCorrectness',
            inputs: task.params,
            generateFn: () => this.generateMatchingCorrectnessProof(
              task.params.orders,
              task.params.executionId
            ),
          };
        default:
          throw new Error(`Unknown proof type: ${task.type}`);
      }
    });

    return await this.optimizer.batchOptimizedProofGeneration(proofTasks);
  }
}
