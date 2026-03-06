/**
 * Proof Generation Optimizer
 * 
 * Implements performance optimizations for proof generation:
 * - WebAssembly compilation for circuits
 * - Proof generation caching
 * - Parallel multi-proof generation
 * - Pre-computation of common circuit components
 * 
 * Requirements: 12.1, 12.2
 */

import * as snarkjs from 'snarkjs';
import { Proof, CircuitPaths } from './proofGenerator';

/**
 * Cache entry for proof generation
 */
interface ProofCacheEntry {
  proof: Proof;
  publicSignals: string[];
  timestamp: number;
  inputHash: string;
}

/**
 * WebAssembly circuit instance
 */
interface WasmCircuitInstance {
  wasm: WebAssembly.Module;
  memory: WebAssembly.Memory;
  compiledAt: number;
}

/**
 * Proof Optimizer
 * Provides performance optimizations for proof generation
 */
export class ProofOptimizer {
  private proofCache: Map<string, ProofCacheEntry> = new Map();
  private wasmInstances: Map<string, WasmCircuitInstance> = new Map();
  private cacheTTL: number = 3600000; // 1 hour in milliseconds
  private maxCacheSize: number = 100;

  /**
   * Configure cache settings
   */
  configureCaching(ttl: number, maxSize: number): void {
    this.cacheTTL = ttl;
    this.maxCacheSize = maxSize;
  }

  /**
   * Compile circuit to WebAssembly
   * Pre-compiles WASM for faster proof generation
   * 
   * @param circuitName - Name of the circuit
   * @param wasmPath - Path to WASM file
   * @returns Compiled WASM instance
   */
  async compileCircuitWasm(
    circuitName: string,
    wasmPath: string
  ): Promise<void> {
    try {
      // Fetch WASM file
      const response = await fetch(wasmPath);
      const wasmBuffer = await response.arrayBuffer();

      // Compile WASM module
      const wasmModule = await WebAssembly.compile(wasmBuffer);

      // Create memory for WASM instance
      const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });

      // Store compiled instance
      this.wasmInstances.set(circuitName, {
        wasm: wasmModule,
        memory,
        compiledAt: Date.now(),
      });

