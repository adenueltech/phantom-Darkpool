/**
 * Viewing Key Management
 * 
 * Manages viewing keys for selective disclosure and compliance.
 * Allows users to grant auditors access to specific data.
 * 
 * Requirements: 14.4, 14.7
 */

import { poseidonHashMany } from '../crypto/poseidon';
import { DataScope } from '../types';

/**
 * Viewing key structure
 */
export interface ViewingKey {
  keyId: string;
  owner: string;
  dataScope: DataScope;
  expiration: number;
  revoked: boolean;
  decryptionKey: string;
  createdAt: number;
}

/**
 * Viewing Key Manager
 * Handles creation, storage, and revocation of viewing keys
 */
export class ViewingKeyManager {
  private masterKey: bigint;
  private keys: Map<string, ViewingKey> = new Map();

  constructor(masterKey: bigint) {
    this.masterKey = masterKey;
  }

  /**
   * Create viewing key for selective disclosure
   * 
   * @param owner - Owner's address
   * @param dataScope - Scope of data access
   * @param expirationMs - Expiration time in milliseconds from now
   * @returns Viewing key
   */
  async createViewingKey(
    owner: string,
    dataScope: DataScope,
    expirationMs: number = 86400000 // Default 24 hours
  ): Promise<ViewingKey> {
    // Generate unique key ID
    const keyId = await this.generateKeyId(owner, dataScope);

    // Derive decryption key from master key
    const decryptionKey = await this.deriveDecryptionKey(keyId);

    const viewingKey: ViewingKey = {
      keyId,
      owner,
      dataScope,
      expiration: Date.now() + expirationMs,
      revoked: false,
      decryptionKey,
      createdAt: Date.now(),
    };

    // Store viewing key
    this.keys.set(keyId, viewingKey);

    return viewingKey;
  }

  /**
   * Revoke viewing key
   * 
   * @param keyId - Key ID to revoke
   */
  revokeViewingKey(keyId: string): void {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error('Viewing key not found');
    }

    key.revoked = true;
    this.keys.set(keyId, key);
  }

  /**
   * Check if viewing key is valid
   * 
   * @param keyId - Key ID to check
   * @returns True if key is valid
   */
  isKeyValid(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (!key) {
      return false;
    }

    // Check if revoked
    if (key.revoked) {
      return false;
    }

    // Check if expired
    if (Date.now() > key.expiration) {
      return false;
    }

    return true;
  }

  /**
   * Get viewing key
   * 
   * @param keyId - Key ID
   * @returns Viewing key or undefined
   */
  getViewingKey(keyId: string): ViewingKey | undefined {
    return this.keys.get(keyId);
  }

  /**
   * Get all viewing keys for owner
   * 
   * @param owner - Owner's address
   * @returns Array of viewing keys
   */
  getViewingKeysByOwner(owner: string): ViewingKey[] {
    return Array.from(this.keys.values()).filter(key => key.owner === owner);
  }

  /**
   * Get active viewing keys
   * 
   * @returns Array of active viewing keys
   */
  getActiveViewingKeys(): ViewingKey[] {
    return Array.from(this.keys.values()).filter(key => this.isKeyValid(key.keyId));
  }

  /**
   * Register viewing key on-chain
   * 
   * @param viewingKey - Viewing key to register
   * @param apiEndpoint - Backend API endpoint
   */
  async registerViewingKeyOnChain(
    viewingKey: ViewingKey,
    apiEndpoint: string = '/api/v1/audit/viewing-keys'
  ): Promise<void> {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyId: viewingKey.keyId,
        dataScope: viewingKey.dataScope,
        expiration: viewingKey.expiration,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register viewing key: ${response.statusText}`);
    }
  }

  /**
   * Revoke viewing key on-chain
   * 
   * @param keyId - Key ID to revoke
   * @param apiEndpoint - Backend API endpoint
   */
  async revokeViewingKeyOnChain(
    keyId: string,
    apiEndpoint: string = '/api/v1/audit/viewing-keys'
  ): Promise<void> {
    const response = await fetch(`${apiEndpoint}/${keyId}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to revoke viewing key: ${response.statusText}`);
    }

    // Revoke locally
    this.revokeViewingKey(keyId);
  }

  /**
   * Decrypt data using viewing key
   * 
   * @param encryptedData - Encrypted data
   * @param keyId - Viewing key ID
   * @returns Decrypted data
   */
  async decryptWithViewingKey(
    encryptedData: string,
    keyId: string
  ): Promise<string> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error('Viewing key not found');
    }

    if (!this.isKeyValid(keyId)) {
      throw new Error('Viewing key is invalid or expired');
    }

    // Decrypt data using the viewing key's decryption key
    return this.decrypt(encryptedData, key.decryptionKey);
  }

  /**
   * Generate unique key ID
   */
  private async generateKeyId(owner: string, dataScope: DataScope): Promise<string> {
    const ownerBigInt = this.addressToBigInt(owner);
    const scopeBigInt = BigInt(this.dataScopeToNumber(dataScope));
    const timestampBigInt = BigInt(Date.now());

    const keyId = await poseidonHashMany([ownerBigInt, scopeBigInt, timestampBigInt]);
    return '0x' + keyId.toString(16).padStart(64, '0');
  }

  /**
   * Derive decryption key from master key and key ID
   */
  private async deriveDecryptionKey(keyId: string): Promise<string> {
    const keyIdBigInt = BigInt(keyId);
    const decryptionKey = await poseidonHashMany([this.masterKey, keyIdBigInt]);
    return '0x' + decryptionKey.toString(16).padStart(64, '0');
  }

  /**
   * Decrypt data
   */
  private async decrypt(encryptedData: string, decryptionKey: string): Promise<string> {
    // Convert decryption key to CryptoKey
    const keyBytes = this.hexToBytes(decryptionKey);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Parse encrypted data (format: iv:ciphertext)
    const [ivHex, ciphertextHex] = encryptedData.split(':');
    const iv = this.hexToBytes(ivHex);
    const ciphertext = this.hexToBytes(ciphertextHex);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Convert address to bigint
   */
  private addressToBigInt(address: string): bigint {
    const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
    return BigInt('0x' + cleanAddress);
  }

  /**
   * Convert data scope to number
   */
  private dataScopeToNumber(scope: DataScope): number {
    switch (scope) {
      case DataScope.BALANCE_NOTE:
        return 1;
      case DataScope.ORDER_COMMITMENT:
        return 2;
      case DataScope.TRADE_HISTORY:
        return 3;
      case DataScope.ALL:
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Export viewing keys for backup
   */
  exportKeys(): string {
    const keysArray = Array.from(this.keys.values());
    return JSON.stringify(keysArray);
  }

  /**
   * Import viewing keys from backup
   */
  importKeys(data: string): void {
    const keysArray = JSON.parse(data) as ViewingKey[];
    for (const key of keysArray) {
      this.keys.set(key.keyId, key);
    }
  }

  /**
   * Clear all viewing keys
   */
  clearAll(): void {
    this.keys.clear();
  }
}
