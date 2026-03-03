/**
 * Type definitions for Phantom Darkpool SDK
 */

export type AssetAddress = string;
export type Bytes32 = string;
export type BigIntString = string;

export interface Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface ViewingKey {
  keyId: Bytes32;
  owner: string;
  dataScope: DataScope;
  expiration: number;
  revoked: boolean;
}

export enum DataScope {
  BALANCE_NOTE = 'BALANCE_NOTE',
  ORDER_COMMITMENT = 'ORDER_COMMITMENT',
  TRADE_HISTORY = 'TRADE_HISTORY',
  ALL = 'ALL',
}

export interface MerkleProof {
  leaf: Bytes32;
  siblings: Bytes32[];
  pathIndices: number[];
  root: Bytes32;
}