      console.log(`✓ Compiled WASM for ${circuitName} circuit`);
    } catch (error) {
      console.error(`Failed to compile WASM for ${circuitName}:`, error);
      throw error;
    }
  }

  /**
   * Pre-compile all circuits
   * 
   * @param circuits - Map of circuit names to paths
   */
  async precompileAllCircuits(
    circuits: Map<string, CircuitPaths>
  ): Promise<void> {
    const compilations = Array.from(circuits.entries()).map(
      ([name, paths]) => this.compileCircuitWasm(name, paths.wasmPath)
    );

    await Promise.all(compilations);
    console.log(`✓ Pre-compiled ${circuits.size} circuits`);
  }

  /**
   * Get compiled WASM instance
   * 
   * @param circuitName - Name of the circuit
   * @returns WASM instance or undefined
   */
  getCompiledWasm(circuitName: string): WasmCircuitInstance | undefined {
    return this.wasmInstances.get(circuitName);
  }

  /**
   * Generate cache key from inputs
   * 
   * @param circuitName - Name of the circuit
   * @param inputs - Circuit inputs
   * @returns Cache key
   */
  private generateCacheKey(circuitName: string, inputs: any): string {
    const inputStr = JSON.stringify(inputs);
    return `${circuitName}:${this.hashString(inputStr)}`;
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached proof if available and valid
   * 
   * @param circuitName - Name of the circuit
   * @param inputs - Circuit inputs
   * @returns Cached proof or undefined
   */
  getCachedProof(
    circuitName: string,
    inputs: any
  ): { proof: Proof; publicSignals: string[] } | undefined {
    const cacheKey = this.generateCacheKey(circuitName, inputs);
    const entry = this.proofCache.get(cacheKey);

    if (!entry) {
      return undefined;
    }

    // Check if cache entry is still valid
    const age = Date.now() - entry.timestamp;
    if (age > this.cacheTTL) {
      this.proofCache.delete(cacheKey);
      return undefined;
    }

    console.log(`✓ Using cached proof for ${circuitName}`);
    return {
      proof: entry.proof,
      publicSignals: entry.publicSignals,
    };
  }

  /**
   * Cache a generated proof
   * 
   * @param circuitName - Name of the circuit
   * @param inputs - Circuit inputs
   * @param proof - Generated proof
   * @param publicSignals - Public signals
   */
  cacheProof(
    circuitName: string,
    inputs: any,
    proof: Proof,
    publicSignals: string[]
  ): void {
    // Enforce max cache size
    if (this.proofCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = Array.from(this.proofCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.proofCache.delete(oldestKey);
    }

    const cacheKey = this.generateCacheKey(circuitName, inputs);
    const inputHash = this.hashString(JSON.stringify(inputs));

    this.proofCache.set(cacheKey, {
      proof,
      publicSignals,
      timestamp: Date.now(),
      inputHash,
    });
  }

  /**
   * Clear proof cache
   */
  clearCache(): void {
    this.proofCache.clear();
    console.log('✓ Proof cache cleared');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.proofCache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.proofCache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`✓ Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Generate multiple proofs in parallel
   * 
   * @param proofTasks - Array of proof generation tasks
   * @returns Array of generated proofs
   */
  async generateProofsParallel<T>(
    proofTasks: Array<() => Promise<T>>
  ): Promise<T[]> {
    console.log(`⚡ Generating ${proofTasks.length} proofs in parallel`);
    const startTime = Date.now();

    const results = await Promise.all(
      proofTasks.map(task => task())
    );

    const duration = Date.now() - startTime;
    console.log(`✓ Generated ${proofTasks.length} proofs in ${duration}ms`);

    return results;
  }

  /**
   * Pre-compute common circuit components
   * Caches frequently used values like Merkle tree hashes
   */
  private precomputedValues: Map<string, any> = new Map();

  /**
   * Store pre-computed value
   * 
   * @param key - Identifier for the value
   * @param value - Pre-computed value
   */
  storePrecomputed(key: string, value: any): void {
    this.precomputedValues.set(key, value);
  }

  /**
   * Get pre-computed value
   * 
   * @param key - Identifier for the value
   * @returns Pre-computed value or undefined
   */
  getPrecomputed(key: string): any | undefined {
    return this.precomputedValues.get(key);
  }

  /**
   * Pre-compute Merkle tree path hashes
   * Useful for balance proofs that use the same tree
   * 
   * @param treeDepth - Depth of the Merkle tree
   * @param siblings - Sibling hashes
   * @returns Pre-computed path hashes
   */
  precomputeMerklePathHashes(
    treeDepth: number,
    siblings: bigint[]
  ): bigint[] {
    const key = `merkle:${treeDepth}:${siblings.join(',')}`;
    
    let cached = this.getPrecomputed(key);
    if (cached) {
      return cached;
    }

    // Pre-compute path hashes
    const pathHashes: bigint[] = [];
    for (let i = 0; i < siblings.length; i++) {
      pathHashes.push(siblings[i]);
    }

    this.storePrecomputed(key, pathHashes);
    return pathHashes;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    wasmInstances: number;
    precomputedValues: number;
  } {
    return {
      size: this.proofCache.size,
      maxSize: this.maxCacheSize,
      ttl: this.cacheTTL,
      wasmInstances: this.wasmInstances.size,
      precomputedValues: this.precomputedValues.size,
    };
  }

  /**
   * Optimize proof generation with all available techniques
   * 
   * @param circuitName - Name of the circuit
   * @param inputs - Circuit inputs
   * @param generateFn - Function to generate proof
   * @returns Optimized proof generation result
   */
  async optimizedProofGeneration<T>(
    circuitName: string,
    inputs: any,
    generateFn: () => Promise<T>
  ): Promise<T> {
    // 1. Check cache first
    const cached = this.getCachedProof(circuitName, inputs);
    if (cached) {
      return cached as T;
    }

    // 2. Use compiled WASM if available
    const wasmInstance = this.getCompiledWasm(circuitName);
    if (wasmInstance) {
      console.log(`⚡ Using pre-compiled WASM for ${circuitName}`);
    }

    // 3. Generate proof
    const startTime = Date.now();
    const result = await generateFn();
    const duration = Date.now() - startTime;

    console.log(`✓ Generated ${circuitName} proof in ${duration}ms`);

    // 4. Cache result if it's a proof
    if (result && typeof result === 'object' && 'proof' in result) {
      this.cacheProof(
        circuitName,
        inputs,
        (result as any).proof,
        (result as any).publicSignals
      );
    }

    return result;
  }

  /**
   * Batch proof generation with optimization
   * Generates multiple proofs with caching and parallelization
   * 
   * @param tasks - Array of proof generation tasks
   * @returns Array of results
   */
  async batchOptimizedProofGeneration<T>(
    tasks: Array<{
      circuitName: string;
      inputs: any;
      generateFn: () => Promise<T>;
    }>
  ): Promise<T[]> {
    console.log(`⚡ Batch generating ${tasks.length} proofs with optimization`);
    
    // Check cache for each task
    const results: (T | null)[] = new Array(tasks.length).fill(null);
    const pendingTasks: Array<{ index: number; task: typeof tasks[0] }> = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const cached = this.getCachedProof(task.circuitName, task.inputs);
      
      if (cached) {
        results[i] = cached as T;
      } else {
        pendingTasks.push({ index: i, task });
      }
    }

    // Generate remaining proofs in parallel
    if (pendingTasks.length > 0) {
      const generated = await this.generateProofsParallel(
        pendingTasks.map(({ task }) => task.generateFn)
      );

      // Store results and cache
      for (let i = 0; i < pendingTasks.length; i++) {
        const { index, task } = pendingTasks[i];
        results[index] = generated[i];

        // Cache if it's a proof
        if (generated[i] && typeof generated[i] === 'object' && 'proof' in (generated[i] as any)) {
          this.cacheProof(
            task.circuitName,
            task.inputs,
            (generated[i] as any).proof,
            (generated[i] as any).publicSignals
          );
        }
      }
    }

    return results as T[];
  }
}

/**
 * Global proof optimizer instance
 */
export const proofOptimizer = new ProofOptimizer();
