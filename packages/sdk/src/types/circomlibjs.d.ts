/**
 * Type declarations for circomlibjs
 */

declare module 'circomlibjs' {
  export interface PoseidonInstance {
    (inputs: bigint[]): any;
    F: {
      toObject(value: any): bigint;
    };
  }

  export function buildPoseidon(): Promise<PoseidonInstance>;
}
