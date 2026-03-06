/**
 * Type declarations for snarkjs
 * Since snarkjs doesn't provide official TypeScript types,
 * we declare the minimal interface we need.
 */

declare module 'snarkjs' {
  export interface Groth16Proof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }

  export interface PublicSignals extends Array<string> {}

  export interface ProofData {
    proof: Groth16Proof;
    publicSignals: PublicSignals;
  }

  export namespace groth16 {
    export function fullProve(
      input: any,
      wasmFile: string,
      zkeyFile: string
    ): Promise<ProofData>;

    export function verify(
      vKey: any,
      publicSignals: PublicSignals,
      proof: Groth16Proof
    ): Promise<boolean>;

    export function exportSolidityCallData(
      proof: Groth16Proof,
      publicSignals: PublicSignals
    ): Promise<string>;
  }

  export namespace plonk {
    export function fullProve(
      input: any,
      wasmFile: string,
      zkeyFile: string
    ): Promise<ProofData>;

    export function verify(
      vKey: any,
      publicSignals: PublicSignals,
      proof: any
    ): Promise<boolean>;
  }

  export namespace powersOfTau {
    export function newAccumulator(
      curve: string,
      power: number,
      fileName: string
    ): Promise<void>;

    export function contribute(
      oldPtauFile: string,
      newPTauFile: string,
      name: string,
      entropy: string
    ): Promise<void>;
  }

  export namespace zKey {
    export function newZKey(
      r1csFile: string,
      ptauFile: string,
      zkeyFile: string
    ): Promise<void>;

    export function contribute(
      oldZkeyFile: string,
      newZkeyFile: string,
      name: string,
      entropy: string
    ): Promise<void>;

    export function exportVerificationKey(zkeyFile: string): Promise<any>;
  }

  export namespace r1cs {
    export function info(r1csFile: string): Promise<any>;
  }
}
