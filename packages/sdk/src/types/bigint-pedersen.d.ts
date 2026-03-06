/**
 * Type declarations for bigint-pedersen
 */

declare module 'bigint-pedersen' {
  export interface PedersenParameters {
    g: bigint;
    h: bigint;
    p: bigint;
  }

  export interface Pedersen {
    DEFAULT_GENERRATOR: PedersenParameters;
    modExp(base: bigint, exponent: bigint, mod: bigint): bigint;
    modInverse(a: bigint, p: bigint): bigint;
    randomBlinding(bytes?: number): bigint;
    isPrimeMillerRabin(n: bigint, k?: number): boolean;
    generator(bits?: number): Promise<PedersenParameters>;
    commitment(m: bigint, r: bigint, params: PedersenParameters): bigint;
    sum(C1: bigint, C2: bigint, params: PedersenParameters): bigint;
    sub(C1: bigint, C2: bigint, params: PedersenParameters): bigint;
    multiply(C: bigint, scalar: bigint, params: PedersenParameters): bigint;
  }

  const pedersen: Pedersen;
  export default pedersen;
}
